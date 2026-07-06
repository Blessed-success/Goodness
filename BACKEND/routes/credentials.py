"""
Admin Credential Management Routes
Handles secure credential management, password changes, and access control
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, User, AdminCredential, PasswordHistory
from datetime import datetime
from utils.security import safe_error_response
import json

credentials_bp = Blueprint('credentials', __name__, url_prefix='/api/admin/credentials')

def is_super_admin(user_id):
    """Check if user is super admin"""
    cred = AdminCredential.query.filter_by(user_id=user_id).first()
    return cred and cred.role == 'super_admin' and cred.is_active

def is_admin(user_id):
    """Check if user is admin or super admin"""
    cred = AdminCredential.query.filter_by(user_id=user_id).first()
    return cred and cred.is_active

# ==================== SUPER ADMIN CREDENTIAL MANAGEMENT ====================

@credentials_bp.route('/list', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")
def list_admin_credentials():
    """List all admin credentials (super admin only)"""
    try:
        user_id = get_jwt_identity()
        
        if not is_super_admin(user_id):
            return jsonify({'error': 'Super admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', '').strip()
        
        query = AdminCredential.query
        
        if search:
            query = query.filter(
                (AdminCredential.username.ilike(f'%{search}%')) |
                (AdminCredential.email.ilike(f'%{search}%'))
            )
        
        if role_filter in ['admin', 'super_admin']:
            query = query.filter_by(role=role_filter)
        
        paginate = query.order_by(AdminCredential.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        credentials = [cred.to_dict() for cred in paginate.items]
        
        return jsonify({
            'message': 'Admin credentials retrieved successfully',
            'data': {
                'credentials': credentials,
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
        return safe_error_response('Failed to retrieve credentials')


@credentials_bp.route('/create', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def create_admin_credential():
    """Create new admin credential (super admin only)"""
    try:
        user_id = get_jwt_identity()
        
        if not is_super_admin(user_id):
            return jsonify({'error': 'Super admin access required'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['user_id', 'username', 'email', 'password', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user exists
        user = User.query.get(data.get('user_id'))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if credential already exists
        if AdminCredential.query.filter_by(user_id=user.id).first():
            return jsonify({'error': 'Credential already exists for this user'}), 409
        
        # Create credential
        credential = AdminCredential(
            user_id=user.id,
            username=data.get('username'),
            email=data.get('email'),
            role=data.get('role'),
            is_active=data.get('is_active', True),
            updated_by=get_jwt_identity()
        )
        credential.set_password(data.get('password'))
        
        db.session.add(credential)
        db.session.commit()
        
        return jsonify({
            'message': 'Admin credential created successfully',
            'data': credential.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create credential')


@credentials_bp.route('/<int:credential_id>/update-password', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def update_admin_password(credential_id):
    """Update admin password"""
    try:
        user_id = get_jwt_identity()
        credential = AdminCredential.query.get(credential_id)
        
        if not credential:
            return jsonify({'error': 'Credential not found'}), 404
        
        # Check authorization: super admin or own credential
        if not (is_super_admin(user_id) or credential.user_id == user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        new_password = data.get('new_password', '').strip()
        
        if not new_password or len(new_password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        
        # If not super admin, require old password verification
        if not is_super_admin(user_id):
            old_password = data.get('old_password', '')
            if not old_password or not credential.check_password(old_password):
                return jsonify({'error': 'Old password is incorrect'}), 401
        
        # Check password history to prevent reuse
        recent_hashes = [ph.password_hash for ph in credential.password_history[-3:]]
        from werkzeug.security import check_password_hash
        if any(check_password_hash(ph, new_password) for ph in recent_hashes):
            return jsonify({'error': 'Password was recently used. Please choose a different password'}), 400
        
        credential.set_password(new_password)
        if is_super_admin(user_id):
            credential.updated_by = User.query.get(user_id).email
        
        db.session.commit()
        
        return jsonify({
            'message': 'Password updated successfully',
            'data': {
                'credential_id': credential.id,
                'last_password_change': credential.last_password_change.isoformat()
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update password')


@credentials_bp.route('/<int:credential_id>/toggle-active', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def toggle_credential_active(credential_id):
    """Toggle credential active status (super admin only)"""
    try:
        user_id = get_jwt_identity()
        
        if not is_super_admin(user_id):
            return jsonify({'error': 'Super admin access required'}), 403
        
        credential = AdminCredential.query.get(credential_id)
        
        if not credential:
            return jsonify({'error': 'Credential not found'}), 404
        
        credential.is_active = not credential.is_active
        credential.updated_by = User.query.get(user_id).email
        credential.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'Credential {"activated" if credential.is_active else "deactivated"}',
            'data': credential.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update credential')


@credentials_bp.route('/<int:credential_id>/unlock', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def unlock_credential(credential_id):
    """Unlock locked admin credential (super admin only)"""
    try:
        user_id = get_jwt_identity()
        
        if not is_super_admin(user_id):
            return jsonify({'error': 'Super admin access required'}), 403
        
        credential = AdminCredential.query.get(credential_id)
        
        if not credential:
            return jsonify({'error': 'Credential not found'}), 404
        
        credential.is_locked = False
        credential.locked_until = None
        credential.login_attempts = 0
        credential.updated_by = User.query.get(user_id).email
        credential.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Credential unlocked successfully',
            'data': credential.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to unlock credential')


@credentials_bp.route('/<int:credential_id>/password-history', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
def get_password_history(credential_id):
    """Get password change history"""
    try:
        user_id = get_jwt_identity()
        credential = AdminCredential.query.get(credential_id)
        
        if not credential:
            return jsonify({'error': 'Credential not found'}), 404
        
        # Check authorization
        if not (is_super_admin(user_id) or credential.user_id == user_id):
            return jsonify({'error': 'Unauthorized'}), 403
        
        history = PasswordHistory.query.filter_by(
            admin_credential_id=credential_id
        ).order_by(PasswordHistory.changed_at.desc()).all()
        
        return jsonify({
            'message': 'Password history retrieved',
            'data': {
                'credential_id': credential_id,
                'history': [h.to_dict() for h in history]
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve password history')


@credentials_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_credential_profile():
    """Get current user's credential profile"""
    try:
        user_id = get_jwt_identity()
        credential = AdminCredential.query.filter_by(user_id=user_id).first()
        
        if not credential:
            return jsonify({'error': 'Credential not found'}), 404
        
        return jsonify({
            'message': 'Profile retrieved successfully',
            'data': credential.to_dict()
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve profile')


@credentials_bp.route('/audit-log', methods=['GET'])
@jwt_required()
@limiter.limit("20 per minute")
def get_credential_audit_log():
    """Get audit log of credential changes (super admin only)"""
    try:
        user_id = get_jwt_identity()
        
        if not is_super_admin(user_id):
            return jsonify({'error': 'Super admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 50)), 100)
        
        credentials = AdminCredential.query.order_by(
            AdminCredential.updated_at.desc()
        ).paginate(page=page, per_page=limit, error_out=False)
        
        audit_data = []
        for cred in credentials.items:
            audit_data.append({
                'credential_id': cred.id,
                'username': cred.username,
                'email': cred.email,
                'role': cred.role,
                'is_active': cred.is_active,
                'last_login': cred.last_login.isoformat() if cred.last_login else None,
                'last_password_change': cred.last_password_change.isoformat(),
                'updated_at': cred.updated_at.isoformat(),
                'updated_by': cred.updated_by,
                'is_locked': cred.is_locked,
                'login_attempts': cred.login_attempts
            })
        
        return jsonify({
            'message': 'Audit log retrieved',
            'data': {
                'audit_entries': audit_data,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': credentials.total,
                    'pages': credentials.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve audit log')
