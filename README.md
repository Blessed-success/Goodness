# BlessedNet Wholesale Hub - Full Stack eCommerce Application

A complete, production-ready full-stack eCommerce platform built with **React**, **Flask**, **PostgreSQL**, and **Paystack** payment integration.

**🚀 Ready to Deploy | 🔐 Security-Focused | 📊 Scalable Architecture**

---

## 📚 Documentation

### Main Guides
- **👉 [Complete Setup & Deployment Guide →](./SETUP.md)** - START HERE!
- **👉 [Admin Dashboard Guide →](./ADMIN_GUIDE.md)** - Complete admin panel documentation
- **👉 [Admin API Reference →](./ADMIN_API_REFERENCE.md)** - Admin endpoint specifications

### SETUP.md includes:
- System requirements and installation
- Database configuration with PostgreSQL
- Backend setup with Flask
- Frontend setup with React
- Paystack payment integration
- WhatsApp integration
- Admin account creation
- Troubleshooting & Deployment

### Additional Documentation
- [1688 Import Guide](./1688_IMPORT_GUIDE.md) - Dropshipping product import
- [Import API Reference](./IMPORT_TECHNICAL_DOCS.md) - Technical import documentation
- [Main API Documentation](./API_DOCUMENTATION.md) - Complete API reference

---

## 🎯 Features

### Frontend (React)
- ✅ Responsive design with Tailwind CSS
- ✅ Product browsing and search with filters
- ✅ Image upload search functionality
- ✅ Voice/audio search capability
- ✅ Shopping cart management
- ✅ User authentication (JWT)
- ✅ Checkout process
- ✅ WhatsApp integration for direct orders
- ✅ Real-time cart updates
- ✅ Flash sale countdown timer
- ✅ Trending products section

### Backend (Flask)
- ✅ RESTful API with proper error handling
- ✅ JWT authentication and authorization
- ✅ SQLAlchemy ORM with PostgreSQL
- ✅ Password hashing with bcrypt
- ✅ Rate limiting and CORS protection
- ✅ Comprehensive input validation
- ✅ Paystack payment integration
- ✅ WhatsApp API integration
- ✅ Admin dashboard routes
- ✅ Order management system
- ✅ Product catalog with categories
- ✅ **Admin Dashboard** for full business management
- ✅ Admin product management (CRUD)
- ✅ Admin order management and tracking
- ✅ Admin user management
- ✅ Product image upload functionality
- ✅ 1688 product import system (dropshipping)
- ✅ Business analytics and reporting

### Database (PostgreSQL)
- ✅ Users table with authentication
- ✅ Products table with categories and discounts
- ✅ Cart and Cart Items tables
- ✅ Orders and Order Items tables
- ✅ Relationships and constraints

## 📋 Requirements

### System Requirements
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Git

### Software
- pip (Python package manager)
- npm (Node package manager)

## 🚀 Quick Start

### 1. Clone/Extract Project
```bash
cd BestNET
```

### 2. Backend Setup

#### 2a. Create Python Virtual Environment
```bash
cd BACKEND

# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2b. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2c. Configure Database

**Create PostgreSQL database:**
```sql
CREATE DATABASE blessednet;
CREATE USER blessednet_user WITH PASSWORD 'your_secure_password';
ALTER ROLE blessednet_user SET client_encoding TO 'utf8';
ALTER ROLE blessednet_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE blessednet_user SET default_transaction_deferrable TO on;
ALTER ROLE blessednet_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE blessednet TO blessednet_user;
```

#### 2d. Configure Environment Variables
Edit `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://blessednet_user:your_secure_password@localhost:5432/blessednet

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256

# Paystack Configuration (Get from https://paystack.com)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# WhatsApp Configuration
WHATSAPP_BUSINESS_PHONE_NUMBER=233xxxxxxxxx  # Ghana number format

