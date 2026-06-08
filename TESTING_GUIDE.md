# 🧪 COMPLETE TESTING GUIDE

**Date:** 2024-01-15  
**Status:** ✅ Ready for Testing  
**All Fixes Applied:** ✅ YES

---

## QUICK START (5 Minutes)

### Prerequisites
```bash
# Backend
Python 3.7+
pip install -r requirements.txt

# Frontend
Node.js 14+
npm install
```

### 1️⃣ Start Backend
```bash
cd BACKEND
export FLASK_ENV=development
export JWT_SECRET_KEY=test-secret-key
export DEFAULT_ADMIN_EMAIL=admin@test.com
export DEFAULT_ADMIN_PASSWORD=Admin@123!
python app.py
```

**Expected Output:**
```
✅ Database tables created successfully
✅ Default admin user created: admin@test.com
✅ Default Ghana regions and cities seeded (13 regions)
⚠️  Price monitor scheduler disabled for debugging
* Running on http://0.0.0.0:5000
```

### 2️⃣ Start Frontend
```bash
cd FRONTEND
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view the app in the browser.
🔗 API Base URL: http://localhost:5000/api
```

---

## TEST 1: User Registration ✅

### Test Case 1.1: Valid Registration
**URL:** `http://localhost:3000/register`

**Input:**
```json
{
  "fullName": "John Tester",
  "username": "johntester",
  "email": "john@test.com",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "phone": "+233123456789"
}
```

**Expected Result:**
```json
✅ Success
- User created in database
- Token generated
- Redirected to location selector
- Console: 🔗 API Base URL: http://localhost:5000/api (Dynamic URL works!)
```

**What's Being Tested:**
- ✅ Import fix: `current_app` logging works
- ✅ Frontend fix: Dynamic API URL connects properly
- ✅ Password validation: Strong password accepted

---

### Test Case 1.2: Weak Password (Should Fail)
**Input:**
```json
{
  "fullName": "Jane Tester",
  "username": "janetester",
  "email": "jane@test.com",
  "password": "weak",
  "confirmPassword": "weak"
}
```

**Expected Result:**
```
❌ Error: "Password must be at least 8 characters long"
```

**Why:** We added enhanced password validation

---

### Test Case 1.3: Missing Special Character (Should Fail)
**Input:**
```json
{
  "password": "NoSpecial123"
}
```

**Expected Result:**
```
❌ Error: "Password must contain at least one special character"
```

---

## TEST 2: User Login ✅

### Test Case 2.1: Valid Admin Login
**URL:** `http://localhost:3000/login`

**Input:**
```json
{
  "email": "admin@test.com",
  "password": "Admin@123!"
}
```

**Expected Result:**
```json
✅ Success
- Token: eyJhbGc... (24-hour expiry token)
- User object returned
- Redirected to dashboard
- Console shows: 🔗 API Base URL: http://localhost:5000/api
```

**What's Being Tested:**
- ✅ Backend fix: Admin user created with proper password hashing
- ✅ Backend fix: JWT token generated with 24-hour expiry
- ✅ Frontend fix: Token stored in localStorage
- ✅ Frontend fix: Authorization header added to requests

---

### Test Case 2.2: Invalid Password (Should Fail)
**Input:**
```json
{
  "email": "admin@test.com",
  "password": "WrongPassword"
}
```

**Expected Result:**
```
❌ Error: "Invalid email or password"
```

---

### Test Case 2.3: Non-existent Email (Should Fail)
**Input:**
```json
{
  "email": "nonexistent@test.com",
  "password": "Admin@123!"
}
```

**Expected Result:**
```
❌ Error: "Invalid email or password"
```

---

## TEST 3: Admin Dashboard ✅

### Test Case 3.1: Access Admin Dashboard
**URL:** `http://localhost:3000/admin`

