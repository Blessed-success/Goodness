# Location-Based Access Control System - Complete Setup & Usage Guide

## Overview
This comprehensive guide explains how to set up and use the location-based access control system for BlessedNet Wholesale Hub in Ghana.

---

## Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Admin Dashboard](#admin-dashboard)
5. [API Reference](#api-reference)
6. [Security Considerations](#security-considerations)
7. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Database Setup

### Step 1: Run Setup Script

The first time you deploy the system, run the setup script to seed the database:

```bash
cd BACKEND
python setup_locations.py
```

This will:
- Create `regions` and `cities` tables
- Update `users` table with location fields
- Populate all 16 Ghana regions and their major cities
- Default all locations to ACTIVE status

### Step 2: Verify Setup

```python
python
>>> from app import app, db
>>> from models import Region, City
>>> with app.app_context():
...     print(f"Regions: {Region.query.count()}")
...     print(f"Cities: {City.query.count()}")
```

Expected output:
```
Regions: 16
Cities: 97
```

---

## Backend Integration

### 1. Database Models

Three models work together:

#### Region Model
```python
class Region(db.Model):
    id              # Auto-increment
    name            # Ghana region name (e.g., "Greater Accra")
    is_active       # Boolean - controls service availability
    created_at
    updated_at
```

#### City Model
```python
class City(db.Model):
    id              # Auto-increment
    name            # City name (e.g., "Accra")
    region_id       # Foreign key to Region
    is_active       # Boolean - controls service availability
    created_at
    updated_at
```

#### User Model (Updated)
```python
class User(db.Model):
    # ... existing fields ...
    region          # String: Region name
    region_id       # Foreign key to Region
    city_id         # Foreign key to City
```

### 2. Location Validation Utilities

Available in `utils/location_validation.py`:

```python
# Check if region and city are active
is_location_active(region_id, city_id) -> bool

# Check user's location access
is_user_location_active(user_id) -> (bool, region_name, city_name, reason)

# Validate region-city pair
validate_region_city(region_id, city_id) -> (bool, error_message)

# Get user location info
get_user_location_info(user_id) -> dict
```

### 3. API Routes

All routes are in `routes/location.py` under `/api/location` prefix.

#### Public Routes (No Auth Required)

**GET /regions**
- Get all active regions
- Query params: `include_cities=true`, `only_active=true`
- Response: Array of regions

**GET /regions/<id>**
- Get specific region with all cities
- Response: Single region with cities array

**GET /regions/<id>/cities**
- Get cities in a region
- Response: Array of cities

**GET /cities**
- Get all cities
- Query params: `region_id=1`, `only_active=true`
- Response: Array of cities

#### User Routes (JWT Required)

**GET /user/current**
- Get current user's location
- Returns: Current location info and active status

**POST /user/select**
- User selects their region and city
- Body: `{ "region_id": 1, "city_id": 5 }`
- Validates location is active
- Saves to user profile and localStorage

**GET /user/check-access**
- Check if user can access services
- Returns: `{ can_access: bool, reason: string }`

#### Admin Routes (JWT + Admin Required)

**GET /admin/regions**
- Get all regions (including inactive)
- Returns: All regions with cities

**PUT /admin/regions/<id>**
- Toggle region active status
- Body: `{ "is_active": true/false }`
- Only accessible to admins

**PUT /admin/cities/<id>**
- Toggle city active status
- Body: `{ "is_active": true/false }`
- Only accessible to admins

**GET /admin/stats**
- Get location statistics
- Returns: Counts of regions, cities, users

### 4. Validation in Route Handlers

Location validation is automatically enforced in:
- ✅ **Cart**: `POST /api/cart/add` - Check location before adding items
- ✅ **Orders**: `POST /api/orders` - Check location before creating order
- ✅ **Payment**: `POST /api/payment/initialize` - Check location before payment

Example error response:
```json
{
  "error": "Service not available in your location",
  "reason": "Service not available in Accra"
}
```

---

## Frontend Integration

### 1. Components

#### LocationSelector Component
```javascript
import LocationSelector from './components/LocationSelector';

// Inline mode
<LocationSelector onLocationSelect={handleLocationSelected} />

// Modal mode
<LocationSelector showModal={true} onLocationSelect={handleLocationSelected} />
```

Props:
- `onLocationSelect(data)` - Callback when location is selected
- `initialRegionId` - Pre-select region
- `initialCityId` - Pre-select city
- `showModal` - Show as modal overlay

#### AdminLocations Component
```javascript
import AdminLocations from './components/AdminLocations';

// Add to admin dashboard
<AdminLocations />
```

Shows:
- Statistics (active/inactive regions/cities)
- Expandable region cards
- Toggle switches for each location
- Real-time updates

### 2. Location Utilities

Available in `utils/locationUtils.js`:

```javascript
// Get location from localStorage
getUserLocationFromStorage() -> object

// Save location to localStorage
saveUserLocationToStorage(location)

// Check access via API
checkUserLocationAccess(token) -> { can_access, reason }

// Get user location info
getUserLocationInfo(token) -> { region_name, city_name, is_active }

// Auto-detect Ghana location (IP-based)
detectGhanaLocation() -> { region_name, city_name, country, ip }

// Suggest region/city from detection
suggestLocation(detectedLocation) -> { suggested_region, message }

// Check if location selector needed
shouldShowLocationSelector(authenticated, userLocation) -> bool

// Format location for display
formatLocation(location) -> string
```

### 3. Integration with Existing Pages

#### HomePage
```javascript
// On page load
useEffect(() => {
  const token = localStorage.getItem('access_token');
  if (token) {
    check LocationAccess:
    checkUserLocationAccess(token).then(result => {
      if (!result.can_access) {
        showRestrictionMessage(result.reason);
        disablePurchase();
      }
    });
  }
}, []);
```

#### LoginPage / RegisterPage
```javascript
// After successful login/registration
// Show LocationSelector modal

<LocationSelector 
  showModal={true}
  onLocationSelect={() => {
    // Navigate to home or intended page
    navigate('/');
  }}
/>
```

#### CartPage
```javascript
// On page load
useEffect(() => {
  const location = getUserLocationFromStorage();
  if (!location || !location.is_active) {
    showAccessDeniedMessage();
    disableCheckout();
  }
}, []);
```

#### CheckoutPage
```javascript
// Before showing payment options
const token = localStorage.getItem('access_token');
const access = await checkUserLocationAccess(token);

if (!access.can_access) {
  return <AccessDeniedPage reason={access.reason} />;
}

// Show checkout form only if location is active
```

#### AdminDashboard
```javascript
// Add new tab or section
import AdminLocations from './components/AdminLocations';

const tabs = [
  { label: 'Dashboard', component: DashboardStats },
  { label: 'Products', component: AdminProducts },
  { label: 'Orders', component: AdminOrders },
  { label: 'Users', component: AdminUsers },
  { label: 'Locations', component: AdminLocations }  // NEW
];
```

---

## Admin Dashboard

### Features

1. **Statistics Card**
   - Total/Active regions
   - Total/Active cities
   - Users with location selected

2. **Region Cards**
   - Expandable list of regions
   - Toggle active/inactive
   - Shows city count
   - Color-coded status

3. **City Management**
   - Under each expanded region
   - Individual toggle for each city
   - Real-time status updates

4. **Error Handling**
   - Validation error messages
   - Network error handling
   - Auto-retry mechanism

### Workflow
1. Login as admin
2. Navigate to "Locations" tab
3. View all regions and cities
4. Click region to expand cities
5. Toggle regions ON/OFF
6. Toggle cities ON/OFF individually
7. Changes save immediately
8. Statistics update in real-time

---

## API Reference

### Error Responses

#### Service Not Available (403)
```json
{
  "error": "Service not available in your location",
  "reason": "Service not available in Cape Coast"
}
```

#### Invalid Location (400)
```json
{
  "error": "Service not available in Accra"
}
```

#### Location Not Set (400)
```json
{
  "error": "Location not set"
}
```

### Success Responses

#### Get Current Location
```json
{
  "message": "User location retrieved successfully",
  "data": {
    "user_id": 1,
    "region_id": 1,
    "city_id": 5,
    "region_name": "Greater Accra",
    "city_name": "Accra",
    "is_active": true,
    "reason": "Location active"
  }
}
```

#### Select Location
```json
{
  "message": "Location selected successfully",
  "data": {
    "user_id": 1,
    "region_id": 1,
    "city_id": 5,
    "region_name": "Greater Accra",
    "city_name": "Accra",
    "is_active": true
  }
}
```

#### Check Access
```json
{
  "message": "User access checked",
  "can_access": true,
  "region": "Greater Accra",
  "city": "Accra",
  "reason": "Location is active"
}
```

---

## Security Considerations

### 1. Backend Validation (CRITICAL)
✅ **Always validate location server-side**
- Users cannot bypass client-side restrictions
- Location check happens before cart/order operations
- Prevents direct API exploitation

### 2. Authentication
✅ **All sensitive endpoints require JWT**
- User location selection requires login
- Admin routes require admin role
- Rate limiting on all endpoints

### 3. Data Integrity
✅ **Foreign key constraints**
- City must belong to Region
- User references valid Region and City
- Database enforces relationships

### 4. Privacy
✅ **Location data is minimal**
- Only region and city stored
- No tracking of movement
- User can change location anytime

### 5. Attack Prevention
✅ **Rate limiting**
- 50 requests/min for read operations
- 10 requests/min for location selection
- 5 requests/min for order creation

---

## Testing & Troubleshooting

### Initial Setup Test

```bash
# 1. Verify database
curl http://localhost:5000/api/location/regions

# 2. Create test user and login
# 3. Select location
curl -X POST http://localhost:5000/api/location/user/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"region_id": 1, "city_id": 5}'

# 4. Check access
curl http://localhost:5000/api/location/user/check-access \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Try adding to cart (should succeed if location is active)
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"product_id": 1, "quantity": 1}'
```

### Common Issues

#### No Regions Found
**Solution**: Run `python setup_locations.py`

#### "City not found" error
**Solution**: Verify City has correct region_id and is created

#### Location selector not showing
**Solution**: Check if `LocationSelector` component is imported and rendered

#### Admin can't toggle locations
**Solution**: Verify admin user has `is_admin=True` in database

#### Frontend can't access location API
**Solution**: Check CORS settings in `app.py` include location routes

### Debug Mode

#### Enable verbose logging
```python
# In app.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### Test specific location
```python
from app import app, db
from models import Region, City

with app.app_context():
    region = Region.query.filter_by(name='Greater Accra').first()
    if region:
        cities = City.query.filter_by(region_id=region.id).all()
        for city in cities:
            print(f"{region.name} -> {city.name} (active: {city.is_active})")
```

---

## Ghana Regions Included

All 16 regions are included with major cities:

1. Greater Accra (10 cities)
2. Ashanti (6 cities)
3. Central (6 cities)
4. Northern (6 cities)
5. Upper East (5 cities)
6. Upper West (5 cities)
7. Volta (6 cities)
8. Eastern (6 cities)
9. Western (6 cities)
10. Bono (5 cities)
11. Bono East (3 cities)
12. Ahafo (4 cities)
13. Savannah (4 cities)
14. North East (3 cities)
15. Oti (3 cities)
16. Wese (4 cities)

**Total: 16 regions, 97 cities**

---

## Production Checklist

- ✅ Database backup before running setup
- ✅ Test location selection on staging
- ✅ Verify cart/order validation works
- ✅ Test admin panel location management
- ✅ Check all error messages display correctly
- ✅ Verify rate limiting works
- ✅ Test with inactive regions (expect failure)
- ✅ Load test the location API endpoints
- ✅ Review security logs
- ✅ Document admin procedures for toggling locations

---

## Support & Maintenance

### Regular Tasks
- Monitor location access patterns
- Review location statistics weekly
- Backup location configuration
- Test location restrictions monthly

### Updates
- To add new regions: Edit `GHANA_REGIONS` in `utils/ghana_locations.py`, run setup
- To modify city names: Update database directly via admin panel
- To change default active status: Modify in admin panel

---

**System Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Production Ready ✅
