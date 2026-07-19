"""
Order Routes for BlessedNet Wholesale Hub
Handles order creation, management, and tracking
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, Order, OrderItem, Cart, CartItem, Product, User, Region
from datetime import datetime
from utils.security import safe_error_response
from utils.location_validation import is_user_location_active
import uuid

orders_bp = Blueprint('orders', __name__, url_prefix='/api/orders')


def generate_order_number():
    """Generate unique order number"""
    return f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"


@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_user_orders():
    """
    Get user's orders with pagination
    
    Query parameters:
    - page: page number (default 1)
    - limit: items per page (default 10)
    - status: filter by status
    """
    try:
        user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 10)), 50)
        status = request.args.get('status', '').strip()
        
        query = Order.query.filter_by(user_id=user_id)
        
        if status:
            query = query.filter_by(status=status)
        
        query = query.order_by(Order.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        orders = [order.to_dict() for order in paginate.items]
        
        return jsonify({
            'message': 'Orders retrieved successfully',
            'data': {
                'orders': orders,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages,
                    'has_next': paginate.has_next,
                    'has_prev': paginate.has_prev
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve orders')


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get specific order"""
    try:
        user_id = int(get_jwt_identity())
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Verify user owns this order
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'message': 'Order retrieved successfully',
            'data': order.to_dict()
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve order')


@orders_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def create_order():
    """
    Create order from cart. Delivery/shipping cost is never accepted from the
    client — it's always the admin-configured fee for the user's region.

    Request body:
    {
        "shipping_address": "123 Main St",
        "shipping_city": "Accra",
        "shipping_phone": "+233123456789",
        "notes": "Please deliver in the morning"
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
        
        data = request.get_json() or {}
        
        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart or len(cart.items) == 0:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Validate shipping information
        required_fields = ['shipping_address', 'shipping_city', 'shipping_phone']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Delivery fee is always the admin-configured fee for the user's
        # region — is_user_location_active() above already guarantees the
        # user has an active region/city, so this is always resolvable.
        user = User.query.get(user_id)
        region = Region.query.get(user.region_id) if user and user.region_id else None
        shipping_cost = float(region.delivery_fee) if region and region.delivery_fee is not None else 0.0

        # Create order and reserve items until payment is verified
        order = Order(
            user_id=user_id,
            order_number=generate_order_number(),
            total_amount=cart.total_price + shipping_cost,
            shipping_address=data['shipping_address'].strip(),
            shipping_city=data['shipping_city'].strip(),
            shipping_phone=data['shipping_phone'].strip(),
            shipping_cost=shipping_cost,
            delivery_fee=shipping_cost,
            notes=data.get('notes', '').strip(),
            payment_method=data.get('payment_method', 'paystack'),
            status='pending',
            payment_status='pending'
        )

        # Copy cart items to order and verify stock availability
        for cart_item in cart.items:
            product = cart_item.product
            if product.stock_quantity < cart_item.quantity:
                return jsonify({
                    'error': f'Insufficient stock for {product.name}. Available: {product.stock_quantity}'
                }), 400

            order_item = OrderItem(
                order=order,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                price_at_purchase=cart_item.price_at_purchase,
                discount_percent=cart_item.product.discount_percent
            )
            db.session.add(order_item)

        db.session.add(order)
        db.session.commit()
        
        return jsonify({
            'message': 'Order created successfully',
            'data': order.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create order')


@orders_bp.route('/<int:order_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_order(order_id):
    """Cancel an order"""
    try:
        user_id = int(get_jwt_identity())
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Verify user owns this order
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if order can be cancelled
        if order.status in ['shipped', 'delivered', 'cancelled']:
            return jsonify({'error': f'Cannot cancel order with status: {order.status}'}), 400
        
        order.status = 'cancelled'
        order.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Order cancelled successfully',
            'data': order.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to cancel order')


# Admin routes

@orders_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def get_all_orders():
    """Get all orders (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        status = request.args.get('status', '').strip()
        
        query = Order.query
        
        if status:
            query = query.filter_by(status=status)
        
        query = query.order_by(Order.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        orders = [order.to_dict() for order in paginate.items]
        
        return jsonify({
            'message': 'Orders retrieved successfully',
            'data': {
                'orders': orders,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve orders')


@orders_bp.route('/admin/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """
    Update order status (admin only)
    
    Request body:
    {
        "status": "processing",
        "notes": "Order is being prepared"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        if not data or 'status' not in data:
            return jsonify({'error': 'status is required'}), 400
        
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        status = data['status'].lower()
        
        if status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}), 400
        
        order.status = status
        order.updated_at = datetime.utcnow()
        
        # Update status timestamps
        if status == 'processing':
            order.paid_at = datetime.utcnow()
        elif status == 'shipped':
            order.shipped_at = datetime.utcnow()
        elif status == 'delivered':
            order.delivered_at = datetime.utcnow()
        
        if 'notes' in data:
            order.notes = data['notes'].strip() if isinstance(data['notes'], str) else order.notes
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order status updated successfully',
            'data': order.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update order status')