# App Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-app-secret-key-change-this
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Admin Configuration
ADMIN_EMAIL=admin@blessednet.com
ADMIN_PASSWORD=change_this_password
```

#### 2e. Initialize Database
```bash
python app.py
```

This will create all tables automatically on first run.

#### 2f. Run Backend Server
```bash
python app.py
```

Server will start at `http://localhost:5000`

### 3. Frontend Setup

#### 3a. Install Dependencies
```bash
cd ../FRONTEND
npm install
```

#### 3b. Configure Environment Variables
Create/Edit `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### 3c. Run Frontend Development Server
```bash
npm start
```

App will open at `http://localhost:3000`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/<id>` - Get single product
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create product (admin)
- `PUT /api/products/<id>` - Update product (admin)
- `DELETE /api/products/<id>` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/item/<id>` - Update cart item
- `DELETE /api/cart/item/<id>` - Remove from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/<id>` - Get single order
- `POST /api/orders` - Create order
- `POST /api/orders/<id>/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (admin)
- `PUT /api/orders/admin/<id>/status` - Update order status (admin)

### Payment
- `POST /api/payment/initialize` - Initialize Paystack payment
- `POST /api/payment/verify` - Verify Paystack payment
- `POST /api/payment/webhook` - Paystack webhook handler
- `POST /api/payment/whatsapp-order` - Generate WhatsApp order link

### Admin (Protected Routes)
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/products` - List all products (admin)
- `POST /api/admin/products` - Create product (admin)
- `PUT /api/admin/products/<id>` - Update product (admin)
- `DELETE /api/admin/products/<id>` - Delete product (admin)
- `POST /api/admin/upload-image` - Upload product image (admin)
- `GET /api/admin/orders` - List all orders (admin)
- `GET /api/admin/orders/<id>` - Get order details (admin)
- `PUT /api/admin/orders/<id>/status` - Update order status (admin)
- `GET /api/admin/users` - List all users (admin)
- `PUT /api/admin/users/<id>/toggle-admin` - Toggle admin status (admin)
- `PUT /api/admin/users/<id>/toggle-active` - Toggle user active status (admin)

## 🔑 Configuration Guide

### Paystack Integration Setup

1. **Sign up for Paystack account:**
   - Go to https://paystack.com
   - Create account
   - Verify email and phone

2. **Get API Keys:**
   - Go to Settings → API Keys & Webhooks
   - Copy Secret Key and Public Key
   - Add to `.env` file

3. **Set Webhook URL (Optional):**
   - Settings → API Keys & Webhooks
   - Add webhook: `https://your-domain.com/api/payment/webhook`

### WhatsApp Integration Setup

1. **Get WhatsApp Business Phone Number:**
   - Format: Country Code + Phone Number ('0502683544')
   - Add to `.env` file as `WHATSAPP_BUSINESS_PHONE_NUMBER`

2. **Update in .env:**
   ```env
   WHATSAPP_BUSINESS_PHONE_NUMBER=233xxxxxxxxx
   ```

### Admin User Setup

#### Create Admin Account

**Option 1: Via Database**
1. Register normally through the app
2. Connect to database and run:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'your-admin-email@example.com';
```

**Option 2: Edit Auth Routes (Dev Only)**
1. Edit `BACKEND/routes/auth.py` 
2. Temporarily set `is_admin=True` during registration
3. Create account, then remove the change

#### Access Admin Dashboard

1. **Login** with admin account at `http://localhost:3000/login`
2. **Navigate** to `/admin` or click "Admin Dashboard" in user menu
3. **Features Available:**
   - View business dashboard with statistics
   - Manage products (add, edit, delete, upload images)
   - Manage orders (view details, update status)
   - Manage users (view, toggle admin/active status)
   - Monitor 1688 product imports
   - View analytics and revenue reports

#### Admin Dashboard URL
```
http://localhost:3000/admin
```

**For detailed admin documentation**, see [Admin Dashboard Guide](./ADMIN_GUIDE.md)

## 🧪 Testing

### Test Credentials

**Default Test User:**
- Email: test@example.com
- Password: password123

