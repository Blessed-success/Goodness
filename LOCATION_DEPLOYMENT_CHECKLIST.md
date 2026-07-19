# Location System - Production Deployment Checklist

## ✅ Phase 1: Pre-Deployment (Staging Environment)

### Database Setup
- [ ] Backup existing database
- [ ] Create new database migration file (if using Alembic)
- [ ] Review `BACKEND/models.py` changes (Region, City, User updates)
- [ ] Test models on staging: `python` → `from models import Region, City, db`
- [ ] Verify foreign key constraints are properly created

### Backend Preparation
- [ ] Review all modified route files:
  - [ ] `BACKEND/routes/location.py` (new)
  - [ ] `BACKEND/routes/cart.py` (modified)
  - [ ] `BACKEND/routes/orders.py` (modified)
  - [ ] `BACKEND/routes/payment.py` (modified)
  - [ ] `BACKEND/app.py` (modified)
- [ ] Verify imports: `from routes.location import location_bp`
- [ ] Check Flask-Limiter is installed: `pip list | grep Flask-Limiter`
- [ ] Review rate limiting settings
- [ ] Check error handling (all use `safe_error_response()`)
- [ ] Verify JWT authentication on admin routes

### Backend Testing
- [ ] Test GET /api/location/regions → Returns [16 regions]
- [ ] Test GET /api/location/regions/1 → Returns region with cities
- [ ] Test POST /api/location/user/select → Validates region/city
- [ ] Test GET /api/location/user/check-access → Returns access status
- [ ] Test PUT /api/location/admin/regions/1 → Toggle active (admin only)
- [ ] Test cart add with location check → Should return 403 if inactive
- [ ] Test order creation with location check → Should block if inactive
- [ ] Test payment init with location check → Should return 403
- [ ] Test rate limiting: Hit endpoint 11 times → Should get 429 on 11th

### Frontend Preparation
- [ ] Review component files:
  - [ ] `FRONTEND/src/components/LocationSelector.js` (new)
  - [ ] `FRONTEND/src/components/LocationSelector.css` (new)
  - [ ] `FRONTEND/src/components/AdminLocations.js` (new)
  - [ ] `FRONTEND/src/components/AdminLocations.css` (new)
  - [ ] `FRONTEND/src/utils/locationUtils.js` (new)
- [ ] Ensure all imports are correct
- [ ] Verify CSS classes don't conflict
- [ ] Check for console errors during development

### Frontend Testing
- [ ] Test LocationSelector renders correctly
- [ ] Test region dropdown loads regions
- [ ] Test city dropdown updates when region changes
- [ ] Test form validation (both fields required)
- [ ] Test localStorage saving: `localStorage.getItem('user_location')`
- [ ] Test AdminLocations renders statistics
- [ ] Test toggle switches work and update immediately
- [ ] Test error states display correctly
- [ ] Test loading states display correctly
- [ ] Test responsive design on mobile (600px screen)

### Integration Testing
- [ ] Register new user → Should show LocationSelector
- [ ] Select location → Should save to localStorage and user profile
- [ ] Verify location appears in user info
- [ ] Try to add inactive location to cart → Should show error
- [ ] Activate location in admin panel → Should allow cart add
- [ ] Navigate to admin panel → Location tab should show
- [ ] Toggle region on/off → Stats should update
- [ ] Toggle city on/off → Stats should update
- [ ] Check user is blocked from checkout if location inactive
- [ ] Test payment initialization with inactive location → Should block

### Security Testing
- [ ] Verify authentication required on user routes: `GET /user/current`
- [ ] Verify authentication required on admin routes: `PUT /admin/regions/1`
- [ ] Verify admin role required: Try non-admin user on admin route
- [ ] Test rate limiting: Send 15 requests in 1 minute → Get 429
- [ ] Test invalid region/city pair: Send non-existent IDs → Should fail validation
- [ ] Verify location validation cannot be bypassed via API
- [ ] Check no sensitive data in error responses

### Performance Testing
- [ ] Measure API response time: `GET /regions` → Should be < 100ms
- [ ] Measure database query time: `SELECT * FROM regions` → < 50ms
- [ ] Check bundle size increase: `npm run build` → Check gzip size
- [ ] Test with 100 simultaneous requests → No issues
- [ ] Monitor memory usage: Should not increase over time

### Documentation Review
- [ ] Review `LOCATION_SYSTEM_GUIDE.md` for accuracy
- [ ] Review `LOCATION_QUICK_START.md` for completeness
- [ ] Review `LOCATION_INTEGRATION_EXAMPLES.md` for correctness
- [ ] Verify all code examples work
- [ ] Check all links are correct

---

## ✅ Phase 2: Staging Environment Validation

