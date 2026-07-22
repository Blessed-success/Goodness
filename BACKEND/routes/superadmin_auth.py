"""
Super Admin Authentication Routes
Provides quick, secure access for super admin with special security measures
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User, AdminCredential
from utils.security import safe_error_response
from datetime import datetime, timedelta
from utils.limiter import limiter
import os

superadmin_auth_bp = Blueprint('superadmin_auth', __name__, url_prefix='/api/superadmin')

# Store super admin setup status
SUPER_ADMIN_INITIALIZED = False

@superadmin_auth_bp.route('/init-setup', methods=['POST'])
@limiter.limit("3 per hour")  # Strict rate limit for security
def initialize_super_admin():
    """
    Initialize super admin account on first setup
    This endpoint is only available if no super admin exists
    """
    try:
        # Check if super admin already exists
        existing_super_admin = AdminCredential.query.filter_by(role='super_admin').first()
        if existing_super_admin:
            return jsonify({'error': 'Super admin already initialized'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required = ['email', 'password', 'setup_key']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify setup key (from environment for security)
        setup_key = os.getenv('SUPERADMIN_SETUP_KEY', 'default-setup-key-change-this')
        if data.get('setup_key') != setup_key:
            current_app.logger.warning(f'Invalid super admin setup attempt from {request.remote_addr}')
            return jsonify({'error': 'Invalid setup key'}), 401
        
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        full_name = data.get('full_name', 'Super Administrator')
        
        # Validate email format
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters'}), 400
        if not any(c.isupper() for c in password):
            return jsonify({'error': 'Password must contain uppercase letter'}), 400
        if not any(c.isdigit() for c in password):
            return jsonify({'error': 'Password must contain digit'}), 400
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
            return jsonify({'error': 'Password must contain special character'}), 400
        
        username = data.get('username', '').strip() or email.split('@')[0]

        # Check if user exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            user = existing_user
            # Mark as admin if not already
            if not user.is_admin:
                user.is_admin = True
        else:
            # Create new user
            user = User(
                username=username,
                email=email,
                full_name=full_name,
                is_admin=True,
                is_active=True
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()  # Get user ID

        # Create admin credential
        credential = AdminCredential(
            user_id=user.id,
            username=username,
            email=email,
            role='super_admin',
            is_active=True,
            updated_by='system-init'
        )
        db.session.add(credential)
        db.session.flush()  # Assign credential.id before set_password() references it
        credential.set_password(password)

        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id, expires_delta=timedelta(hours=24))
        
        return jsonify({
            'message': 'Super admin initialized successfully',
            'data': {
                'user_id': user.id,
                'email': email,
                'access_token': access_token,
                'token_type': 'Bearer',
                'expires_in': 86400  # 24 hours in seconds
            }
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to initialize super admin')


@superadmin_auth_bp.route('/quick-login', methods=['POST'])
@limiter.limit("10 per minute")
def quick_super_admin_login():
    """
    Quick login for super admin with email and password
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find credential
        credential = AdminCredential.query.filter_by(email=email).first()
        
        if not credential:
            current_app.logger.warning(f'Super admin login attempt with non-existent email: {email}')
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if super admin
        if credential.role != 'super_admin':
            return jsonify({'error': 'Not a super admin account'}), 403
        
        # Check if active
        if not credential.is_active:
            return jsonify({'error': 'Account is inactive'}), 403
        
        # Check if locked
        if credential.is_account_locked():
            return jsonify({
                'error': 'Account is locked',
                'locked_until': credential.locked_until.isoformat() if credential.locked_until else None
            }), 423
        
        # Verify password
        if not credential.check_password(password):
            credential.increment_login_attempts()
            db.session.commit()
            
            remaining_attempts = 5 - credential.login_attempts
            if credential.is_locked:
                return jsonify({
                    'error': 'Too many failed attempts. Account locked for 30 minutes',
                    'locked_until': credential.locked_until.isoformat()
                }), 423
            
            return jsonify({
                'error': f'Invalid credentials. {remaining_attempts} attempts remaining',
                'attempts_remaining': remaining_attempts
            }), 401
        
        # Successful login
        credential.reset_login_attempts()
        credential.last_login = datetime.utcnow()
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(
            identity=credential.user_id,
            expires_delta=timedelta(hours=24)
        )
        
        return jsonify({
            'message': 'Login successful',
            'data': {
                'user_id': credential.user_id,
                'username': credential.username,
                'email': credential.email,
                'role': credential.role,
                'access_token': access_token,
                'token_type': 'Bearer',
                'expires_in': 86400,  # 24 hours
                'last_login': credential.last_login.isoformat()
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Login failed')


@superadmin_auth_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_super_admin_dashboard():
    """
    Get super admin dashboard data
    """
    try:
        user_id = get_jwt_identity()
        credential = AdminCredential.query.filter_by(user_id=user_id).first()
        
        if not credential or credential.role != 'super_admin':
            return jsonify({'error': 'Super admin access required'}), 403
        
        # Get stats
        from models import User, Product, Order
        
        total_admins = AdminCredential.query.count()
        total_users = User.query.count()
        total_products = Product.query.count()
        total_orders = Order.query.count()
        active_credentials = AdminCredential.query.filter_by(is_active=True).count()
        locked_credentials = AdminCredential.query.filter_by(is_locked=True).count()
        
        return jsonify({
            'message': 'Super admin dashboard loaded',
            'data': {
                'user': credential.to_dict(),
                'stats': {
                    'total_admins': total_admins,
                    'total_users': total_users,
                    'total_products': total_products,
                    'total_orders': total_orders,
                    'active_credentials': active_credentials,
                    'locked_credentials': locked_credentials
                },
                'last_login': credential.last_login.isoformat() if credential.last_login else None,
                'account_status': 'active' if credential.is_active else 'inactive'
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to load dashboard')


@superadmin_auth_bp.route('/status', methods=['GET'])
def get_super_admin_status():
    """
    Check if super admin is initialized (no auth required)
    """
    try:
        super_admin_exists = AdminCredential.query.filter_by(role='super_admin').first()
        
        return jsonify({
            'message': 'Super admin status',
            'data': {
                'super_admin_initialized': bool(super_admin_exists),
                'setup_endpoint': '/api/superadmin/init-setup' if not super_admin_exists else None
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Failed to check status'}), 500
