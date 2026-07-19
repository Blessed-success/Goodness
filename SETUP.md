# BlessedNet Wholesale Hub - Complete Setup & Deployment Guide

A full-stack eCommerce platform with React frontend, Flask backend, PostgreSQL database, and Paystack payment integration.

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Project Structure](#project-structure)
3. [Database Setup](#database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Integration Configuration](#integration-configuration)
7. [Running the Application](#running-the-application)
8. [Troubleshooting](#troubleshooting)
9. [Deployment](#deployment)

---

## 🖥️ System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Python**: 3.8 or higher
- **Node.js**: 14.0.0 or higher (includes npm)
- **PostgreSQL**: 12.0 or higher
- **RAM**: 4GB minimum
- **Disk Space**: 2GB minimum

### Software Installation

#### Windows
1. **Python**: Download from [python.org](https://python.org)
   - ✅ Check "Add Python to PATH" during installation
2. **Node.js**: Download from [nodejs.org](https://nodejs.org)
3. **PostgreSQL**: Download from [postgresql.org](https://postgresql.org)
   - Set default port to 5432
   - Remember your admin password

#### macOS
```bash
# Using Homebrew
brew install python3 nodejs postgresql
brew services start postgresql
```

#### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
sudo apt install nodejs npm
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

---

## 📁 Project Structure

```
BlessedNet/
├── BACKEND/                 # Flask backend
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models (User, Product, Order, etc.)
│   ├── requirements.txt     # Python dependencies
│   ├── .env                # Environment variables (CONFIGURE THIS)
│   ├── .env.example        # Template for .env file
│   └── routes/             # API endpoints
│       ├── auth.py         # Authentication routes
│       ├── products.py     # Product management routes
│       ├── cart.py         # Shopping cart routes
│       ├── orders.py       # Order management routes
│       └── payment.py      # Payment & WhatsApp integration routes
│
├── FRONTEND/               # React frontend
│   ├── package.json        # Node dependencies
│   ├── public/
│   │   └── index.html
│   ├── .env                # Environment variables
│   ├── .env.example        # Template for .env file
│   └── src/
│       ├── App.js          # Main App component
│       ├── api.js          # API client configuration
│       ├── context/        # Global state management
│       ├── components/     # Reusable components
│       └── pages/          # Page components
│
├── README.md               # Project overview
├── SETUP.md               # This file - Complete setup guide
└── .gitignore            # Git ignore file
```

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

#### Using PostgreSQL Command Line (pgAdmin or psql)

```bash
# Connect to PostgreSQL as administrator
psql -U postgres

# Create database
CREATE DATABASE blessednet;

# Create user
CREATE USER blessednet_user WITH PASSWORD 'strong_password_here';

# Grant privileges
ALTER ROLE blessednet_user SET client_encoding TO 'utf8';
ALTER ROLE blessednet_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE blessednet_user SET default_transaction_deferrable TO on;
ALTER ROLE blessednet_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE blessednet TO blessednet_user;

# Exit
\q
```

### Step 2: Verify Database Connection

```bash
# Test connection
psql -U blessednet_user -d blessednet -h localhost
```

⚠️ **Save your credentials securely** - you'll need them in the `.env` file.

---

## ⚙️ Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd BlessedNet/BACKEND
```

### Step 2: Create Virtual Environment

#### Windows
```bash
python -m venv venv
venv\Scripts\activate
```

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask - Web framework
- SQLAlchemy - ORM
- Flask-CORS - Cross-origin support
- Flask-JWT-Extended - JWT authentication
- psycopg2 - PostgreSQL adapter
- bcrypt - Password hashing
- python-dotenv - Environment variables
- requests - HTTP client for Paystack/WhatsApp

### Step 4: Configure Environment Variables

#### Copy the template file:
```bash
cp .env.example .env
```

#### Edit `.env` file with your credentials:

```
# DATABASE
DATABASE_URL=postgresql://blessednet_user:strong_password_here@localhost:5432/blessednet

# JWT (Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET_KEY=your-generated-secret-key-here

# CORS (for frontend)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# PAYSTACK (Get from https://dashboard.paystack.com/settings/api-keys)
# TEST/DEVELOPMENT KEYS:
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_key_here
PAYSTACK_SECRET_KEY=sk_test_your_actual_key_here

# WHATSAPP (Your business phone number with country code, no +)
# Example for Ghana: 233123456789
WHATSAPP_BUSINESS_PHONE=233123456789

# APPLICATION
FLASK_DEBUG=True
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Step 5: Initialize Database

```bash
# The database tables will be created automatically when you run the app
# This is handled by the Flask initialization code
```

### Step 6: Verify Backend Setup

```bash
# Run the Flask development server
python app.py
```

Expected output:
```
✅ Database tables created successfully
 * Running on http://0.0.0.0:5000/ (Press CTRL+C to quit)
```

The backend is running if you see no errors! 🎉

---

## ⚛️ Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
# From BlessedNet directory
cd FRONTEND
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- React 18 - UI framework
- React Router - Navigation
- Axios - HTTP client
- Tailwind CSS - Styling
- React Icons - Icon library
- SweetAlert2 - Notifications

### Step 3: Configure Environment Variables

#### Copy template (if needed):
```bash
cp .env.example .env.local
```

#### Verify `.env.local` contains:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=BlessedNet Wholesale Hub
REACT_APP_ENV=development
```

### Step 4: Verify Frontend Setup

```bash
# Run the React development server
npm start
```

Expected output:
```
Compiled successfully!

You can now view blessednet-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://YOUR_IP:3000
```

Click the localhost link to view the application! 🌐

---

## 🔐 Integration Configuration

### Paystack Payment Integration

#### 1. Create Paystack Account
- Go to [paystack.com](https://paystack.com)
- Sign up and verify your email
- Complete your business verification

#### 2. Get API Keys
- Navigate to **Settings** → **API Keys & Webhooks**
- Copy your **Test Keys** (for development)
- Add to `.env` file:
  ```
  PAYSTACK_PUBLIC_KEY=pk_test_xxx...
  PAYSTACK_SECRET_KEY=sk_test_xxx...
  ```

#### 3. Configure Webhook (Production Only)
- In Paystack Dashboard → Settings → API Keys & Webhooks
- Add webhook URL: `https://your-domain.com/api/payment/webhook`
- Select events: `charge.success`, `charge.failed`

### WhatsApp Integration

#### Option A: Direct WhatsApp Link (No Third-Party Service)
The application is pre-configured for this. Just update the business phone:

```bash
# In .env file
WHATSAPP_BUSINESS_PHONE=233123456789  # Ghana example
```

Format: Country code + phone number (WITHOUT + or spaces)
- Ghana: 233xxxxxxxxx
- Nigeria: 234xxxxxxxxxx
- USA: 1xxxxxxxxxx

#### Option B: WhatsApp Business API (Advanced)
For production with official WhatsApp Business Account:

1. Apply for [WhatsApp Business API](https://www.whatsapp.com/business/api)
2. Get your API key and phone number
3. Update `.env`:
   ```
   WHATSAPP_API_KEY=your_api_key_here
   WHATSAPP_BUSINESS_PHONE=your_whatsapp_number
   ```

---

## 🚀 Running the Application

### Option 1: Development Mode (Local Testing)

#### Terminal 1 - Backend
```bash
cd BlessedNet/BACKEND

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run Flask server
python app.py
```

#### Terminal 2 - Frontend
```bash
cd BlessedNet/FRONTEND
npm start
```

#### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/

### Option 2: Production Mode

See [Deployment](#deployment) section below.

---

## 🧪 Testing the Application

### 1. Create Admin User (Database)

```bash
# Connect to PostgreSQL
psql -U blessednet_user -d blessednet -h localhost

# Insert test admin user
INSERT INTO users (username, email, password_hash, full_name, is_admin, is_active)
VALUES ('admin', 'admin@blessednet.com', 'bcrypt_hash_here', 'Admin User', true, true);

# Exit
\q
```

### 2. Test API Endpoints

#### Using Postman or cURL

```bash
# Test health endpoint
curl http://localhost:5000/health

# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "full_name": "Test User"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'

# Get products
curl http://localhost:5000/api/products

# Add to cart (requires JWT token)
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

### 3. Test Frontend Features

- **Homepage**: View featured, trending, and flash sale products
- **Authentication**: Register and login
- **Search**: Use text, image, or voice search
- **Add to Cart**: Add products to shopping cart
- **WhatsApp Orders**: Click WhatsApp button to send quote request
- **Checkout**: Complete order with Paystack payment

---

## 🔧 Troubleshooting

### Backend Issues

#### Problem: `ModuleNotFoundError: No module named 'flask'`
```bash
# Solution: Activate virtual environment and reinstall
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### Problem: `PostgreSQL connection refused`
```bash
# Check if PostgreSQL is running
psql -U postgres  # Should connect

# Start PostgreSQL service
# Windows: Services → PostgreSQL → Start
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
```

#### Problem: `Database does not exist`
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE blessednet;"
psql -U postgres -c "CREATE USER blessednet_user WITH PASSWORD 'password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE blessednet TO blessednet_user;"
```

#### Problem: `JWT_SECRET_KEY not found`
```bash
# Generate a secure key
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env file
JWT_SECRET_KEY=your_generated_key_here
```

### Frontend Issues

#### Problem: `npm ERR! code ENOENT`
```bash
# Delete node_modules and package-lock.json, then reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Problem: API connection refused
```bash
# Check backend is running on http://localhost:5000
# Verify REACT_APP_API_URL in .env.local is correct
REACT_APP_API_URL=http://localhost:5000/api
```

#### Problem: Blank page or 404 errors
```bash
# Clear browser cache
# Chrome: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete
# Then hard reload: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Payment Issues

#### Problem: Paystack payment fails
1. Verify API keys are correct in `.env`
2. Use Test keys for development (pk_test_*, sk_test_*)
3. Check Paystack dashboard for transaction logs
4. Ensure amount is in correct format (GHS currency)

#### Problem: WhatsApp link not working
1. Verify `WHATSAPP_BUSINESS_PHONE` format in `.env`
2. Must be country code + number WITHOUT + or spaces
3. Test: https://api.whatsapp.com/send?phone=233123456789&text=Hello

---

## 📦 Deployment

### Prerequisites
- Server with Python 3.8+, Node.js, and PostgreSQL
- Domain name
- SSL certificate
- Gunicorn (production WSGI server)
- Nginx (reverse proxy)

### Step 1: Prepare Backend for Production

#### Install Production Dependencies
```bash
cd BACKEND
pip install gunicorn
```

#### Update `.env` for Production
```
DATABASE_URL=postgresql://user:password@DB_HOST:5432/blessednet
JWT_SECRET_KEY=your-random-secret-key
FLASK_DEBUG=False
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com
PAYSTACK_PUBLIC_KEY=pk_live_your_live_key
PAYSTACK_SECRET_KEY=sk_live_your_live_key
```

#### Run with Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Step 2: Prepare Frontend for Production

#### Build React Application
```bash
cd FRONTEND
npm run build
```

This creates an optimized `build/` folder ready for deployment.

#### Update `.env` for Production
```
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_ENV=production
```

### Step 3: Configure Nginx

Example Nginx configuration:

```nginx
# Backend API
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/key.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}

# Frontend
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/key.key;
    
    root /path/to/FRONTEND/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass https://api.your-domain.com;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### Step 4: Using Docker (Optional)

Create `Dockerfile` for backend:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
docker build -t blessednet-backend .
docker run -p 5000:5000 --env-file .env blessednet-backend
```

### Step 5: Set Up SSL Certificate

Using Let's Encrypt (Free):

```bash
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📊 Database Backup

### Backup PostgreSQL Database

```bash
# Backup to file
pg_dump -U blessednet_user -h localhost blessednet > backup.sql

# Restore from backup
psql -U blessednet_user -h localhost blessednet < backup.sql

# Backup with time stamp
pg_dump -U blessednet_user -h localhost blessednet > blessednet_$(date +%Y%m%d_%H%M%S).sql
```

---

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong `JWT_SECRET_KEY`
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your domain
- [ ] Keep dependencies updated: `pip list --outdated`, `npm outdated`
- [ ] Use environment variables for all secrets
- [ ] Enable database backups
- [ ] Monitor error logs
- [ ] Implement rate limiting
- [ ] Regular security audits

---

## 📞 Support & Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy Documentation](https://www.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Paystack Documentation](https://paystack.com/docs/)

### Common Tasks

#### Add New Product via Admin
1. Login as admin
2. Navigate to Admin Dashboard
3. Click "Add Product"
4. Fill in product details
5. Upload image
6. Set price and discount
7. Click Save

#### View Orders as Admin
1. Login as admin user
2. Go to Admin Dashboard
3. Click "Orders"
4. Filter by status (pending, processing, delivered)
5. Update order status as needed

#### Reset User Password
```bash
# Connect to database
psql -U blessednet_user -d blessednet

# Update password with new hash
UPDATE users SET password_hash = 'new_hash_here' WHERE email = 'user@example.com';
```

---

## 📝 License

This project is provided as-is for commercial and personal use.

---

## 🎯 Next Steps

1. ✅ Complete initial setup following this guide
2. ✅ Configure Paystack for payment testing
3. ✅ Test all features locally
4. ✅ Set up WhatsApp Business Account
5. ✅ Deploy to production server
6. ✅ Monitor and maintain application
7. ✅ Gather user feedback
8. ✅ Implement additional features

---

**Last Updated**: April 2026
**Version**: 1.0.0
**Status**: Production-Ready