**Test Products:**
Use the admin dashboard to add test products with:
- Various categories
- Different discount percentages
- Stock quantities
- Product images

### Test Payment (Paystack Sandbox)

Use these test card numbers:
- **Visa:** 4084084084084081
- **Mastercard:** 5061201111111111
- **Verve:** 5066053709486189

**Expiry:** Any future date
**CVV:** Any 3 digits

## 📂 Project Structure

```
BestNET/
│
├── BACKEND/
│   ├── app.py                 # Flask app entry point
│   ├── models.py              # SQLAlchemy models
│   ├── requirements.txt        # Python dependencies
│   ├── .env                   # Environment variables
│   └── routes/
│       ├── auth.py            # Authentication routes
│       ├── products.py        # Product routes
│       ├── cart.py            # Cart routes
│       ├── orders.py          # Order routes
│       └── payment.py         # Payment routes
│
└── FRONTEND/
    ├── public/
    │   ├── index.html         # HTML entry point
    │   └── manifest.json      # PWA manifest
    ├── src/
    │   ├── index.js           # React entry point
    │   ├── App.js             # Main app component
    │   ├── App.css            # App styles
    │   ├── api.js             # API client
    │   ├── components/        # React components
    │   │   ├── Header.js      # Header component
    │   │   └── ProductCard.js # Product card
    │   ├── context/           # Context providers
    │   │   ├── AuthContext.js # Auth context
    │   │   └── CartContext.js # Cart context
    │   └── pages/             # Page components
    │       ├── HomePage.js
    │       ├── ProductsPage.js
    │       ├── CartPage.js
    │       ├── CheckoutPage.js
    │       ├── LoginPage.js
    │       └── RegisterPage.js
    ├── package.json           # NPM dependencies
    ├── .env                   # Environment variables
    └── .env.example           # Example env file
```

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt for password security
- ✅ **Input Validation** - Server-side validation
- ✅ **Input Sanitization** - XSS protection
- ✅ **CORS Protection** - Cross-origin restrictions
- ✅ **HTTPS Ready** - Production deployment ready
- ✅ **Environment Variables** - Sensitive data protection
- ✅ **Rate Limiting** - Optional rate limiting
- ✅ **Secure Headers** - Security headers included

## 🚀 Production Deployment

### Before Deploying

1. **Update environment variables:**
   ```env
   FLASK_ENV=production
   FLASK_DEBUG=False
   JWT_SECRET_KEY=<generate-strong-key>
   SECRET_KEY=<generate-strong-key>
   ```

2. **Database:**
   - Use managed PostgreSQL service
   - Enable SSL connections
   - Set strong passwords

3. **Payment:**
   - Switch from test to live Paystack keys
   - Update webhook URL

4. **Frontend Build:**
   ```bash
   npm run build
   ```

### Deployment Platforms

**Backend (Flask):**
- Heroku
- PythonAnywhere
- AWS EC2
- Railway
- Render

**Frontend (React):**
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Database:**
- AWS RDS
- Heroku PostgreSQL
- Railway
- Render

## 📚 API Documentation

### Request/Response Format

**Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "is_admin": false,
    "created_at": "2024-01-01T12:00:00"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Database connection errors:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists

**Migration errors:**
- Delete `blessednet` database
- Run `CREATE DATABASE blessednet;`
- Restart backend

### Frontend Issues

**API not connecting:**
- Check REACT_APP_API_URL in .env
- Ensure backend is running
- Check browser console for errors

**npm start fails:**
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review error messages carefully
3. Check environment variable configuration
4. Verify all dependencies are installed

## 📄 License

This project is provided as-is for educational and commercial use.

## ✨ Features Roadmap

- [ ] User reviews and ratings
- [ ] Wishlist functionality
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Inventory management
- [ ] Multi-vendor support
- [ ] Loyalty points system
- [ ] Mobile app (React Native)
- [ ] AI-powered recommendations

---

**Version:** 1.0.0
**Last Updated:** 2024
**Author:** BlessedNet Development Team

Happy selling! 🎉