**Expected Result:**
```
✅ Success
- Admin dashboard loads
- Shows "Admin Dashboard" title
- Displays statistics, products, orders, users tabs
- No "Unauthorized" error
```

**What's Being Tested:**
- ✅ Admin authorization working
- ✅ JWT protection on routes

---

### Test Case 3.2: Non-Admin Cannot Access Dashboard
**Steps:**
1. Register as regular user
2. Try accessing `http://localhost:3000/admin` directly

**Expected Result:**
```
❌ Redirect to home or show "Access Denied"
```

---

## TEST 4: Password Strength Validation ✅

### All Test Cases:

| Password | Expected | Why |
|----------|----------|-----|
| `Pass123` | ❌ FAIL | Less than 8 chars |
| `password123` | ❌ FAIL | No uppercase |
| `PASSWORD` | ❌ FAIL | No digit |
| `Password1` | ❌ FAIL | No special char |
| `Password1!` | ✅ PASS | Meets all criteria |
| `Secure#Pass123` | ✅ PASS | All requirements |

### Test Implementation:
```bash
# Run this in browser console after registering:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "weak",
    "full_name": "Test User"
  }'

# Expected: 400 error with password requirement message
```

---

## TEST 5: Rate Limiting ✅

### Test Case 5.1: Registration Rate Limit (10 per minute)
**Steps:**
1. Run registration request 11 times rapidly
2. Check 11th request

**Expected Result:**
```
❌ 429 Too Many Requests
Error: "Rate limit exceeded"
```

**Test Script:**
```bash
for i in {1..12}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"email\":\"user$i@test.com\",\"password\":\"SecurePass123!\"}"
  echo "Request $i completed"
  sleep 1
done
```

---

### Test Case 5.2: Profile Update Rate Limit (5 per minute)
**Steps:**
1. Login as admin
2. Get auth token
3. Make 6 profile update requests rapidly

**Expected Result:**
```
✅ Requests 1-5: Success (200)
❌ Request 6: Rate limit exceeded (429)
```

**Test Script:**
```bash
TOKEN="your-jwt-token-here"

for i in {1..7}; do
  curl -X PUT http://localhost:5000/api/auth/profile \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"full_name":"Updated Name '$i'"}'
  echo "Request $i"
  sleep 1
done
```

---

## TEST 6: Token Expiry & Logout ✅

### Test Case 6.1: Valid Token Works
**Steps:**
1. Login as user
2. Make API call immediately

**Expected Result:**
```
✅ 200 OK - Request successful
Authorization header includes Bearer token
```

---

### Test Case 6.2: Logout Clears Token
**Steps:**
1. Login
2. Click logout button
3. Check localStorage

**Expected Result:**
```
✅ localStorage cleared
- access_token: removed
- user: removed
- Redirected to /login
```

**Browser Console Test:**
```javascript
// Before logout
console.log(localStorage.getItem('access_token')); 
// Output: "eyJhbGc..."

// After logout
console.log(localStorage.getItem('access_token')); 
// Output: null
```

---

### Test Case 6.3: Expired Token Redirects to Login
**Steps:**
1. Manually set token expiry to past date
2. Make API call
3. Check redirect

**Expected Result:**
```
❌ 401 Unauthorized
✅ Auto-redirect to /login
✅ localStorage cleared
✅ Console: "⚠️ Authentication expired or invalid"
```

---

## TEST 7: Database Validation ✅

### Test Case 7.1: Check Admin User Created
**Command:**
```bash
# Connect to database
sqlite3 blessednet.db

# Check admin user
SELECT * FROM users WHERE is_admin = 1;

# Expected columns exist:
# id | username | email | password_hash | is_admin | is_active | created_at
```

**Expected Result:**
```
1|admin|admin@test.com|$2b$12$...|1|1|2024-01-15 10:00:00
```

---

### Test Case 7.2: Check Regions Seeded
**Command:**
```sql
SELECT name, delivery_fee FROM regions LIMIT 3;
```