### Deploy to Staging
```bash
# Backend
cd BACKEND
pip install -r requirements.txt
python setup_locations.py  # Seed database

# Frontend
cd FRONTEND
npm install
npm run build
npm start
```

### Smoke Tests (After Deployment)
- [ ] Homepage loads without errors
- [ ] Can register new user
- [ ] LocationSelector appears after registration
- [ ] Can select location
- [ ] Can add products to cart (location active)
- [ ] Can proceed to checkout
- [ ] Can initialize payment
- [ ] Admin can toggle locations
- [ ] Stats update in real-time
- [ ] Mobile design works on all breakpoints

### Staging User Acceptance Testing
- [ ] Business stakeholder tries user flow
- [ ] Business stakeholder tests admin flow
- [ ] Customer support team tests error messages
- [ ] Verify error messages are helpful (not technical)
- [ ] Verify no broken links in documentation

### Staging Database Validation
- [ ] Verify 16 regions in database
- [ ] Verify 97 cities in database
- [ ] Verify unique constraint on (region_id, city_name)
- [ ] Verify foreign keys work correctly
- [ ] Test SQL directly: `SELECT COUNT(*) FROM regions WHERE is_active=true`
- [ ] Verify indexes created on name, region_id, is_active

### Staging API Validation
- [ ] Test all public endpoints return expected responses
- [ ] Test all user endpoints with valid token
- [ ] Test all admin endpoints with admin token
- [ ] Verify 403 returned for non-admin users
- [ ] Verify 401 returned for missing token
- [ ] Test error response format: `{"error": "message", ...}`

---

## ✅ Phase 3: Production Preparation

### Database Backup & Plan
```bash
# Backup current production database
pg_dump -U postgres production_db > backup_$(date +%Y%m%d).sql

# Create migration plan
# Option 1: Zero-downtime migration (preferred)
# Option 2: Brief maintenance window
```

### Final Code Review
- [ ] All files reviewed by team lead
- [ ] No hardcoded values or credentials
- [ ] All error handling in place
- [ ] All logging statements present
- [ ] Code style consistent
- [ ] Comments adequate but not excessive
- [ ] No console.log or print statements left
- [ ] No TODO/FIXME comments

### Secret Management
- [ ] Verify no secrets in git history
- [ ] Verify `.env` not committed
- [ ] All secrets stored in secure vault
- [ ] Database credentials secure
- [ ] JWT secret is strong (32+ chars)

### Performance Checklist
- [ ] Database indexes created
- [ ] Query optimization complete
- [ ] Caching strategy in place
- [ ] Bundle size acceptable
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] No unused dependencies

### Monitoring & Alerting
- [ ] Error logging configured
- [ ] Database monitoring enabled
- [ ] API response time monitoring
- [ ] Rate limiting monitoring
- [ ] Alert configured for location route errors
- [ ] Alert configured for database connection errors
- [ ] Slack webhook configured for alerts

---

## ✅ Phase 4: Production Deployment

### Pre-Deployment Notification
- [ ] Notify customer support team
- [ ] Notify product team
- [ ] Schedule deployment window
- [ ] Prepare rollback plan
- [ ] Inform users (if needed)

### Deployment Steps (Choose One)

#### Option A: Zero-Downtime Deployment
```bash
# 1. Deploy new code to new instance (blue-green)
git pull origin main
cd BACKEND && pip install -r requirements.txt
cd FRONTEND && npm install && npm run build

# 2. Run database migration
python setup_locations.py

# 3. Smoke test new instance
pytest tests/

# 4. Switch traffic to new instance
# Update load balancer or DNS

# 5. Keep old instance running for 1 hour (rollback)
# Monitor new instance
```

#### Option B: Maintenance Window Deployment
```bash
# 1. Notify users: Maintenance 2:00 AM - 2:30 AM
# 2. Stop application server
# 3. Backup database
pg_dump -U postgres production_db > backup_final.sql
# 4. Deploy code
git pull origin main
# 5. Install dependencies
pip install -r BACKEND/requirements.txt
npm install --prefix FRONTEND
npm run build --prefix FRONTEND
# 6. Run database setup
cd BACKEND && python setup_locations.py
# 7. Start application server
# 8. Run smoke tests
# 9. Notify users: System is back online
```

### Deployment Checklist
- [ ] Code deployed successfully
- [ ] Database migration completed
- [ ] All services are up and running
- [ ] No errors in application logs
- [ ] API endpoints responding
- [ ] Frontend loads correctly

### Post-Deployment Validation

#### Immediate (First 5 minutes)
- [ ] Application loads without errors
- [ ] No 500 errors in logs
- [ ] Database connections working
- [ ] All routes responding

#### Short-term (First 30 minutes)
- [ ] LocationSelector appears for new users
- [ ] Location selection works end-to-end
- [ ] Cart validation working
- [ ] Admin can toggle locations
- [ ] Error messages display correctly
- [ ] No database connection issues
- [ ] Rate limiting working (send 11 requests)

