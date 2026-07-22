"""
Wishlist Routes for Nexus Wholesale Hub
Lets a logged-in customer save/remove products for later
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, WishlistItem, Product
from utils.security import safe_error_response

wishlist_bp = Blueprint('wishlist', __name__, url_prefix='/api/wishlist')


@wishlist_bp.route('', methods=['GET'])
@jwt_required()
def get_wishlist():
    """Get the current user's wishlist"""
    try:
        user_id = int(get_jwt_identity())
        items = (
            WishlistItem.query
            .filter_by(user_id=user_id)
            .order_by(WishlistItem.created_at.desc())
            .all()
        )
        return jsonify({
            'message': 'Wishlist retrieved successfully',
            'data': [item.to_dict() for item in items]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve wishlist')


@wishlist_bp.route('', methods=['POST'])
@jwt_required()
@limiter.limit("30 per minute")
def add_to_wishlist():
    """
    Add a product to the wishlist

    Request body:
    {
        "product_id": 1
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data or not data.get('product_id'):
            return jsonify({'error': 'product_id is required'}), 400

        product_id = data.get('product_id')
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        existing = WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            return jsonify({
                'message': 'Product already in wishlist',
                'data': existing.to_dict()
            }), 200

        item = WishlistItem(user_id=user_id, product_id=product_id)
        db.session.add(item)
        db.session.commit()

        return jsonify({
            'message': 'Product added to wishlist',
            'data': item.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to add product to wishlist')


@wishlist_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    """Remove a product from the wishlist"""
    try:
        user_id = int(get_jwt_identity())

        item = WishlistItem.query.filter_by(user_id=user_id, product_id=product_id).first()
        if not item:
            return jsonify({'error': 'Product not in wishlist'}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({'message': 'Product removed from wishlist'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to remove product from wishlist')