**Expected Result:**
```
Greater Accra|5.0
Ashanti|6.0
Central|5.5
```

---

## TEST 8: Frontend Connection ✅

### Test Case 8.1: Browser DevTools Check
**Steps:**
1. Open browser (Chrome/Firefox)
2. Press F12 to open DevTools
3. Go to Console tab
4. Reload page
5. Check logs

**Expected Output:**
```
🔗 API Base URL: http://localhost:5000/api
```

**If Hardcoded URL would show:**
```
🔗 API Base URL: https://api.ever-flourishing.com/api
(❌ WRONG - Won't connect locally)
```

---

### Test Case 8.2: Network Tab Check
**Steps:**
1. DevTools → Network tab
2. Try to login
3. Look for requests to `/api/auth/login`

**Expected:**
```
✅ Request to: http://localhost:5000/api/auth/login
✅ Response: 200 OK
✅ Response body: {"message": "Login successful", ...}
```

---

## TEST 9: Error Handling ✅

### Test Case 9.1: Server Error Handling
**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
```json
{
  "error": "No data provided"
}
```

**Not:**
```json
{
  "error": "Traceback: ...",
  "stack": "..."
}
```

---

## TEST 10: CORS Protection ✅

### Test Case 10.1: Valid Origin
**Request from:** `http://localhost:3000`

**Expected Result:**
```
✅ CORS headers present:
Access-Control-Allow-Origin: http://localhost:3000
```

---

### Test Case 10.2: Invalid Origin
**Request from:** `https://malicious.com`

**Expected Result:**
```
❌ CORS headers NOT present
Request blocked by browser
```

---

## COMPLETE TEST CHECKLIST

- [ ] User Registration with strong password works
- [ ] User Registration with weak password fails
- [ ] User Login with correct credentials works
- [ ] User Login with incorrect credentials fails
- [ ] Admin can access admin dashboard
- [ ] Non-admin cannot access admin dashboard
- [ ] Registration rate limiting works (10/min)
- [ ] Profile update rate limiting works (5/min)
- [ ] Logout clears all auth data
- [ ] Expired tokens redirect to login
- [ ] Dynamic API URL connects to localhost:5000
- [ ] Database has admin user with proper password hash
- [ ] 13 regions seeded with delivery fees
- [ ] Password validation enforces special characters
- [ ] Error messages don't expose stack traces
- [ ] CORS allows localhost:3000
- [ ] JWT token includes 24-hour expiry

---

## TROUBLESHOOTING

### "Cannot GET /api/auth/login"
```
❌ Problem: Frontend connecting to wrong API URL
✅ Fix: Check console for "🔗 API Base URL" 
✅ Should be: http://localhost:5000/api
❌ If showing: https://api.ever-flourishing.com/api (WRONG)
```

### "current_app is not defined"
```
❌ Problem: auth.py missing current_app import
✅ Fix: Should have "from flask import ..., current_app"
✅ Already fixed in updated auth.py
```

### "Admin user not created"
```
❌ Problem: Password hashing incorrect
✅ Fix: Use admin_user.set_password() method
✅ Already fixed in updated app.py
```

### "Rate limiting not working"
```
✅ It IS working if you get 429 after 11 requests
✅ Check: @limiter.limit("10 per minute") decorator present
```

---

## FINAL VERIFICATION

Run this command to verify all fixes:
```bash
# 1. Check imports
grep -n "from flask import.*current_app" BACKEND/routes/auth.py
# Should show: current_app imported ✅

# 2. Check admin user
grep -n "username='admin'" BACKEND/app.py
# Should show: username field present ✅

# 3. Check password setter
grep -n "set_password" BACKEND/app.py
# Should show: set_password method used ✅

# 4. Check dynamic URL
grep -n "localhost:5000" FRONTEND/src/api.js
# Should show: dynamic URL generation ✅
```

---

**All Tests Passed? You're Ready for Production! 🚀**
