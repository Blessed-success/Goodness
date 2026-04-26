/**
 * AdminLocations Component
 * Allows admins to enable/disable regions and cities for location-based access control
 */

import React, { useState, useEffect } from 'react';
import './AdminLocations.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

const AdminLocations = () => {
  const [regions, setRegions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchRegions();
    fetchStats();
  }, []);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/location/admin/regions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch regions');
        return;
      }

      setRegions(data.data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching regions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/location/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const toggleRegion = async (regionId, currentStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/location/admin/regions/${regionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update region');
        return;
      }

      // Update regions state
      setRegions(regions.map(region =>
        region.id === regionId
          ? { ...region, is_active: !currentStatus }
          : region
      ));

      // Update stats
      fetchStats();
    } catch (err) {
      setError(err.message);
      console.error('Error updating region:', err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleCity = async (cityId, currentStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/location/admin/cities/${cityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update city');
        return;
      }

      // Update regions state
      setRegions(regions.map(region => ({
        ...region,
        cities: region.cities?.map(city =>
          city.id === cityId
            ? { ...city, is_active: !currentStatus }
            : city
        ) || []
      })));

      // Update stats
      fetchStats();
    } catch (err) {
      setError(err.message);
      console.error('Error updating city:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-locations">
        <div className="loading">Loading location management...</div>
      </div>
    );
  }

  return (
    <div className="admin-locations">
      <div className="admin-locations-header">
        <h2>🌍 Location-Based Access Control</h2>
        <p className="description">
          Control which regions and cities in Ghana can access and purchase from BlessedNet
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="close-error">✕</button>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.regions.total}</div>
            <div className="stat-label">Total Regions</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.regions.active}</div>
            <div className="stat-label">Active Regions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.cities.total}</div>
            <div className="stat-label">Total Cities</div>
          </div>
          <div className="stat-card active">
            <div className="stat-value">{stats.cities.active}</div>
            <div className="stat-label">Active Cities</div>
          </div>
          <div className="stat-card users">
            <div className="stat-value">{stats.users_with_location}</div>
            <div className="stat-label">Users with Location</div>
          </div>
        </div>
      )}

      <div className="regions-container">
        {regions.map((region) => (
          <div key={region.id} className="region-card">
            <div
              className="region-header"
              onClick={() => setExpandedRegion(expandedRegion === region.id ? null : region.id)}
            >
              <div className="region-title">
                <span className="expand-icon">
                  {expandedRegion === region.id ? '▼' : '▶'}
                </span>
                <h3>{region.name}</h3>
              </div>
              <div className="region-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={region.is_active}
                    onChange={() => toggleRegion(region.id, region.is_active)}
                    disabled={updating}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`status ${region.is_active ? 'active' : 'inactive'}`}>
                  {region.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>
            </div>

            {expandedRegion === region.id && region.cities && (
              <div className="cities-list">
                {region.cities.length === 0 ? (
                  <p className="no-cities">No cities configured</p>
                ) : (
                  region.cities.map((city) => (
                    <div key={city.id} className="city-item">
                      <span className="city-name">{city.name}</span>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={city.is_active}
                          onChange={() => toggleCity(city.id, city.is_active)}
                          disabled={updating}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className={`status small ${city.is_active ? 'active' : 'inactive'}`}>
                        {city.is_active ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {regions.length === 0 && (
        <div className="empty-state">
          <p>No regions found. Please seed the database with Ghana locations.</p>
        </div>
      )}
    </div>
  );
};

export default AdminLocations;
