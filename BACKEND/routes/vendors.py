"""
Vendor Routes for Nexus Wholesale Hub
Marketplace seller application, storefront profile, own products/earnings
"""

import re
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, Vendor, VendorEarning, Product, User, OrderItem, Order
from datetime import datetime
from utils.security import safe_error_response

vendors_bp = Blueprint('vendors', __name__, url_prefix='/api/vendors')

VENDOR_FIELDS = ['store_name', 'logo_url', 'banner_url', 'description', 'whatsapp_number']


def _slugify(text):
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return slug or 'store'


def _unique_slug(base_slug, exclude_vendor_id=None):
    slug = base_slug
    suffix = 1
    while True:
        query = Vendor.query.filter_by(slug=slug)
        if exclude_vendor_id:
            query = query.filter(Vendor.id != exclude_vendor_id)
        if not query.first():
            return slug
        suffix += 1
        slug = f'{base_slug}-{suffix}'


def _get_own_vendor(user_id):
    return Vendor.query.filter_by(user_id=user_id).first()


@vendors_bp.route('/apply', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def apply_as_vendor():
    """
    Apply to become a marketplace seller (pending admin approval)

    Request body:
    {
        "store_name": "Kojo's Electronics",
        "description": "...",
        "whatsapp_number": "+233..."
    }
    """
    try:
        user_id = int(get_jwt_identity())

        if _get_own_vendor(user_id):
            return jsonify({'error': 'You already have a vendor application/profile'}), 409

        data = request.get_json()
        if not data or not data.get('store_name'):
            return jsonify({'error': 'store_name is required'}), 400

        store_name = data['store_name'].strip()
        slug = _unique_slug(_slugify(store_name))

        vendor = Vendor(
            user_id=user_id,
            store_name=store_name,
            slug=slug,
            description=data.get('description'),
            whatsapp_number=data.get('whatsapp_number'),
            is_approved=False,
        )
        db.session.add(vendor)

        user = User.query.get(user_id)
        if user:
            user.is_vendor = True

        db.session.commit()

        return jsonify({
            'message': 'Vendor application submitted — pending admin approval',
            'data': vendor.to_dict(include_contact=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to submit vendor application')


@vendors_bp.route('/<slug>', methods=['GET'])
def get_vendor_by_slug(slug):
    """Public storefront profile for a vendor"""
    try:
        vendor = Vendor.query.filter_by(slug=slug, is_approved=True, is_active=True).first()
        if not vendor:
            return jsonify({'error': 'Store not found'}), 404

        products = Product.query.filter_by(vendor_id=vendor.id).all()
        ratings = [p.rating for p in products if p.review_count]
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None

        data = vendor.to_dict()
        data['product_count'] = len(products)
        data['rating'] = avg_rating
        # The vendor's own chosen contact number, unlike commission_percent/user_id
        # (which stay behind include_contact=True) — needed for buyers to reach
        # the seller directly, same as the site-wide WhatsApp support number.
        data['whatsapp_number'] = vendor.whatsapp_number

        return jsonify({'message': 'Vendor retrieved successfully', 'data': data}), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor')


@vendors_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_vendor_profile():
    """Get the current user's own vendor profile"""
    try:
        user_id = int(get_jwt_identity())
        vendor = _get_own_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'No vendor profile found'}), 404

        return jsonify({'message': 'Vendor profile retrieved', 'data': vendor.to_dict(include_contact=True)}), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor profile')


@vendors_bp.route('/me', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_my_vendor_profile():
    """Update the current user's own vendor profile (whitelisted fields)"""
    try:
        user_id = int(get_jwt_identity())
        vendor = _get_own_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'No vendor profile found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        for field in VENDOR_FIELDS:
            if field in data:
                setattr(vendor, field, data[field])

        if 'store_name' in data and data['store_name'].strip():
            new_slug = _unique_slug(_slugify(data['store_name']), exclude_vendor_id=vendor.id)
            vendor.slug = new_slug

        vendor.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Vendor profile updated', 'data': vendor.to_dict(include_contact=True)}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update vendor profile')


@vendors_bp.route('/me/products', methods=['GET'])
@jwt_required()
def get_my_vendor_products():
    """List the current vendor's own products"""
    try:
        user_id = int(get_jwt_identity())
        vendor = _get_own_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'No vendor profile found'}), 404

        products = Product.query.filter_by(vendor_id=vendor.id).order_by(Product.created_at.desc()).all()

        return jsonify({
            'message': 'Products retrieved successfully',
            'data': [p.to_dict(include_stock=True) for p in products]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor products')


@vendors_bp.route('/me/orders', methods=['GET'])
@jwt_required()
def get_my_vendor_orders():
    """List order items containing the current vendor's products, most recent first"""
    try:
        user_id = int(get_jwt_identity())
        vendor = _get_own_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'No vendor profile found'}), 404

        rows = (
            db.session.query(OrderItem, Order)
            .join(Order, OrderItem.order_id == Order.id)
            .join(Product, OrderItem.product_id == Product.id)
            .filter(Product.vendor_id == vendor.id)
            .order_by(Order.created_at.desc())
            .limit(100)
            .all()
        )

        data = [{
            'order_id': order.id,
            'order_number': order.order_number,
            'order_status': order.status,
            'payment_status': order.payment_status,
            'created_at': order.created_at.isoformat(),
            'item': item.to_dict(),
        } for item, order in rows]

        return jsonify({'message': 'Vendor orders retrieved successfully', 'data': data}), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor orders')


@vendors_bp.route('/me/earnings', methods=['GET'])
@jwt_required()
def get_my_vendor_earnings():
    """List the current vendor's commission-ledger entries + totals"""
    try:
        user_id = int(get_jwt_identity())
        vendor = _get_own_vendor(user_id)
        if not vendor:
            return jsonify({'error': 'No vendor profile found'}), 404

        earnings = (
            VendorEarning.query
            .filter_by(vendor_id=vendor.id)
            .order_by(VendorEarning.created_at.desc())
            .all()
        )

        total_net = sum(e.net_amount for e in earnings)
        unpaid_net = sum(e.net_amount for e in earnings if e.payout_status == 'unpaid')

        return jsonify({
            'message': 'Earnings retrieved successfully',
            'data': {
                'earnings': [e.to_dict() for e in earnings],
                'total_net': round(total_net, 2),
                'unpaid_net': round(unpaid_net, 2),
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor earnings')