#### Standard (After 1 hour)
- [ ] Monitor error rates → Should be minimal
- [ ] Check API response times → Should be < 100ms
- [ ] Verify database performance → No slow queries
- [ ] Check memory usage → Stable
- [ ] Verify cache is working → Response times normal
- [ ] Check user locations are saving → Sample queries

### Rollback Plan

If critical issues discovered:

```bash
# 1. Revert to previous version
git revert HEAD
git push

# 2. Restart application
systemctl restart blessednet-api

# 3. Notify stakeholders
# 4. Investigate issue offline
# 5. Fix and re-deploy
```

---

## ✅ Phase 5: Post-Deployment Monitoring (24 Hours)

### Continuous Monitoring
- [ ] Error logs: Check for location-related errors
- [ ] Database queries: Monitor for slow queries
- [ ] API response times: Should average < 100ms
- [ ] User registration: Verify location selection is happening
- [ ] Cart operations: Verify location validation is enforcing
- [ ] Admin operations: Verify location toggles are working
- [ ] Database size: Verify not growing unexpectedly

### User Feedback
- [ ] Monitor support tickets for location-related issues
- [ ] Check social media for complaints
- [ ] Get stakeholder feedback
- [ ] Verify customer satisfaction

### Performance Metrics
- [ ] Record baseline API response times
- [ ] Record database query times
- [ ] Record error rates
- [ ] Record user location distribution
- [ ] Compare with pre-deployment metrics

### Security Monitoring
- [ ] Verify no unauthorized access attempts
- [ ] Check rate limiting is working (look for 429 responses)
- [ ] Verify authentication required on protected endpoints
- [ ] Check for any SQL injection attempts in logs
- [ ] Monitor for any suspicious API patterns

---

## ✅ Phase 6: Long-term Maintenance

### Weekly Tasks
- [ ] Review error logs for patterns
- [ ] Check location access patterns (which regions active)
- [ ] Monitor database size growth
- [ ] Verify all endpoints responding
- [ ] Check rate limiting is effective

### Monthly Tasks
- [ ] Review user location distribution
- [ ] Check if any regions should be enabled/disabled
- [ ] Update documentation based on usage
- [ ] Review and optimize slow queries
- [ ] Backup and verify database backups

### Quarterly Tasks
- [ ] Update Ghana regions/cities if changed
- [ ] Review security logs
- [ ] Performance optimization review
- [ ] Capacity planning (will we need upgrades?)
- [ ] Disaster recovery drill

### Annual Tasks
- [ ] Complete security audit
- [ ] Update all dependencies
- [ ] Review and update documentation
- [ ] Plan for next year's improvements
- [ ] Team training on new system

---

## 🔍 Common Deployment Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 error on /regions | setup_locations.py not run | Run `python setup_locations.py` |
| LocationSelector not rendering | Component import missing | Add `import LocationSelector from...` |
| Location validation not blocking | Route changes not deployed | Verify cart.py/orders.py/payment.py have validation |
| Admin can't toggle | User not admin | Verify `is_admin=True` in database |
| Rate limiting too aggressive | Limit value too low | Adjust limiter.limit() values |
| Rate limiting not working | Flask-Limiter not installed | Install: `pip install Flask-Limiter` |
| CSS styling broken | CSS files not deployed | Verify .css files in FRONTEND/src/components/ |
| API returning empty | Database empty | Run `python setup_locations.py` |
| LocationSelector timeout | API endpoint missing | Verify location.py route file deployed |

---

## 📞 Emergency Contacts

**Issues During Deployment:**
- Database errors → Database admin
- Backend errors → Backend team
- Frontend errors → Frontend team
- Deployment issues → DevOps/Infrastructure team

**For Rollback:**
- Contact DevOps immediately
- Have previous version tag ready
- Have backup database ready

---

## 📋 Deployment Sign-Off

- [ ] Database admin: _____________________ Date: _______
- [ ] Backend lead: _____________________ Date: _______
- [ ] Frontend lead: _____________________ Date: _______
- [ ] DevOps lead: _____________________ Date: _______
- [ ] Product manager: _____________________ Date: _______
- [ ] QA lead: _____________________ Date: _______

---

## 📝 Post-Deployment Notes

Use this section to document what happened:

**Deployment Date & Time**: ____________________

**Deployed By**: ____________________

**Issues Encountered**: 

**Time to Deploy**: ____________________

**Rollback Needed**: Yes / No

**User Impact**: None / Minimal / Moderate / Major

**Follow-up Actions**:

---

**Last Updated**: April 5, 2026  
**Version**: 1.0  
**Status**: Ready for Production Deployment
