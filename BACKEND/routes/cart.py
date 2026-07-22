"""
Cart Routes for Nexus Wholesale Hub
Handles shopping cart operations
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, Cart, CartItem, Product, User
from datetime import datetime
from utils.security import safe_error_response
from utils.location_validation import is_user_location_active

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')


def get_or_create_cart(user_id):
    """Get user's cart or create one if it doesn't exist"""
    cart = Cart.query.filter_by(user_id=user_id).first()
    
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()
    
    return cart


@cart_bp.route('', methods=['GET'])
@jwt_required()
def get_cart():
    """Get user's cart"""
    try:
        user_id = int(get_jwt_identity())
        cart = get_or_create_cart(user_id)
        
        return jsonify({
            'message': 'Cart retrieved successfully',
            'data': cart.to_dict()
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve cart')


@cart_bp.route('/add', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")
def add_to_cart():
    """
    Add item to cart
    
    Request body:
    {
        "product_id": 1,
        "quantity": 2
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Check if user's location is active
        is_active, region_name, city_name, reason = is_user_location_active(user_id)
        if not is_active:
            return jsonify({
                'error': 'Service not available in your location',
                'reason': reason
            }), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        if not product_id:
            return jsonify({'error': 'product_id is required'}), 400
        
        if not isinstance(quantity, int) or quantity < 1:
            return jsonify({'error': 'quantity must be a positive integer'}), 400
        
        # Get product
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Check stock
        if product.stock_quantity < quantity:
            return jsonify({
                'error': f'Insufficient stock. Available: {product.stock_quantity}'
            }), 400
        
        # Get or create cart
        cart = get_or_create_cart(user_id)
        
        # Check if item already in cart
        cart_item = CartItem.query.filter_by(
            cart_id=cart.id,
            product_id=product_id
        ).first()
        
        if cart_item:
            # Update quantity if item already exists
            new_quantity = cart_item.quantity + quantity
            if product.stock_quantity < new_quantity:
                return jsonify({
                    'error': f'Insufficient stock. Available: {product.stock_quantity}'
                }), 400
            cart_item.quantity = new_quantity
        else:
            # Add new item
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity,
                price_at_purchase=product.discounted_price
            )
            db.session.add(cart_item)
        
        cart.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Item added to cart successfully',
            'data': {
                'cart': cart.to_dict(),
                'item': cart_item.to_dict()
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to add item to cart')


@cart_bp.route('/item/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(item_id):
    """
    Update cart item quantity
    
    Request body:
    {
        "quantity": 3
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        quantity = data.get('quantity')
        
        if not isinstance(quantity, int) or quantity < 0:
            return jsonify({'error': 'quantity must be a non-negative integer'}), 400
        
        # Get cart item
        cart_item = CartItem.query.get(item_id)
        
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Verify user owns this cart
        if cart_item.cart.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        if quantity == 0:
            # Remove item if quantity is 0
            db.session.delete(cart_item)
        else:
            # Check stock
            product = cart_item.product
            if product.stock_quantity < quantity:
                return jsonify({
                    'error': f'Insufficient stock. Available: {product.stock_quantity}'
                }), 400
            
            cart_item.quantity = quantity
        
        cart = cart_item.cart
        cart.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cart item updated successfully',
            'data': cart.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update cart item')


@cart_bp.route('/item/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(item_id):
    """Remove item from cart"""
    try:
        user_id = int(get_jwt_identity())
        
        # Get cart item
        cart_item = CartItem.query.get(item_id)
        
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Verify user owns this cart
        if cart_item.cart.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        cart = cart_item.cart
        db.session.delete(cart_item)
        cart.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Item removed from cart successfully',
            'data': cart.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to remove item from cart')


@cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear entire cart"""
    try:
        user_id = int(get_jwt_identity())
        
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart:
            return jsonify({'error': 'Cart not found'}), 404
        
        # Delete all items
        CartItem.query.filter_by(cart_id=cart.id).delete()
        cart.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Cart cleared successfully',
            'data': cart.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to clear cart')
