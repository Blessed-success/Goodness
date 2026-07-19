# Integration Examples - Adding LocationSelector to Existing Pages

## Example 1: Integrating into App.js (Main Entry Point)

```javascript
/**
 * App.js - Main application component with location-based access control
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// New imports for location system
import LocationSelector from './components/LocationSelector';
import { 
  getUserLocationFromStorage, 
  checkUserLocationAccess,
  shouldShowLocationSelector 
} from './utils/locationUtils';

// Existing imports
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      
      // Get user's location
      const location = getUserLocationFromStorage();
      setUserLocation(location);
      
      // If no location selected, show selector
      if (!location || !location.region_id || !location.city_id) {
        setShowLocationSelector(true);
      }
      
      // Verify location is still active
      checkUserLocationAccess(token).then(result => {
        if (!result.can_access) {
          // Location was disabled, need new selection
          setShowLocationSelector(true);
        }
      });
    }
    
    setLoading(false);
  }, []);

  const handleLocationSelect = (location) => {
    setUserLocation(location);
    setShowLocationSelector(false);
  };

  const handleLogout = () => {
    setUser(null);
    setUserLocation(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_location');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      {/* Location Selector Modal - Shows when needed */}
      {showLocationSelector && (
        <LocationSelector
          showModal={true}
          onLocationSelect={handleLocationSelect}
        />
      )}

      <Header user={user} onLogout={handleLogout} location={userLocation} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/" /> : 
            <LoginPage onLoginSuccess={(userData) => {
              setUser(userData);
              setShowLocationSelector(true); // Show location selector after login
            }} />
          } 
        />
        
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/" /> : 
            <RegisterPage onRegisterSuccess={(userData) => {
              setUser(userData);
              setShowLocationSelector(true); // Show location selector after registration
            }} />
          } 
        />
        
        <Route 
          path="/cart" 
          element={user ? <CartPage location={userLocation} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/checkout" 
          element={user && userLocation ? <CheckoutPage /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/admin" 
          element={user?.is_admin ? <AdminDashboard /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Example 2: Integrating into LoginPage

```javascript
/**
 * LoginPage.js - With location selector after successful login
 */

import React, { useState } from 'react';
import LocationSelector from '../components/LocationSelector';
import './LoginPage.css';

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Save token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUserData(data.user);
      setIsLoggedIn(true); // Show location selector

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Show location selector after login
  if (isLoggedIn && userData) {
    return (
      <LocationSelector
        showModal={true}
        onLocationSelect={() => {
          // After location is selected, navigate to home
          window.location.href = '/';
        }}
      />
    );
  }

  // Show login form
  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login to BlessedNet</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">Login</button>
        </form>

        <p>Don't have account? <a href="/register">Register here</a></p>
      </div>
    </div>
  );
}

export default LoginPage;
```

---

## Example 3: Integrating into CartPage

```javascript
/**
 * CartPage.js - With location access check
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkUserLocationAccess } from '../utils/locationUtils';
import './CartPage.css';

function CartPage({ location }) {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [canAccess, setCanAccess] = useState(true);
  const [accessReason, setAccessReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    // Check if user's location allows access
    checkUserLocationAccess(token).then(result => {
      if (!result.can_access) {
        setCanAccess(false);
        setAccessReason(result.reason);
      }
    });

    // Fetch cart
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      setCart(data.data || []);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // If location is not active, show restriction message
  if (!canAccess) {
    return (
      <div className="cart-page">
        <div className="access-denied-message">
          <h2>Service Not Available</h2>
          <p>⚠️ {accessReason}</p>
          <p>We're not currently offering services in your location.</p>
          <button onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  // Normal cart display if location is active...
  return (
    <div className="cart-page">
      <h2>Shopping Cart</h2>
      
      {loading && <p>Loading cart...</p>}
      
      {!loading && cart && cart.length === 0 && (
        <p>Your cart is empty</p>
      )}
      
      {!loading && cart && cart.length > 0 && (
        <div>
          {/* Render cart items */}
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              {/* Item details */}
            </div>
          ))}
          
          {/* Checkout button is only enabled if location is active */}
          <button 
            className="btn-checkout"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}

export default CartPage;
```

---

## Example 4: Integrating into AdminDashboard

```javascript
/**
 * AdminDashboard.js - With location management tab
 */

