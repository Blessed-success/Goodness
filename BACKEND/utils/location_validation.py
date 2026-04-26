"""
Location Validation Utility
Handles checking if a user's region/city is accessible for purchases
"""

from flask import current_app
from models import Region, City, User


def is_location_active(region_id, city_id):
    """
    Check if both region and city are active
    
    Args:
        region_id: ID of the region
        city_id: ID of the city
    
    Returns:
        bool: True if both are active, False otherwise
    """
    if not region_id or not city_id:
        return False
    
    try:
        region = Region.query.get(region_id)
        city = City.query.get(city_id)
        
        if not region or not city:
            return False
        
        return region.is_active and city.is_active
    
    except Exception as e:
        current_app.logger.error(f"Error checking location activity: {str(e)}")
        return False


def is_user_location_active(user_id):
    """
    Check if a user's region and city are both active
    
    Args:
        user_id: ID of the user
    
    Returns:
        tuple: (is_active: bool, region_name: str, city_name: str, reason: str)
    """
    try:
        user = User.query.get(user_id)
        
        if not user:
            return False, None, None, "User not found"
        
        # If user doesn't have location set
        if not user.region_id or not user.city_id:
            return False, None, None, "User location not set"
        
        # Check if region exists and is active
        region = Region.query.get(user.region_id)
        if not region:
            return False, None, None, "Region not found"
        
        if not region.is_active:
            return False, region.name, None, f"Service not available in {region.name} region"
        
        # Check if city exists and is active
        city = City.query.get(user.city_id)
        if not city:
            return False, region.name, None, "City not found"
        
        if not city.is_active:
            return False, region.name, city.name, f"Service not available in {city.name}"
        
        return True, region.name, city.name, "Location is active"
    
    except Exception as e:
        current_app.logger.error(f"Error checking user location: {str(e)}")
        return False, None, None, "Error checking location"


def validate_region_city(region_id, city_id):
    """
    Validate that city belongs to region and both are active
    
    Args:
        region_id: ID of the region
        city_id: ID of the city
    
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    try:
        # Check region exists and is active
        region = Region.query.get(region_id)
        if not region:
            return False, "Invalid region"
        
        if not region.is_active:
            return False, f"Service not available in {region.name}"
        
        # Check city exists and is active
        city = City.query.get(city_id)
        if not city:
            return False, "Invalid city"
        
        if not city.is_active:
            return False, f"Service not available in {city.name}"
        
        # Check city belongs to region
        if city.region_id != region_id:
            return False, "City does not belong to selected region"
        
        return True, None
    
    except Exception as e:
        current_app.logger.error(f"Error validating region/city: {str(e)}")
        return False, "Error validating location"


def get_user_location_info(user_id):
    """
    Get user's location information
    
    Args:
        user_id: ID of the user
    
    Returns:
        dict: Location info with region, city, and active status
    """
    try:
        user = User.query.get(user_id)
        
        if not user or not user.region_id or not user.city_id:
            return {
                'user_id': user_id,
                'region_id': user.region_id if user else None,
                'city_id': user.city_id if user else None,
                'region_name': None,
                'city_name': None,
                'is_active': False,
                'reason': 'Location not set'
            }
        
        region = Region.query.get(user.region_id)
        city = City.query.get(user.city_id)
        
        return {
            'user_id': user_id,
            'region_id': user.region_id,
            'city_id': user.city_id,
            'region_name': region.name if region else None,
            'city_name': city.name if city else None,
            'delivery_fee': region.delivery_fee if region else 0.0,
            'is_active': region.is_active and city.is_active if (region and city) else False,
            'reason': 'Location active' if (region and city and region.is_active and city.is_active) else 'Service not available'
        }
    
    except Exception as e:
        current_app.logger.error(f"Error getting user location info: {str(e)}")
        return {
            'user_id': user_id,
            'region_id': None,
            'city_id': None,
            'region_name': None,
            'city_name': None,
            'is_active': False,
            'reason': 'Error checking location'
        }
