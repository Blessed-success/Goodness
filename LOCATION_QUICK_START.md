# Location-Based Access Control System - Quick Start Guide

## ⚡ 5-Minute Setup

### Backend Setup (Python)

```bash
# 1. Install Flask-Limiter (already in requirements.txt)
pip install -r BACKEND/requirements.txt

# 2. Seed database with Ghana locations
cd BACKEND
python setup_locations.py

# 3. That's it! System is ready.
```

### Frontend Setup (React)

```bash
# 1. Copy components to your project
# Already added:
# - src/components/LocationSelector.js
# - src/components/LocationSelector.css
# - src/components/AdminLocations.js
# - src/components/AdminLocations.css
# - src/utils/locationUtils.js

# 2. Update your imports in App.js (see below)

# 3. Done!
```

---

## 🔧 Quick Integration

### Add to App.js

```javascript
import { useEffect, useState } from 'react';
import LocationSelector from './components/LocationSelector';
import { getUserLocationFromStorage, checkUserLocationAccess } from './utils/locationUtils';

function App() {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Check user location on app load
    const token = localStorage.getItem('access_token');
    const stored = getUserLocationFromStorage();

    if (token && !stored) {
      // Authenticated user without selected location
      setShowLocationSelector(true);
    }

    if (token && stored) {
      // Verify location is still active
      checkUserLocationAccess(token).then(result => {
        if (!result.can_access) {
          setShowLocationSelector(true);
        }
      });
    }
  }, []);

  return (
    <div className="App">
      {showLocationSelector && (
        <LocationSelector
          showModal={true}
          onLocationSelect={(location) => {
            setUserLocation(location);
            setShowLocationSelector(false);
          }}
        />
      )}
      {/* Rest of your app */}
    </div>
  );
}

export default App;
```

### Add to Admin Dashboard

```javascript
import AdminLocations from './components/AdminLocations';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="admin-dashboard">
      <nav>
        <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
        <button onClick={() => setActiveTab('products')}>Products</button>
        <button onClick={() => setActiveTab('locations')}>Locations</button>
      </nav>

      {activeTab === 'locations' && <AdminLocations />}
      {/* Other tabs */}
    </div>
  );
}
```

### Protect Cart & Checkout

```javascript
import { checkUserLocationAccess } from './utils/locationUtils';

async function handleCheckout() {
  const token = localStorage.getItem('access_token');
  const access = await checkUserLocationAccess(token);

  if (!access.can_access) {
    alert(`Cannot checkout: ${access.reason}`);
    return;
  }

  // Proceed with checkout
  proceedToPayment();
}
```

---

## 📋 API Endpoints Quick Reference

### Public (No Auth)
```
GET  /api/location/regions                    # Get all regions
GET  /api/location/regions/<id>               # Get region details
GET  /api/location/regions/<id>/cities        # Get cities in region
GET  /api/location/cities                     # Get all cities
```

### User (JWT Required)
```
GET  /api/location/user/current               # User's location
POST /api/location/user/select                # Select location
GET  /api/location/user/check-access          # Check access
```

### Admin (JWT + Admin Required)
```
GET  /api/location/admin/regions              # All regions (with inactive)
PUT  /api/location/admin/regions/<id>         # Toggle region
PUT  /api/location/admin/cities/<id>          # Toggle city
GET  /api/location/admin/stats                # Location statistics
```

---

## 🚀 Usage Examples

### Frontend: Detect & Select Location
```javascript
import { detectGhanaLocation, suggestLocation } from './utils/locationUtils';

async function autoDetectLocation() {
  const detected = await detectGhanaLocation();
  
  if (detected && detected.detected) {
    const suggestion = suggestLocation(detected);
    console.log(suggestion.message);
    // Show LocationSelector with suggested values
  }
}
```

### Backend: Check User Access
```python
from utils.location_validation import is_user_location_active

@orders_bp.route('/create', methods=['POST'])
@jwt_required()
def create_order():
    user_id = get_jwt_identity()
    is_active, region, city, reason = is_user_location_active(user_id)
    
    if not is_active:
        return jsonify({'error': reason}), 403
    
    # Create order...
```

### Backend: Access Control
```python
from utils.location_validation import validate_region_city

def select_location(region_id, city_id):
    is_valid, error = validate_region_city(region_id, city_id)
    
    if not is_valid:
        return {'error': error}
    
    # Update user profile...
```

---

## 🔐 Security Tips

✅ **Always validate on backend**
```python
# Good - validates server-side
@requires_location_access
def add_to_cart():
    is_active, _, _, reason = is_user_location_active(user_id)
    if not is_active:
        return error, 403
```

✅ **Use rate limiting**
```python
@limiter.limit("5 per minute")  # On sensitive routes
def create_order():
    pass
```

✅ **Check on client & server**
```javascript
// Frontend
if (!locationActive) {
  disableCheckout();
}

// Backend ALWAYS checks too
```

---

## 📊 Ghana Regions (16 Total)

| Region | Cities | Status |
|--------|--------|--------|
| Greater Accra | 10 | ✓ Active |
| Ashanti | 6 | ✓ Active |
| Central | 6 | ✓ Active |
| Northern | 6 | ✓ Active |
| Upper East | 5 | ✓ Active |
| Upper West | 5 | ✓ Active |
| Volta | 6 | ✓ Active |
| Eastern | 6 | ✓ Active |
| Western | 6 | ✓ Active |
| Bono | 5 | ✓ Active |
| Bono East | 3 | ✓ Active |
| Ahafo | 4 | ✓ Active |
| Savannah | 4 | ✓ Active |
| North East | 3 | ✓ Active |
| Oti | 3 | ✓ Active |
| Wese | 4 | ✓ Active |

---

## 🧪 Testing

### Test Location Selection
```bash
curl -X POST http://localhost:5000/api/location/user/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"region_id": 1, "city_id": 5}'
```

### Test Access Check
```bash
curl http://localhost:5000/api/location/user/check-access \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Add to Cart (Should fail if inactive)
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"product_id": 1, "quantity": 1}'
```

---

## ❓ FAQ

**Q: What if user is not in Ghana?**  
A: They see "Not in Ghana" message. Can't select location. Manual bypass available for admins.

**Q: Can users change their location?**  
A: Yes! Anytime via LocationSelector. Just call `/user/select` again.

**Q: What happens if admin disables a user's city?**  
A: User sees "Service not available" on next action. Must select new location.

**Q: Is location data encrypted?**  
A: No, it's just region/city IDs - not sensitive. Use HTTPS in production.

**Q: Can I add new regions?**  
A: Yes! Edit `GHANA_REGIONS` in `utils/ghana_locations.py` and re-run setup.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| No regions showing | Run `python setup_locations.py` |
| Location selector broken | Check Component imports |
| Can add to cart despite inactive location | Backend validation missing - add imports |
| Admin can't toggle locations | Ensure user has `is_admin=True` |
| Cart shows disabled without reason | Check frontend `checkUserLocationAccess` call |

---

## 📞 Support

For detailed documentation, see: `LOCATION_SYSTEM_GUIDE.md`

**Key Files:**
- Backend: `BACKEND/routes/location.py`
- Frontend: `FRONTEND/src/components/LocationSelector.js`
- Utilities: `BACKEND/utils/location_validation.py`
- Data: `BACKEND/utils/ghana_locations.py`

---

**Version**: 1.0 | **Status**: ✅ Production Ready
