# BlessedNet - Pre-Deployment Checklist

Use this checklist to ensure everything is properly configured before deploying to production.

## ✅ Backend Pre-Deployment

### Database & Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Generate new `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Generate new `JWT_SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Set `FLASK_DEBUG=False` for production
- [ ] Configure `DATABASE_URL` (use PostgreSQL, not SQLite)
- [ ] Update `CORS_ORIGINS` with your production domain
- [ ] Set `DEFAULT_ADMIN_PASSWORD` to something secure
- [ ] Update all Paystack keys with production keys (not test keys)
- [ ] Configure WhatsApp credentials with production account
- [ ] All required environment variables are set

### Database
- [ ] PostgreSQL or suitable production database is running
- [ ] Database connection string is correct
- [ ] Database user has proper permissions
- [ ] Database backups are configured and tested

### Dependencies
- [ ] `pip install -r requirements.txt` runs without errors
- [ ] All packages are compatible versions
- [ ] No deprecated packages used

### Security
- [ ] Admin password changed from default
- [ ] All API keys/secrets are strong and stored in `.env`
- [ ] `.env` file is NOT committed to version control
- [ ] `.gitignore` includes `.env` file
- [ ] HTTPS/SSL is enabled for production domain
- [ ] CORS allows only your production domain
- [ ] Rate limiting is configured appropriately

### Testing
- [ ] Backend starts: `python app.py`
- [ ] Admin user is auto-created
- [ ] 13 regions are auto-seeded
- [ ] No errors in startup logs
- [ ] `/health` endpoint responds correctly
- [ ] Database tables are created
- [ ] Can register new user via API
- [ ] Can login user via API
- [ ] Can create product (admin)
- [ ] Can create order (user with valid region)
- [ ] Payment verification works with test keys

### Endpoints
- [ ] All `/api/auth/*` endpoints working
- [ ] All `/api/products/*` endpoints working
- [ ] All `/api/cart/*` endpoints working
- [ ] All `/api/orders/*` endpoints working
- [ ] All `/api/location/*` endpoints working
- [ ] All `/api/admin/*` endpoints require admin role
- [ ] 404 errors return proper JSON
- [ ] 500 errors are logged and handled gracefully

### Performance
- [ ] Database indexes are configured
- [ ] Slow queries are optimized
- [ ] Rate limiter is configured
- [ ] Response times are acceptable

---

## ✅ Frontend Pre-Deployment

### Configuration
- [ ] Create `.env` file with `REACT_APP_API_URL=https://your-backend-domain.com/api`
- [ ] Set `REACT_APP_PAYSTACK_PUBLIC_KEY` with production key
- [ ] Remove any console.log() debug statements (or set conditional)
- [ ] Update `package.json` with correct homepage URL

### Build & Assets
- [ ] `npm install` completes without errors or warnings
- [ ] `npm run build` succeeds without errors
- [ ] Build folder is created correctly
- [ ] All dependencies are in `node_modules`
- [ ] No security vulnerabilities: `npm audit`
- [ ] Production size is acceptable (no bloated bundles)

### Testing
- [ ] App runs locally: `npm start`
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] All pages load correctly
- [ ] All API calls point to correct backend
- [ ] Images load properly
- [ ] Forms submit correctly
- [ ] Cart persists after page refresh
- [ ] Admin dashboard loads (if admin)
- [ ] Can complete checkout flow (with test payment method)

### Mobile/Responsive
- [ ] App works on mobile devices
- [ ] Touch interactions work correctly
- [ ] Layout is responsive
- [ ] Forms are usable on small screens
- [ ] Buttons are clickable (large enough)

### Security
- [ ] No sensitive data in client code
- [ ] `.env` file is NOT committed
- [ ] `.gitignore` includes `.env`
- [ ] API keys in `.env` are for production
- [ ] No hardcoded backend URLs (uses REACT_APP_API_URL)
- [ ] Authentication tokens stored securely (localStorage okay for this app)

### Performance
- [ ] Code-splitting is configured
- [ ] Lazy loading for routes
- [ ] Images are optimized
- [ ] No unused dependencies
- [ ] Bundle size is reasonable

---

## ✅ Deployment Infrastructure

### Server/Hosting
- [ ] Server has enough CPU and RAM for expected traffic
- [ ] Server has SSD storage
- [ ] Server is in proper geographic region
- [ ] Firewall rules are configured
- [ ] SSH access is secured
- [ ] Automatic backups are enabled

### SSL/HTTPS
- [ ] SSL certificate is valid and not expired
- [ ] Certificate is from trusted CA
- [ ] HTTPS redirects HTTP traffic
- [ ] SSL is enforced in CORS configuration

### Database
- [ ] PostgreSQL is installed and running
- [ ] Database is created
- [ ] User permissions are correct
- [ ] Backups are automated and tested
- [ ] Backup retention policy is set
- [ ] Disaster recovery plan exists

### Monitoring & Logging
- [ ] Error logging is configured (Sentry, DataDog, etc.)
- [ ] Application logs are collected and stored
- [ ] Database performance is monitored
- [ ] Uptime monitoring is configured
- [ ] Alert notifications are set up
- [ ] Log retention policy is defined

### Domains & DNS
- [ ] Domain is registered and active
- [ ] DNS records are correct (A records, CNAME, etc.)
- [ ] DNS propagation is complete
- [ ] WHOIS privacy is configured (if needed)

---

## ✅ Final Pre-Launch Verification

