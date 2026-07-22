/**
 * LocationSelector Component
 * Allows users to select their region and city for location-based access control
 */

import React, { useState, useEffect } from 'react';
import './LocationSelector.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

const LocationSelector = ({ onLocationSelect, initialRegionId, initialCityId, showModal = false }) => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(initialRegionId || '');
  const [selectedCity, setSelectedCity] = useState(initialCityId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(showModal);

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions();
  }, []);

  // Fetch cities when region changes
  useEffect(() => {
    if (selectedRegion) {
      fetchCities(selectedRegion);
      setSelectedCity(''); // Reset city when region changes
    }
  }, [selectedRegion]);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/location/regions?only_active=true`);
      
      if (!response.ok) throw new Error('Failed to fetch regions');
      
      const data = await response.json();
      setRegions(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching regions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (regionId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/location/regions/${regionId}/cities?only_active=true`);
      
      if (!response.ok) throw new Error('Failed to fetch cities');
      
      const data = await response.json();
      setCities(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (e) => {
    e.preventDefault();

    if (!selectedRegion || !selectedCity) {
      setError('Please select both region and city');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/location/user/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          region_id: parseInt(selectedRegion),
          city_id: parseInt(selectedCity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to select location');
        return;
      }

      // Save to localStorage
      localStorage.setItem('user_location', JSON.stringify({
        region_id: selectedRegion,
        city_id: selectedCity,
        region_name: regions.find(r => r.id === parseInt(selectedRegion))?.name,
        city_name: cities.find(c => c.id === parseInt(selectedCity))?.name
      }));

      // Call callback
      if (onLocationSelect) {
        onLocationSelect(data.data);
      }

      // Close modal if visible
      if (showModal) {
        setIsVisible(false);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error selecting location:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showModal && !isVisible) {
    return null;
  }

  return (
    <div className={`location-selector ${showModal ? 'modal' : 'inline'}`}>
      <div className="location-selector-content">
        <h3>Select Your Location</h3>
        <p className="subtitle">Choose your region and city to access our services</p>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSelect}>
          <div className="form-group">
            <label htmlFor="region-select">Region</label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">-- Select Region --</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="city-select">City</label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedRegion || loading}
              required
            >
              <option value="">-- Select City --</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRegion || !selectedCity}
            className="btn-confirm"
          >
            {loading ? 'Processing...' : 'Confirm Location'}
          </button>
        </form>

        {/* Only dismissible when the user already has a location on file (i.e.
            this is "change my location", not the mandatory first-time gate) —
            closing it with no location set leaves the account unable to shop
            with no way back in, since every order needs a delivery region. */}
        {showModal && initialRegionId && initialCityId && (
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="btn-close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
