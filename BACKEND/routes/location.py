"""
Location Routes for BlessedNet Wholesale Hub
Handles region and city management for location-based access control
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, Region, City, User
from utils.security import safe_error_response
from utils.location_validation import (
    is_location_active,
    is_user_location_active,
    validate_region_city,
    get_user_location_info
)

location_bp = Blueprint('location', __name__, url_prefix='/api/location')


# ==================== PUBLIC ROUTES ====================

@location_bp.route('/regions', methods=['GET'])
@limiter.limit("50 per minute")
def get_all_regions():
    """
    Get all regions with optional cities
    
    Query parameters:
    - include_cities: boolean (optional, default=false)
    - only_active: boolean (optional, default=true)
    """
    try:
        include_cities = request.args.get('include_cities', 'false').lower() == 'true'
        only_active = request.args.get('only_active', 'true').lower() == 'true'
        
        query = Region.query
        if only_active:
            query = query.filter_by(is_active=True)
        
        regions = query.order_by(Region.name).all()
        
        return jsonify({
            'message': 'Regions retrieved successfully',
            'data': [region.to_dict(include_cities=include_cities) for region in regions]
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve regions')


@location_bp.route('/regions/<int:region_id>', methods=['GET'])
@limiter.limit("50 per minute")
def get_region(region_id):
    """Get a specific region with all its cities"""
    try:
        region = Region.query.get(region_id)
        
        if not region:
            return jsonify({'error': 'Region not found'}), 404
        
        return jsonify({
            'message': 'Region retrieved successfully',
            'data': region.to_dict(include_cities=True)
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve region')


@location_bp.route('/regions/<int:region_id>/cities', methods=['GET'])
@limiter.limit("50 per minute")
def get_region_cities(region_id):
    """Get all cities in a region"""
    try:
        region = Region.query.get(region_id)
        
        if not region:
            return jsonify({'error': 'Region not found'}), 404
        
        only_active = request.args.get('only_active', 'true').lower() == 'true'
        
        query = City.query.filter_by(region_id=region_id)
        if only_active:
            query = query.filter_by(is_active=True)
        
        cities = query.order_by(City.name).all()
        
        return jsonify({
            'message': f'Cities in {region.name} retrieved successfully',
            'region_name': region.name,
            'data': [city.to_dict() for city in cities]
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve cities')


@location_bp.route('/cities', methods=['GET'])
@limiter.limit("50 per minute")
def get_all_cities():
    """Get all cities (optionally filtered by region)"""
    try:
        region_id = request.args.get('region_id', type=int)
        only_active = request.args.get('only_active', 'true').lower() == 'true'
        
        query = City.query
        
        if region_id:
            query = query.filter_by(region_id=region_id)
        
        if only_active:
            query = query.filter_by(is_active=True)
        
        cities = query.order_by(City.name).all()
        
        return jsonify({
            'message': 'Cities retrieved successfully',
            'data': [city.to_dict() for city in cities]
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve cities')


# ==================== USER LOCATION ROUTES ====================

@location_bp.route('/user/current', methods=['GET'])
@jwt_required()
def get_user_location():
    """Get current user's location information"""
    try:
        user_id = get_jwt_identity()
        location_info = get_user_location_info(user_id)
        
        return jsonify({
            'message': 'User location retrieved successfully',
            'data': location_info
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve user location')


@location_bp.route('/user/select', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def select_user_location():
    """
    User selects their region and city
    
    Request body:
    {
        "region_id": 1,
        "city_id": 5
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        region_id = data.get('region_id')
        city_id = data.get('city_id')
        
        if not region_id or not city_id:
            return jsonify({'error': 'region_id and city_id are required'}), 400
        
        # Validate region and city
        is_valid, error_msg = validate_region_city(region_id, city_id)
        if not is_valid:
            return jsonify({'error': error_msg}), 400
        
        # Update user location
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        region = Region.query.get(region_id)
        city = City.query.get(city_id)
        
        user.region_id = region_id
        user.city_id = city_id
        user.region = region.name if region else None
        user.city = city.name if city else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Location selected successfully',
            'data': get_user_location_info(user_id)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to select location')


@location_bp.route('/user/check-access', methods=['GET'])
@jwt_required()
def check_user_access():
    """Check if user's location has access to buy products"""
    try:
        user_id = get_jwt_identity()
        is_active, region_name, city_name, reason = is_user_location_active(user_id)
        
        return jsonify({
            'message': 'User access checked',
            'can_access': is_active,
            'region': region_name,
            'city': city_name,
            'reason': reason
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to check user access')


# ==================== ADMIN ROUTES ====================

@location_bp.route('/admin/regions', methods=['GET'])
@jwt_required()
@limiter.limit("50 per minute")
def admin_get_regions():
    """Get all regions (admin - includes inactive)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        regions = Region.query.order_by(Region.name).all()
        
        return jsonify({
            'message': 'Regions retrieved successfully',
            'data': [region.to_dict(include_cities=True) for region in regions]
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve regions')


@location_bp.route('/admin/regions/<int:region_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def admin_update_region(region_id):
    """
    Toggle region active status
    
    Request body:
    {
        "is_active": true
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        region = Region.query.get(region_id)
        if not region:
            return jsonify({'error': 'Region not found'}), 404
        
        data = request.get_json()
        if not data or 'is_active' not in data:
            return jsonify({'error': 'is_active parameter is required'}), 400
        
        region.is_active = bool(data.get('is_active'))
        db.session.commit()
        
        return jsonify({
            'message': f'Region {region.name} status updated',
            'data': region.to_dict(include_cities=True)
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update region')


@location_bp.route('/admin/cities/<int:city_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def admin_update_city(city_id):
    """
    Toggle city active status
    
    Request body:
    {
        "is_active": true
    }
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        city = City.query.get(city_id)
        if not city:
            return jsonify({'error': 'City not found'}), 404
        
        data = request.get_json()
        if not data or 'is_active' not in data:
            return jsonify({'error': 'is_active parameter is required'}), 400
        
        city.is_active = bool(data.get('is_active'))
        db.session.commit()
        
        return jsonify({
            'message': f'City {city.name} status updated',
            'data': city.to_dict()
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update city')


@location_bp.route('/admin/stats', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")
def admin_location_stats():
    """Get location statistics (admin)"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        total_regions = Region.query.count()
        active_regions = Region.query.filter_by(is_active=True).count()
        total_cities = City.query.count()
        active_cities = City.query.filter_by(is_active=True).count()
        
        users_with_location = User.query.filter(
            User.region_id.isnot(None),
            User.city_id.isnot(None)
        ).count()
        
        return jsonify({
            'message': 'Location statistics retrieved',
            'data': {
                'regions': {
                    'total': total_regions,
                    'active': active_regions,
                    'inactive': total_regions - active_regions
                },
                'cities': {
                    'total': total_cities,
                    'active': active_cities,
                    'inactive': total_cities - active_cities
                },
                'users_with_location': users_with_location
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve statistics')
