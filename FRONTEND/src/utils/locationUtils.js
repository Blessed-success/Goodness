/**
 * Location Detection Utility
 * Detects user's location via IP geolocation and suggests region/city
 */

/**
 * Get user's location from localStorage
 */
export const getUserLocationFromStorage = () => {
  try {
    const stored = localStorage.getItem('user_location');
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Error reading location from storage:', err);
    return null;
  }
};

/**
 * Save user location to localStorage
 */
export const saveUserLocationToStorage = (location) => {
  try {
    localStorage.setItem('user_location', JSON.stringify(location));
  } catch (err) {
    console.error('Error saving location to storage:', err);
  }
};

/**
 * Clear user location from storage
 */
export const clearUserLocationFromStorage = () => {
  try {
    localStorage.removeItem('user_location');
  } catch (err) {
    console.error('Error clearing location from storage:', err);
  }
};

/**
 * Check if user's location is active using API
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

export const checkUserLocationAccess = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/user/check-access`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error checking location access:', err);
    return null;
  }
};

/**
 * Get user's current location info
 */
export const getUserLocationInfo = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/user/current`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return response.ok ? data.data : null;
  } catch (err) {
    console.error('Error getting location info:', err);
    return null;
  }
};

/**
 * Detect user's location from IP (Ghana only)
 * Falls back to localStorage if available
 * Returns null if not in Ghana
 */
export const detectGhanaLocation = async () => {
  try {
    // First check localStorage
    const stored = getUserLocationFromStorage();
    if (stored) {
      return stored;
    }

    // Try to detect from IP using a free geolocation API
    // Note: Consider implementing a backend solution for better reliability
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Check if user is in Ghana
    if (data.country_code !== 'GH') {
      console.warn('User is not in Ghana. Country:', data.country_code);
      return { detected: false, reason: 'User not in Ghana' };
    }

    // Try to map the detected city/region to our Ghana locations
    const detectedRegion = data.region; // e.g., "Greater Accra"
    const detectedCity = data.city; // e.g., "Accra"

    return {
      detected: true,
      region_name: detectedRegion,
      city_name: detectedCity,
      country: data.country_name,
      ip: data.ip
    };
  } catch (err) {
    console.warn('Could not auto-detect location:', err.message);
    return null;
  }
};

/**
 * Suggest region and city based on detected location
 */
export const suggestLocation = (detectedLocation) => {
  if (!detectedLocation || !detectedLocation.detected) {
    return null;
  }

  // Manual mapping of detected regions to our Ghana regions
  const regionMapping = {
    'Greater Accra': 'Greater Accra',
    'Ashanti': 'Ashanti',
    'Ashanti Region': 'Ashanti',
    'Central': 'Central',
    'Central Region': 'Central',
    'Northern': 'Northern',
    'Northern Region': 'Northern',
    'Upper East': 'Upper East',
    'Upper East Region': 'Upper East',
    'Upper West': 'Upper West',
    'Upper West Region': 'Upper West',
    'Volta': 'Volta',
    'Volta Region': 'Volta',
    'Eastern': 'Eastern',
    'Eastern Region': 'Eastern',
    'Western': 'Western',
    'Western Region': 'Western',
    'Bono': 'Bono',
    'Bono Region': 'Bono',
  };

  const suggestedRegion = regionMapping[detectedLocation.region_name];

  return {
    suggested_region: suggestedRegion || detectedLocation.region_name,
    suggested_city: detectedLocation.city_name,
    message: `Welcome to Ghana! We detected you're in ${detectedLocation.city_name}, ${detectedLocation.region_name}. Please confirm your location.`
  };
};

/**
 * Check if user needs to select location
 * Returns true if:
 * 1. Not authenticated
 * 2. Authenticated but no location selected
 */
export const shouldShowLocationSelector = (isAuthenticated, userLocation) => {
  if (!isAuthenticated) {
    return false; // Show on login/register flow
  }

  return !userLocation || !userLocation.region_id || !userLocation.city_id;
};

/**
 * Format location for display
 */
export const formatLocation = (location) => {
  if (!location) return 'Not selected';
  
  return `${location.city_name || location.city_id}, ${location.region_name || location.region_id}`;
};
