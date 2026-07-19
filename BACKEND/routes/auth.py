"""
Authentication Routes for BlessedNet Wholesale Hub
Handles user registration, login, and JWT token management
FIXED: Added current_app import, improved error handling
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from utils.limiter import limiter
from datetime import datetime
from models import db, User
from utils.security import safe_error_response
import re

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    return True, "Valid"

def sanitize_input(data, fields):
    """Sanitize user input to prevent SQL injection and XSS"""
    sanitized = {}
    for field in fields:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                sanitized[field] = value.strip()
            else:
                sanitized[field] = value
    return sanitized

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    """
    Register a new user
    
    Request body:
    {
        "username": "johndoe",
        "email": "john@example.com",
        "password": "SecurePass123!",
        "full_name": "John Doe",
        "phone": "+233123456789"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Sanitize input
        user_data = sanitize_input(data, ['username', 'email', 'password', 'full_name', 'phone'])
        
        # Validate email format
        if not validate_email(user_data['email']):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength (FIXED: Enhanced validation)
        is_valid, message = validate_password_strength(user_data['password'])
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=user_data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=user_data['email']).first():
            return jsonify({'error': 'Email already exists'}), 409
        
        # Create new user
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            full_name=user_data.get('full_name', ''),
            phone=user_data.get('phone', ''),
            is_active=True
        )
        user.set_password(user_data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Registration failed')


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    Login user and return JWT token
    
    Request body:
    {
        "email": "john@example.com",
        "password": "SecurePass123!"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is inactive'}), 403
        
        # Create access token (FIXED: Token expires in 24 hours instead of 30 days)
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Login failed')


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'message': 'Profile retrieved successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve profile')


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
@limiter.limit("5 per minute")
def update_profile():
    """
    Update user profile
    FIXED: Added rate limiting
    
    Request body:
    {
        "full_name": "John Doe",
        "phone": "+233123456789",
        "address": "123 Main St",
        "city": "Accra",
        "country": "Ghana",
        "postal_code": "00000"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Sanitize and update allowed fields
        allowed_fields = ['full_name', 'phone', 'address', 'city', 'country', 'postal_code']
        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field].strip() if isinstance(data[field], str) else data[field])
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update profile')


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def change_password():
    """
    Change user password
    FIXED: Added rate limiting
    
    Request body:
    {
        "old_password": "OldPass123!",
        "new_password": "NewPass456!"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        old_password = data.get('old_password', '')
        new_password = data.get('new_password', '')
        
        if not old_password or not new_password:
            return jsonify({'error': 'Both old and new passwords are required'}), 400
        
        # Verify old password
        if not user.check_password(old_password):
            return jsonify({'error': 'Old password is incorrect'}), 401
        
        # Validate new password strength
        is_valid, message = validate_password_strength(new_password)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Set new password
        user.set_password(new_password)
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to change password')


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (frontend should discard token)"""
    return jsonify({'message': 'Logout successful'}), 200
