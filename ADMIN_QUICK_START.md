# Admin Dashboard - Quick Setup Guide

## 🎯 What You Get

A complete, enterprise-grade admin dashboard for BlessedNet with:
- ✅ Product management (add/edit/delete)
- ✅ Product image uploads
- ✅ Order tracking & status updates
- ✅ User management & permissions
- ✅ Business analytics dashboard
- ✅ Secure JWT authentication
- ✅ Responsive mobile design

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Admin Account

**Via Database (Recommended):**
```bash
# Connect to your PostgreSQL database
psql -U blessednet_user -d blessednet

# Run this SQL command
UPDATE users SET is_admin = TRUE WHERE email = 'rainsemma947@gmail.com';

# Verify
SELECT id, email, is_admin FROM users WHERE email = 'rainsemma947@gmail.com';
```

**Or via Python Shell:**
```bash
cd BACKEND
python
>>> from app import app, db
>>> from models import User
>>> user = User.query.filter_by(email='rainsemma947@gmail.com').first()
>>> user.is_admin = True
>>> db.session.commit()
```

### Step 2: Login

1. Go to `http://localhost:3000/login`
2. Login with your admin email & password
3. Look for "Admin Dashboard" link in user menu

### Step 3: Access Admin Dashboard

**Direct URL:** `http://localhost:3000/admin`

**Via Menu:**
1. Click your username in top right
2. Select "Admin Dashboard"

---

## 📊 Dashboard Overview

### Dashboard Tab
- **Business Stats:** Total products, orders, users, revenue
- **Alerts:** Pending orders, recent activity
- **Analytics:** Top products, 7-day revenue chart
- **Quick Actions:** Fast shortcuts to common tasks

### Products Tab
- **Browse Products:** Paginated list with search
- **Add Product:** Create new product with full details
- **Upload Images:** Drag & drop or click to upload (max 5MB)
- **Edit Product:** Modify any product information
- **Delete Product:** Remove products (with confirmation)

### Orders Tab
- **View Orders:** All orders with search & filters
- **Order Details:** Click "View" to see complete breakdown
- **Update Status:** Change order status (pending → processing → shipped → delivered)
- **Customer Info:** View shipping address and contact

### Users Tab
- **View Users:** All registered customers
- **Search Users:** By email, username, or name
- **Make Admin:** Grant admin privileges to trusted users
- **Deactivate:** Disable suspicious accounts
- **Statistics:** See admin count, active/inactive breakdown

---

## 🔥 Common Tasks

### Add a New Product

1. **Go to:** Admin → Products tab
2. **Click:** "+ Add Product" button
3. **Fill Form:**
   - Product Name (required)
   - Category (required)
   - Price in GHS (required)
   - Discount % (optional)
   - Stock Quantity
   - Short Description
4. **Upload Image:** Click file input, select image (5MB max)
5. **Check Features:** Mark as Featured/Trending/Flash Sale if needed
6. **Click:** "Create" button
7. **Confirm:** Success message appears

### Update Order Status

1. **Go to:** Admin → Orders tab
2. **Find Order:** Use search or browse list
3. **Click:** "View" button
4. **Select Status:** Click new status button
   - Pending (initial)
   - Processing (preparing)
   - Shipped (in transit)
   - Delivered (completed)
   - Cancelled (if needed)
5. **Confirm:** Status updates instantly

### Make Someone an Admin

1. **Go to:** Admin → Users tab
2. **Find User:** Search or scroll to find
3. **Click Status Toggle:** Click "User" button to make "Admin"
4. **Confirm:** Click to confirm
5. **Done:** User now has admin access

### Import Products from 1688

1. **Go to:** Admin → Product Import tab
2. **Enter 1688 URL:** Paste product link
3. **Set Margin:** Choose profit margin (%)
4. **Preview:** See extracted details
5. **Import:** Click Import button
6. **Done:** Product appears in catalog

---

## 🔒 Security Notes

- ✅ Admin access requires valid login
- ✅ Only users with `is_admin = true` can access
- ✅ API calls protected with JWT token
- ✅ All passwords hashed with bcrypt
- ✅ File uploads validated (type & size)

**Best Practices:**
- Keep admin account credentials secure
- Only promote trusted users to admin
- Monitor admin login activity
- Change default passwords immediately
- Use strong passwords (12+ characters with mix of cases, numbers, symbols)

