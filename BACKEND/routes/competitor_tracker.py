"""
Competitor Price Tracking API Routes
Manage competitor monitoring, price comparisons, and alerts
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Product, CompetitorPrice, CompetitorAlert
from utils.competitor_tracker import CompetitorPriceManager
from datetime import datetime
import json

competitor_bp = Blueprint('competitor', __name__, url_prefix='/api/competitor')

def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


@competitor_bp.route('/tracking', methods=['GET'])
@jwt_required()
def get_competitor_tracking():
    """Get all competitor price tracking entries"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        product_id = request.args.get('product_id', type=int)

        query = CompetitorPrice.query

        if product_id:
            query = query.filter_by(product_id=product_id)

        query = query.order_by(CompetitorPrice.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)

        tracking = [track.to_dict() for track in paginate.items]

        return jsonify({
            'message': 'Competitor tracking retrieved',
            'data': {
                'tracking': tracking,
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
        return jsonify({'error': 'Failed to retrieve tracking'}), 500


@competitor_bp.route('/tracking', methods=['POST'])
@jwt_required()
def add_competitor_tracking():
    """Add a new competitor product to track"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()

        if not data or 'product_id' not in data or 'competitor_url' not in data:
            return jsonify({'error': 'product_id and competitor_url are required'}), 400

        product_id = data['product_id']
        competitor_url = data['competitor_url']
        competitor_name = data.get('competitor_name')
        check_frequency_hours = data.get('check_frequency_hours', 24)

        # Validate product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        # Add tracking
        manager = CompetitorPriceManager(db.session)
        result = manager.add_competitor_tracking(
            product_id=product_id,
            competitor_url=competitor_url,
            competitor_name=competitor_name,
            check_frequency_hours=check_frequency_hours
        )

        if not result['success']:
            return jsonify({'error': result['error']}), 400

        return jsonify({
            'message': 'Competitor tracking added successfully',
            'data': {'tracking_id': result['competitor_price_id']}
        }), 201

    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to add tracking'}), 500


@competitor_bp.route('/tracking/<int:tracking_id>', methods=['PUT'])
@jwt_required()
def update_competitor_tracking(tracking_id):
    """Update competitor tracking settings"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()
        tracking = CompetitorPrice.query.get(tracking_id)

        if not tracking:
            return jsonify({'error': 'Tracking not found'}), 404

        # Update fields
        if 'competitor_url' in data:
            tracking.competitor_url = data['competitor_url']
        if 'competitor_name' in data:
            tracking.competitor_name = data['competitor_name']
        if 'check_frequency_hours' in data:
            tracking.check_frequency_hours = data['check_frequency_hours']
        if 'is_active' in data:
            tracking.is_active = data['is_active']

        db.session.commit()

        return jsonify({
            'message': 'Tracking updated successfully',
            'data': tracking.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to update tracking'}), 500


@competitor_bp.route('/tracking/<int:tracking_id>', methods=['DELETE'])
@jwt_required()
def delete_competitor_tracking(tracking_id):
    """Delete competitor tracking"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        tracking = CompetitorPrice.query.get(tracking_id)

        if not tracking:
            return jsonify({'error': 'Tracking not found'}), 404

        db.session.delete(tracking)
        db.session.commit()

        return jsonify({'message': 'Tracking deleted successfully'}), 200

    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to delete tracking'}), 500


@competitor_bp.route('/tracking/<int:tracking_id>/update', methods=['POST'])
@jwt_required()
def update_competitor_price(tracking_id):
    """Manually update competitor price"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        manager = CompetitorPriceManager(db.session)
        result = manager.update_competitor_price(tracking_id)

        if not result['success']:
            return jsonify({'error': result['error']}), 400

        return jsonify({
            'message': 'Price updated successfully',
            'data': result
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to update price'}), 500


@competitor_bp.route('/update-all', methods=['POST'])
@jwt_required()
def update_all_competitor_prices():
    """Update all competitor prices (admin only)"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        manager = CompetitorPriceManager(db.session)
        results = manager.update_all_competitor_prices()

        successful = len([r for r in results if r['success']])
        failed = len([r for r in results if not r['success']])

        return jsonify({
            'message': f'Updated {successful} successfully, {failed} failed',
            'data': {
                'total_processed': len(results),
                'successful': successful,
                'failed': failed,
                'results': results
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to update prices'}), 500


@competitor_bp.route('/comparison/<int:product_id>', methods=['GET'])
@jwt_required()
def get_price_comparison(product_id):
    """Get price comparison for a specific product"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        manager = CompetitorPriceManager(db.session)
        result = manager.get_price_comparison(product_id)

        if not result['success']:
            return jsonify({'error': result['error']}), 404

        return jsonify({
            'message': 'Price comparison retrieved',
            'data': result['data']
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to get comparison'}), 500


@competitor_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_competitor_alerts():
    """Get competitor price alerts"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        status = request.args.get('status')  # pending, reviewed, dismissed, action_taken

        query = CompetitorAlert.query

        if status:
            query = query.filter_by(status=status)

        query = query.order_by(CompetitorAlert.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)

        alerts = [alert.to_dict() for alert in paginate.items]

        return jsonify({
            'message': 'Alerts retrieved',
            'data': {
                'alerts': alerts,
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
        return jsonify({'error': 'Failed to retrieve alerts'}), 500


@competitor_bp.route('/alerts/<int:alert_id>', methods=['PUT'])
@jwt_required()
def update_competitor_alert(alert_id):
    """Update alert status and notes"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()
        alert = CompetitorAlert.query.get(alert_id)

        if not alert:
            return jsonify({'error': 'Alert not found'}), 404

        if 'status' in data:
            alert.status = data['status']
        if 'admin_notes' in data:
            alert.admin_notes = data['admin_notes']

        db.session.commit()

        return jsonify({
            'message': 'Alert updated successfully',
            'data': alert.to_dict()
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to update alert'}), 500


@competitor_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_competitor_dashboard():
    """Get competitor dashboard summary"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        # Get summary statistics
        total_tracking = CompetitorPrice.query.filter_by(is_active=True).count()
        total_alerts = CompetitorAlert.query.filter_by(status='pending').count()

        # Get recent alerts
        recent_alerts = CompetitorAlert.query.filter_by(status='pending').order_by(
            CompetitorAlert.created_at.desc()
        ).limit(5).all()

        # Get products with competitor undercutting
        undercut_products = db.session.query(CompetitorPrice).join(
            Product, CompetitorPrice.product_id == Product.id
        ).filter(
            CompetitorPrice.is_active == True,
            CompetitorPrice.is_available == True,
            CompetitorPrice.competitor_price < Product.price
        ).limit(10).all()

        dashboard = {
            'summary': {
                'total_tracking': total_tracking,
                'pending_alerts': total_alerts,
                'undercut_products': len(undercut_products)
            },
            'recent_alerts': [alert.to_dict() for alert in recent_alerts],
            'undercut_products': [{
                'product_name': cp.product.name,
                'competitor_name': cp.competitor_name,
                'your_price': cp.product.price,
                'competitor_price': cp.competitor_price,
                'difference': round(cp.product.price - cp.competitor_price, 2)
            } for cp in undercut_products if cp.product]
        }

        return jsonify({
            'message': 'Dashboard data retrieved',
            'data': dashboard
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to get dashboard'}), 500


@competitor_bp.route('/best-deals', methods=['GET'])
@jwt_required()
def get_best_deal_products():
    """Get product IDs that have the best price among competitors"""
    try:
        user_id = int(get_jwt_identity())
        # Allow any authenticated user to see best deals (not just admins)

        # Get all products with competitor tracking
        competitor_prices = CompetitorPrice.query.filter(
            CompetitorPrice.competitor_price.isnot(None),
            CompetitorPrice.is_available == True
        ).all()

        best_deal_product_ids = set()

        # Group by product and find best deals
        product_competitors = {}
        for cp in competitor_prices:
            if cp.product_id not in product_competitors:
                product_competitors[cp.product_id] = []
            product_competitors[cp.product_id].append(cp.competitor_price)

        # Check each product
        for product_id, competitor_prices_list in product_competitors.items():
            product = Product.query.get(product_id)
            if not product:
                continue

            # Product is a best deal if its price is lower than all competitors
            min_competitor_price = min(competitor_prices_list)
            if product.price < min_competitor_price:
                best_deal_product_ids.add(product_id)

        return jsonify({
            'message': 'Best deal products retrieved',
            'data': {
                'best_deal_product_ids': list(best_deal_product_ids)
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to get best deals'}), 500