# BlessedNet Full Stack - Setup & Deployment Guide

## 📋 Overview

This document outlines the complete setup, configuration, and deployment instructions for the BlessedNet Wholesale Hub full-stack application. The system is designed for Ghana-based e-commerce with location-based access, admin control, and Paystack payment integration.

## 🎯 What's Completed

### Backend Enhancements
✅ **Admin Seeding**: Default admin user auto-created on startup
✅ **Region & City Data**: 13 Ghana regions with delivery fees auto-seeded
✅ **Delivery Fee System**: Region-based delivery fee calculation in orders
✅ **Secure Configuration**: `.env` template with production-ready settings
✅ **CORS Support**: Frontend port 5500 added to allowed origins
✅ **Location Validation**: User location access check on checkout
✅ **Category Endpoint**: `/api/products/categories` for frontend filters
✅ **Order System**: Full order creation, validation, and tracking

### Frontend Enhancements
✅ **Dynamic Backend Detection**: Frontend auto-detects backend on port 5000
✅ **API Base URL Configuration**: All routes use `${window.location.hostname}:5000/api`
✅ **Admin Location Management**: Full UI for region/city status control
✅ **Checkout Validation**: All fields required before order submission
✅ **Location Selector**: Dynamic region/city selection with delivery fee display
✅ **Cart & Order Pages**: Complete purchase and order tracking flow

## 🚀 Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd BACKEND

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env and fill in your actual values

# Start the backend server
python app.py
```

The backend will:
- Create all database tables
- Auto-create default admin: `admin@besthub.com` / `Admin@123`
- Seed 13 Ghana regions with cities and delivery fees
- Start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd FRONTEND

# Install dependencies
npm install

# Create .env file for frontend configuration
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
EOF

# Start the development server
npm start
```

Frontend will automatically:
- Detect backend on `localhost:5000`
- Run on port 5500 (configurable)
- Connect to all API endpoints

## 🔐 Security Configuration

### Environment Variables (.env)

**CRITICAL**: Never commit `.env` to version control. Use `.env.example` as template.

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blessednet

# Security Keys (Generate new values)
SECRET_KEY=your-super-secret-secret-key-change-this-immediately
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-immediately

# Admin Credentials (Change immediately in production)
DEFAULT_ADMIN_EMAIL=admin@besthub.com
DEFAULT_ADMIN_PASSWORD=Admin@123

# CORS Origins (Add production URL)
CORS_ORIGINS=http://localhost:3000,http://localhost:5500,https://yourdomain.com

# Payment (Paystack)
PAYSTACK_PUBLIC_KEY=your_public_key
PAYSTACK_SECRET_KEY=your_secret_key

# WhatsApp Integration
WHATSAPP_BUSINESS_PHONE=233123456789
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_API_TOKEN=your_api_token
```

### Admin Login
- **Email**: `admin@besthub.com`
- **Password**: `Admin@123`
- ⚠️ **IMPORTANT**: Change default password immediately after first login

### JWT Tokens
- Valid for 30 days
- Stored in localStorage on frontend
- Automatically included in all API calls via Authorization header

## 📦 API Endpoints

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - User login
POST   /api/auth/change-password   - Change password
```

### Products
```
GET    /api/products               - List all products
GET    /api/products/<id>          - Get product details
GET    /api/products/categories    - Get product categories
POST   /api/products               - Create product (admin)
PUT    /api/products/<id>          - Update product (admin)
DELETE /api/products/<id>          - Delete product (admin)
```

### Cart
```
POST   /api/cart/add               - Add item to cart
GET    /api/cart                   - Get user's cart
PUT    /api/cart/items/<item_id>   - Update cart item quantity
DELETE /api/cart/items/<item_id>   - Remove item from cart
DELETE /api/cart/clear             - Clear entire cart
```

### Orders
```
POST   /api/orders                 - Create order from cart
GET    /api/orders                 - Get user's orders
GET    /api/orders/<id>            - Get order details
PUT    /api/orders/<id>            - Update order status (admin)
```

