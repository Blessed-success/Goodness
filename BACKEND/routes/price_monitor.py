"""
Price Monitoring API Routes
Endpoints for checking prices, viewing alerts, and managing updates
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Product, PriceAlert
from utils.price_monitor import PriceMonitor, PriceAlertManager
from utils.scheduler import SchedulerManager

price_monitor_bp = Blueprint('price_monitor', __name__, url_prefix='/api/price-monitor')


def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


@price_monitor_bp.route('/status', methods=['GET'])
@jwt_required()
def get_monitor_status():
    """Get price monitor and scheduler status"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        scheduler_status = SchedulerManager.get_status()
        
        # Get stats
        total_monitored = Product.query.filter_by(is_price_monitored=True).count()
        pending_alerts = PriceAlert.query.filter_by(status='pending').count()
        alert_summary = PriceAlertManager.get_alert_summary()
        
        return jsonify({
            'message': 'Monitor status',
            'data': {
                'scheduler': scheduler_status,
                'stats': {
                    'total_monitored_products': total_monitored,
                    'pending_alerts': pending_alerts,
                    'price_increases': alert_summary.get('price_increases', 0),
                    'price_decreases': alert_summary.get('price_decreases', 0),
                    'highest_increase_percent': alert_summary.get('highest_increase_percent', 0),
                    'highest_decrease_percent': alert_summary.get('highest_decrease_percent', 0),
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': f'Failed to get status: {str(e)}'}), 500


@price_monitor_bp.route('/enable/<int:product_id>', methods=['POST'])
@jwt_required()
def enable_monitoring(product_id):
    """Enable price monitoring for a product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if not product.source_url:
            return jsonify({'error': 'Product has no source URL'}), 400
        
        product.is_price_monitored = True
        db.session.commit()
        
        return jsonify({
            'message': 'Price monitoring enabled',
            'data': {
                'product_id': product.id,
                'product_name': product.name,
                'source_url': product.source_url,
                'is_price_monitored': product.is_price_monitored
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to enable monitoring'}), 500


@price_monitor_bp.route('/disable/<int:product_id>', methods=['POST'])
@jwt_required()
def disable_monitoring(product_id):
    """Disable price monitoring for a product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        product.is_price_monitored = False
        db.session.commit()
        
        return jsonify({
            'message': 'Price monitoring disabled',
            'data': {
                'product_id': product.id,
                'product_name': product.name
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        db.session.rollback()
        return jsonify({'error': 'Failed to disable monitoring'}), 500


@price_monitor_bp.route('/manual-check', methods=['POST'])
@jwt_required()
def manual_price_check():
    """Manually trigger price check for all products"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Run price check in background
        result = SchedulerManager.trigger_manual_check()
        
        return jsonify({
            'message': 'Price check completed',
            'data': result
        }), 202
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Price check failed'}), 500


@price_monitor_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_price_alerts():
    """Get price alerts with filtering"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters
        status = request.args.get('status')  # pending, approved, dismissed, auto_updated
        alert_type = request.args.get('type')  # price_increase, price_decrease
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        
        # Build query
        query = PriceAlert.query
        
        if status:
            query = query.filter_by(status=status)
        
        if alert_type:
            query = query.filter_by(alert_type=alert_type)
        
        # Order by newest first
        query = query.order_by(PriceAlert.created_at.desc())
        
        # Paginate
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        alerts = [alert.to_dict() for alert in paginate.items]
        
        return jsonify({
            'message': 'Price alerts retrieved',
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


@price_monitor_bp.route('/alerts/<int:alert_id>/approve', methods=['POST'])
@jwt_required()
def approve_alert(alert_id):
    """Admin approves a price alert and applies update"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json() or {}
        notes = data.get('notes')
        
        result = PriceAlertManager.approve_alert(alert_id)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        return jsonify({
            'message': 'Alert approved and price updated',
            'data': result
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to approve alert'}), 500


@price_monitor_bp.route('/alerts/<int:alert_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_alert(alert_id):
    """Admin dismisses a price alert without updating"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json() or {}
        notes = data.get('notes', 'Dismissed by admin')
        
        result = PriceAlertManager.dismiss_alert(alert_id, notes)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        return jsonify({
            'message': 'Alert dismissed',
            'data': result
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to dismiss alert'}), 500


@price_monitor_bp.route('/alerts/summary', methods=['GET'])
@jwt_required()
def get_alerts_summary():
    """Get summary of pending price alerts"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        summary = PriceAlertManager.get_alert_summary()
        
        return jsonify({
            'message': 'Alert summary',
            'data': summary
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to get summary'}), 500


@price_monitor_bp.route('/products/monitored', methods=['GET'])
@jwt_required()
def get_monitored_products():
    """Get all products with price monitoring enabled"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        
        query = Product.query.filter_by(is_price_monitored=True).order_by(Product.name)
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        products = [{
            **product.to_dict(include_stock=True),
            'source_url': product.source_url,
            'supplier_price_rmb': product.supplier_price_rmb,
            'profit_margin_percent': product.profit_margin_percent,
            'last_scraped_at': product.last_scraped_at.isoformat() if product.last_scraped_at else None,
            'pending_alerts': PriceAlert.query.filter_by(
                product_id=product.id,
                status='pending'
            ).count()
        } for product in paginate.items]
        
        return jsonify({
            'message': 'Monitored products',
            'data': {
                'products': products,
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
        return jsonify({'error': 'Failed to retrieve products'}), 500


@price_monitor_bp.route('/product/<int:product_id>/alerts', methods=['GET'])
@jwt_required()
def get_product_alerts(product_id):
    """Get all price alerts for a specific product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        limit = min(int(request.args.get('limit', 20)), 100)
        
        alerts = PriceAlert.query.filter_by(product_id=product_id).order_by(
            PriceAlert.created_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'message': 'Product price alerts',
            'data': {
                'product_id': product.id,
                'product_name': product.name,
                'alerts': [alert.to_dict() for alert in alerts]
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to retrieve alerts'}), 500
