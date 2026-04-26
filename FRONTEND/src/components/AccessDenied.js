/**
 * Access Denied Component
 * Shows when user's location doesn't have access to services
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

const AccessDenied = ({ reason, title = "Service Not Available", showHomeButton = true, showChangeLocationButton = true }) => {
  const navigate = useNavigate();

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="icon">🚫</div>

        <h1>{title}</h1>

        <p className="message">
          {reason || 'We are not currently offering services in your location.'}
        </p>

        <div className="suggestions">
          <h3>What can you do?</h3>
          <ul>
            <li>Check back soon - we're expanding soon!</li>
            <li>Select a different location if you travel</li>
            <li>Contact support for more information</li>
          </ul>
        </div>

        <div className="actions">
          {showHomeButton && (
            <button className="btn-home" onClick={() => navigate('/')}>
              Return to Home
            </button>
          )}
          {showChangeLocationButton && (
            <button className="btn-change-location" onClick={() => {
              localStorage.removeItem('user_location');
              navigate('/');
            }}>
              Change Location
            </button>
          )}
        </div>

        <p className="support">
          Need help? <a href="mailto:support@blessednet.com">Contact us</a>
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;