import React, { useState } from 'react';
import AdminLocations from '../components/AdminLocations';
import AdminProducts from '../components/AdminProducts';
import AdminOrders from '../components/AdminOrders';
import AdminUsers from '../components/AdminUsers';
import './AdminDashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
        <button 
          className={activeTab === 'orders' ? 'active' : ''}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        {/* NEW LOCATION TAB */}
        <button 
          className={activeTab === 'locations' ? 'active' : ''}
          onClick={() => setActiveTab('locations')}
        >
          🌍 Locations
        </button>
      </nav>

      <div className="admin-content">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'orders' && <AdminOrders />}
        {activeTab === 'users' && <AdminUsers />}
        {/* NEW LOCATION COMPONENT */}
        {activeTab === 'locations' && <AdminLocations />}
      </div>
    </div>
  );
}

export default AdminDashboard;
```

---

## Example 5: Creating an Access Denied Component

```javascript
/**
 * AccessDenied.js - Shown when user's location doesn't have access
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AccessDenied.css';

function AccessDenied({ reason }) {
  const navigate = useNavigate();

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="icon">🚫</div>
        
        <h1>Service Not Available</h1>
        
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
          <button className="btn-home" onClick={() => navigate('/')}>
            Return to Home
          </button>
          <button className="btn-change-location" onClick={() => {
            localStorage.removeItem('user_location');
            navigate('/');
          }}>
            Change Location
          </button>
        </div>

        <p className="support">
          Need help? <a href="mailto:support@blessednet.com">Contact us</a>
        </p>
      </div>
    </div>
  );
}

export default AccessDenied;
```

---

## Example 6: User Profile with Location Display & Change

```javascript
/**
 * UserProfile.js - Show current location and allow change
 */

import React, { useState, useEffect } from 'react';
import LocationSelector from '../components/LocationSelector';
import { getUserLocationInfo } from '../utils/locationUtils';
import './UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    
    const token = localStorage.getItem('access_token');
    getUserLocationInfo(token).then(loc => {
      setLocation(loc);
      setLoading(false);
    });
  }, []);

  return (
    <div className="user-profile">
      <h2>My Profile</h2>

      {/* Location Card */}
      <div className="location-card">
        <h3>📍 Your Location</h3>
        
        {loading ? (
          <p>Loading location...</p>
        ) : location ? (
          <div>
            <p><strong>Region:</strong> {location.region_name}</p>
            <p><strong>City:</strong> {location.city_name}</p>
            <p className={`status ${location.is_active ? 'active' : 'inactive'}`}>
              {location.is_active ? '✓ Service Available' : '✗ Service Unavailable'}
            </p>
          </div>
        ) : (
          <p>No location selected</p>
        )}

        <button 
          className="btn-change"
          onClick={() => setShowSelector(true)}
        >
          Change Location
        </button>
      </div>

      {/* Location Selector */}
      {showSelector && (
        <LocationSelector
          showModal={true}
          onLocationSelect={(newLocation) => {
            setLocation(newLocation);
            setShowSelector(false);
          }}
        />
      )}

      {/* Other profile sections... */}
    </div>
  );
}

export default UserProfile;
```

---

## CSS Example: Access Denied Page

```css
/* AccessDenied.css */

.access-denied-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

.access-denied-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

h1 {
  color: #333;
  margin: 1rem 0;
  font-size: 2rem;
}

.message {
  color: #666;
  font-size: 1.05rem;
  margin: 1.5rem 0;
  line-height: 1.6;
}

.suggestions {
  background: #f9f9f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  text-align: left;
}

.suggestions h3 {
  color: #333;
  margin-top: 0;
}

.suggestions ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.suggestions li {
  color: #666;
  margin: 0.5rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-direction: column;
}

.actions button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-home {
  background: #3498db;
  color: white;
}

.btn-home:hover {
  background: #2980b9;
}

.btn-change-location {
  background: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-change-location:hover {
  background: #ecf0f1;
}

.support {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  color: #666;
  font-size: 0.9rem;
}

.support a {
  color: #3498db;
  text-decoration: none;
}

.support a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .access-denied-card {
    padding: 1.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .actions {
    flex-direction: column;
  }
}
```

---

## Integration Checklist

- ✅ Add LocationSelector to App.js
- ✅ Show selector after login/registration
- ✅ Check access on CartPage
- ✅ Check access on CheckoutPage
- ✅ Add admin Locations tab
- ✅ Create AccessDenied component
- ✅ Import utilities in components
- ✅ Test location restrictions
- ✅ Verify error messages display
- ✅ Test admin toggle functionality

All examples are ready to use! Copy-paste and customize as needed.