### Location Management
```
GET    /api/location/regions       - Get active regions
GET    /api/location/regions/<id>/cities - Get cities in region
POST   /api/location/user/select   - Select user's location
GET    /api/location/user/check-access - Check if user can access service
GET    /api/location/admin/regions - Get all regions (admin)
PUT    /api/location/admin/regions/<id> - Toggle region status (admin)
PUT    /api/location/admin/cities/<id>  - Toggle city status (admin)
GET    /api/location/admin/stats   - Get location statistics (admin)
```

### Admin Dashboard
```
GET    /api/admin/users            - Get all users (admin)
GET    /api/admin/orders           - Get all orders (admin)
GET    /api/admin/products         - Get all products (admin)
GET    /api/admin/stats            - Get dashboard statistics (admin)
PUT    /api/admin/orders/<id>      - Update order status (admin)
```

### Payment
```
POST   /api/payment/verify         - Verify Paystack payment
GET    /api/payment/paystack-key   - Get Paystack public key
POST   /api/payment/whatsapp       - Create WhatsApp order
```

## 🌍 Ghana Regions & Delivery Fees

Auto-seeded on backend startup:

| Region | Delivery Fee (GHS) | Cities |
|--------|-------------------|--------|
| Greater Accra | 5.0 | Accra, Tema, Kasoa |
| Ashanti | 6.0 | Kumasi, Obuasi, Mampong |
| Central | 5.5 | Cape Coast, Sekondi, Winneba |
| Western | 7.0 | Takoradi, Shama, Nzema |
| East African | 8.0 | Koforidua, Akyem, Aburi |
| Volta | 7.5 | Ho, Keta, Hohoe |
| Northern | 10.0 | Tamale, Tema, Bolgatanga |
| Upper East | 9.0 | Bolgatanga, Navrongo, Bawku |
| Upper West | 9.5 | Wa, Lawra, Nandom |
| North East | 8.5 | Yendi, Nalerigu, Savelugu |
| Savannah | 12.0 | Damongo, Salaga, Buipe |
| Bono | 6.5 | Sunyani, Dormaa, Berekum |
| Bono East | 7.0 | Techiman, Nkoranza, Kintampo |

Admins can edit these fees and toggle region/city availability via the admin dashboard.

## 💳 Payment Integration

### Paystack Setup
1. Create account at https://paystack.com
2. Get API keys from dashboard
3. Add to `.env`:
   - `PAYSTACK_PUBLIC_KEY`
   - `PAYSTACK_SECRET_KEY`

### Payment Flow
1. User adds items to cart
2. User proceeds to checkout
3. User enters shipping details
4. Order created with pending status
5. Paystack popup opened for payment
6. Upon successful payment, order marked as paid
7. Success message and order tracking page shown

### WhatsApp Integration
1. Set up WhatsApp Business Account
2. Configure in `.env` with credentials
3. Users can choose WhatsApp as payment method
4. Order details sent via WhatsApp

## 👥 User Roles & Permissions

### Customer User
- Browse products
- Add to cart
- Select region/city for delivery
- Create and track orders
- Change password
- View order history

### Admin User
- All customer permissions
- Product management (CRUD)
- Order management and status updates
- Region/city availability control
- Edit delivery fees per region
- View all users and analytics
- Dashboard with statistics

## 🗄️ Database Models

### User
```python
- id: Primary Key
- email: Unique
- password: Hashed
- full_name: String
- phone: String
- address: String
- region_id: Foreign Key → Region
- city_id: Foreign Key → City
- is_admin: Boolean
- is_active: Boolean
- created_at: Timestamp
```

### Product
```python
- id: Primary Key
- name: String
- description: Text
- price: Decimal
- quantity_available: Integer
- category: String
- image_url: String
- created_by: Foreign Key → User (Admin)
- created_at: Timestamp
```

### Order
```python
- id: Primary Key
- user_id: Foreign Key → User
- order_number: Unique
- subtotal: Decimal
- shipping_cost: Decimal (from Region.delivery_fee)
- total_amount: Decimal
- status: Enum (pending, paid, processing, shipped, delivered, cancelled)
- payment_method: String (paystack, whatsapp, cash)
- shipping_address: String
- shipping_city: String
- shipping_phone: String
- notes: Text
- created_at: Timestamp
```

### Region
```python
- id: Primary Key
- name: String (Unique)
- delivery_fee: Decimal
- is_active: Boolean
- created_at: Timestamp
```