### Functionality Testing
- [ ] Create an account as new user ✅
- [ ] Add products to cart ✅
- [ ] View cart correctly ✅
- [ ] Proceed to checkout ✅
- [ ] Select region/city ✅
- [ ] Delivery fee displays correctly ✅
- [ ] Complete order creation ✅
- [ ] Receive order confirmation ✅
- [ ] Can log back in with account ✅
- [ ] Order appears in order history ✅
- [ ] Admin can view order ✅

### Admin Testing
- [ ] Login as admin with credentials ✅
- [ ] Admin dashboard loads ✅
- [ ] Can view all products ✅
- [ ] Can add new product ✅
- [ ] Can edit product ✅
- [ ] Can delete product ✅
- [ ] Can view all orders ✅
- [ ] Can change order status ✅
- [ ] Can view all users ✅
- [ ] Can manage regions/cities ✅
- [ ] Can edit delivery fees ✅

### Error Handling
- [ ] Login fails with wrong password (error message shown)
- [ ] Cannot checkout with empty cart (error message shown)
- [ ] Cannot checkout without shipping info (error message shown)
- [ ] Network errors are handled gracefully
- [ ] Invalid API responses are handled
- [ ] 404 errors show proper message
- [ ] 500 errors are logged and user sees friendly message

### Edge Cases
- [ ] Can handle multiple simultaneous users
- [ ] Can handle concurrent orders
- [ ] Cart persists across sessions
- [ ] Tokens are refreshed/valid for 30 days
- [ ] Expired tokens redirect to login
- [ ] Admin cannot modify non-admin user to admin via API
- [ ] Users cannot view other users' orders
- [ ] Users cannot checkout from region with `is_active=false`

---

## 📋 Production Credentials & Secrets

### Secure Storage
- [ ] Production credentials stored in password manager
- [ ] Never share credentials in chat or email
- [ ] Credentials backed up in secure location
- [ ] Rotation schedule exists for sensitive credentials
- [ ] `.env` file is never committed to git

### Credentials to Secure
- [ ] `.env` file (entire)
- [ ] Database password
- [ ] JWT secret keys
- [ ] Paystack secret key (not public)
- [ ] WhatsApp API tokens
- [ ] Admin account password

### To Generate
```bash
# Secret Keys
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Strong Password (use a password manager or):
# openssl rand -base64 12
```

---

## 🚀 Launch Sequence

### 1. Pre-Launch (48 hours before)
- [ ] Run through entire checklist
- [ ] Conduct final testing
- [ ] Brief team on launch plan
- [ ] Ensure backups are recent and tested
- [ ] Have rollback plan ready

### 2. Launch Day (Before going live)
- [ ] Deploy backend to production server
- [ ] Test backend endpoints from production domain
- [ ] Deploy frontend to CDN/hosting
- [ ] Test frontend can connect to backend
- [ ] Verify all features work in production
- [ ] Monitor logs for errors

### 3. Launch Monitoring
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Monitor error logs
- [ ] Monitor database connections
- [ ] Watch for user complaints
- [ ] Check payment processing logs
- [ ] Verify emails/notifications work

### 4. Post-Launch (First week)
- [ ] Daily monitoring of all systems
- [ ] User support ready for issues
- [ ] Performance optimization if needed
- [ ] Daily backup verification
- [ ] Weekly security scan

---

## 🆘 Rollback Plan

### If Critical Issue Found
1. Immediately take site into maintenance mode
2. Stop accepting new orders
3. Notify users of issue
4. Review logs to identify problem
5. Option A: Deploy quick fix if simple
6. Option B: Rollback to previous version
7. Restore from backup if data corruption
8. Communicate resolution timeline to users

### Keeping Old Version Ready
- [ ] Tag git commits with version numbers
- [ ] Keep docker images of previous versions
- [ ] Database migrations are reversible
- [ ] Backup of production database before deployment

---

## 📊 Post-Launch Monitoring

### Daily
- [ ] Check error logs
- [ ] Verify payment processing
- [ ] Check database performance
- [ ] Review user activity

### Weekly
- [ ] Review analytics
- [ ] Check customer support tickets
- [ ] Performance analysis
- [ ] Security scan
- [ ] Backup integrity check

### Monthly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Update logs retention
- [ ] Review and update monitoring alerts
- [ ] Plan for next update/feature release

---

## 📝 Document Reminders

### Share With Team
- [ ] Setup guide (`SETUP_AND_DEPLOYMENT.md`)
- [ ] API documentation
- [ ] Admin guide
- [ ] Troubleshooting guide

### Keep Updated
- [ ] Database schema documentation
- [ ] API changelog
- [ ] Deployment procedures
- [ ] Security policies
- [ ] Disaster recovery procedures

---

## ✨ Success Indicators

Know your launch was successful when:

✅ Site is live and accessible
✅ All tests pass
✅ No 500 errors in logs
✅ Customers can register and purchase
✅ Admin can manage products/orders
✅ Payments are processing correctly
✅ Emails/notifications work
✅ Performance is acceptable
✅ No security issues reported
✅ Users can successfully complete full checkout flow

---

## 🎯 Quick Launch Readiness Check

**Can you answer YES to all of these?**

1. Do you have production credentials ready? ✅
2. Is your database configured and tested? ✅
3. Is your domain and SSL ready? ✅
4. Have you tested the full purchase workflow? ✅
5. Can admin login and manage products? ✅
6. Is error logging configured? ✅
7. Are backups tested and automatic? ✅
8. Is monitoring set up? ✅
9. Is a rollback plan in place? ✅
10. Is support staff trained? ✅

**If YES to all:** You're ready to launch!
**If NO to any:** Complete that item before launching.

---

**Last Updated**: 2024
**System**: BlessedNet v1.0.0
**Status**: Ready for Production