---

## 📱 Mobile Access

Admin dashboard is **fully responsive**:
- Sidebar collapses on mobile
- Touch-friendly buttons
- Works on tablets & phones
- All features available on mobile

**Access on Phone:** Same URL `http://localhost:3000/admin`

---

## ⚙️ API Endpoints (For Developers)

All endpoints require JWT token:
```
Authorization: Bearer <access_token>
```

**Dashboard:** `GET /api/admin/dashboard`

**Products:**
- `GET /api/admin/products` - List
- `POST /api/admin/products` - Create
- `PUT /api/admin/products/<id>` - Update
- `DELETE /api/admin/products/<id>` - Delete
- `POST /api/admin/upload-image` - Upload

**Orders:**
- `GET /api/admin/orders` - List
- `GET /api/admin/orders/<id>` - Get details
- `PUT /api/admin/orders/<id>/status` - Update status

**Users:**
- `GET /api/admin/users` - List
- `PUT /api/admin/users/<id>/toggle-admin` - Change role
- `PUT /api/admin/users/<id>/toggle-active` - Enable/disable

---

## 🐛 Troubleshooting

### "Admin access required" Error
**Problem:** Cannot access admin dashboard  
**Solution:** 
1. Make sure you're logged in with admin account
2. Check database: `SELECT is_admin FROM users WHERE email='...';`
3. If false, run: `UPDATE users SET is_admin = TRUE WHERE email='...';`
4. Logout and login again
5. Clear browser cache

### Image Upload Fails
**Problem:** Can't upload product image  
**Solution:**
1. Check file format (PNG, JPG, JPEG, GIF, WebP only)
2. Verify file size under 5MB
3. Check internet connection
4. Try different browser
5. Check `uploads/products/` folder exists

### Products Not Showing
**Problem:** Created products don't appear in list  
**Solution:**
1. Refresh page
2. Check pagination (might be on next page)
3. Clear search filter
4. Verify product creation was successful (check success message)

### Can't Update Order Status
**Problem:** No status buttons appear or status won't change  
**Solution:**
1. Refresh the page
2. Reload order details
3. Check JWT token isn't expired (logout/login)
4. Verify order exists

---

## 📚 Full Documentation

- **[Admin Dashboard Guide](./ADMIN_GUIDE.md)** - Complete feature guide
- **[Admin API Reference](./ADMIN_API_REFERENCE.md)** - Technical API docs
- **[Setup Guide](./SETUP.md)** - Installation & deployment
- **[Implementation Summary](./ADMIN_IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[1688 Import Guide](./1688_IMPORT_GUIDE.md)** - Dropshipping setup

---

## 💡 Tips & Best Practices

### Product Management
- ✅ Always upload product images for better visibility
- ✅ Use clear, descriptive product names
- ✅ Keep stock quantities accurate
- ✅ Update prices regularly based on market
- ✅ Use discount for promotions, not regular pricing

### Order Management
- ✅ Process orders within 24 hours
- ✅ Update status regularly so customers know
- ✅ Check customer notes for special requests
- ✅ Review pending orders during business hours
- ✅ Reply to customer inquiries promptly

### User Management
- ✅ Only promote trusted users to admin
- ✅ Review admin list regularly
- ✅ Deactivate accounts for suspicious activity
- ✅ Keep admin count minimal for security
- ✅ Monitor who has admin access

### General
- ✅ Backup database regularly
- ✅ Monitor sales and trends
- ✅ Keep product catalog fresh
- ✅ Respond to customer inquiries
- ✅ Update inventory regularly

---

## 🎯 Next Steps

1. ✅ Create admin account (Step 1 above)
2. ✅ Login and explore dashboard
3. ✅ Add test products
4. ✅ Upload product images
5. ✅ View orders and update status
6. ✅ Manage user accounts
7. ✅ Check 1688 import system
8. ✅ Review analytics

---

## 📞 Support

**Issues?**
1. Check [Troubleshooting](#-troubleshooting) section above
2. Review [Admin Dashboard Guide](./ADMIN_GUIDE.md)
3. Check [API Reference](./ADMIN_API_REFERENCE.md)
4. Check browser console for errors (F12)
5. Check server logs in terminal

---

**Status:** ✅ Ready to Use  
**Version:** 1.0  
**Last Updated:** January 2024