### City
```python
- id: Primary Key
- name: String
- region_id: Foreign Key → Region
- is_active: Boolean
- created_at: Timestamp
```

## 🔄 Customer Purchase Flow

1. **Browse Products** → Products page lists all active products
2. **Select & Add to Cart** → Add item with quantity to cart
3. **View Cart** → Review items and quantities
4. **Checkout** → 
   - Select region/city (if not already selected)
   - Enter shipping address, city, phone
   - Automatic delivery fee calculation from region
5. **Payment** →
   - Choose payment method (Paystack/WhatsApp)
   - For Paystack: Complete payment via popup
   - For WhatsApp: Get payment details via message
6. **Confirmation** →
   - Order created and marked as paid/pending
   - Success message with order number
   - Can view order details and track status

## 🛠️ Admin Dashboard Flow

1. **Login** → Use credentials above
2. **Dashboard** → View key statistics
3. **Products** →
   - View all products
   - Add, edit, delete products
4. **Orders** →
   - View all customer orders
   - Update order status (pending → processing → shipped → delivered)
   - See order details and customer info
5. **Users** →
   - View all registered users
   - See user locations and activity
6. **Locations** →
   - Toggle region/city availability
   - View active regions/cities stats
   - Edit delivery fees per region
7. **Analytics** →
   - Sales by region
   - Top products
   - User growth

## 🚀 Deployment

### Production Checklist

- [ ] Change `SECRET_KEY` and `JWT_SECRET_KEY` in `.env`
- [ ] Change default admin password
- [ ] Set `FLASK_DEBUG=False`
- [ ] Configure production database (PostgreSQL)
- [ ] Set actual Paystack keys
- [ ] Configure WhatsApp credentials
- [ ] Update `CORS_ORIGINS` with production domain
- [ ] Set up SSL/HTTPS
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging

### Deploying Backend

**Option 1: Railway (Recommended)**
```bash
# Install Railway CLI
# Connect to GitHub repo
# Set environment variables in dashboard
# Deploy
```

**Option 2: Heroku**
```bash
# heroku login
# heroku create your-app-name
# heroku config:set SECRET_KEY=...
# git push heroku main
```

**Option 3: VPS/Self-hosted**
```bash
# Install Python, PostgreSQL
# Clone repository
# Set up virtual environment
# Configure Gunicorn and Nginx
# Set up SSL with Let's Encrypt
# Use systemd for auto-restart
```

### Deploying Frontend

**Option 1: Vercel (Recommended)**
```bash
# Connect GitHub repo to Vercel
# Set environment variables
# Auto-deploy on push
```

**Option 2: Netlify**
```bash
# npm run build
# Drag & drop build folder to Netlify
# OR connect GitHub for auto-deployment
```

**Option 3: Static Hosting**
```bash
npm run build
# Upload build/ folder to any static hosting
```

## 🐛 Troubleshooting

### Frontend Can't Connect to Backend
- **Check**: Backend is running on port 5000
- **Check**: CORS origins in `.env` include port 5500
- **Check**: Browser console for network errors
- **Solution**: Restart both frontend and backend

### Admin Login Fails
- **Check**: Default admin user was created (check backend logs)
- **Check**: Credentials are correct: `admin@besthub.com` / `Admin@123`
- **Solution**: Database might not be initialized - clear DB and restart

### Payment Verification Fails
- **Check**: Paystack keys in `.env` are correct
- **Check**: Paystack account is in live mode, not test mode
- **Solution**: Verify with reference number on Paystack dashboard

### Region Not Showing in Checkout
- **Check**: Region is marked as `is_active=true`
- **Check**: At least one city in region is active
- **Solution**: Toggle region/city in admin location management

### Orders Not Being Created
- **Check**: User's region/city is active
- **Check**: Cart has items
- **Check**: All shipping fields are filled
- **Solution**: Check backend logs for validation errors

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Paystack Integration Guide](https://paystack.com/docs/integration/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [JWT Authentication](https://flask-jwt-extended.readthedocs.io/)

## 📝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Check backend logs: `BACKEND/` terminal output
3. Check browser console for frontend errors
4. Review API documentation above

---

**Last Updated**: 2024
**System Version**: 1.0.0
**Status**: Production Ready
