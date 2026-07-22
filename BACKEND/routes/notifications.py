"""
Notification Routes for Nexus Wholesale Hub
In-app notifications for order updates and other account events
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Notification
from utils.security import safe_error_response

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')


def create_notification(user_id, title, message=None, link=None, type='system'):
    """Create a notification row. Callers should wrap this so a failure here
    never blocks the action that triggered it (e.g. an order status update)."""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
    )
    db.session.add(notification)
    return notification


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get the current user's notifications, paginated, with unread_count"""
    try:
        user_id = int(get_jwt_identity())
        page = request.args.get('page', 1, type=int)
        limit = min(request.args.get('limit', 20, type=int), 50)
        if page < 1:
            page = 1

        query = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc())
        paginate = query.paginate(page=page, per_page=limit, error_out=False)

        unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

        return jsonify({
            'message': 'Notifications retrieved successfully',
            'data': {
                'notifications': [n.to_dict() for n in paginate.items],
                'unread_count': unread_count,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages,
                    'has_next': paginate.has_next,
                    'has_prev': paginate.has_prev,
                },
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve notifications')


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a single notification as read"""
    try:
        user_id = int(get_jwt_identity())
        notification = Notification.query.get(notification_id)

        if not notification:
            return jsonify({'error': 'Notification not found'}), 404
        if notification.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        notification.is_read = True
        db.session.commit()

        return jsonify({'message': 'Notification marked as read', 'data': notification.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update notification')


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all of the current user's notifications as read"""
    try:
        user_id = int(get_jwt_identity())
        Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
        db.session.commit()

        return jsonify({'message': 'All notifications marked as read'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update notifications')
