# BlessedNet Wholesale Hub - Quick Start Guide

**⚡ Get the application running in 10 minutes!**

---

## Prerequisites
- ✅ Python 3.8+
- ✅ Node.js 14+
- ✅ PostgreSQL 12+

---

## 1️⃣ Database Setup (5 min)

```bash
# Open PostgreSQL terminal
psql -U postgres

# Run these commands:
CREATE DATABASE blessednet;
CREATE USER blessednet_user WITH PASSWORD 'strongpassword123';
GRANT ALL PRIVILEGES ON DATABASE blessednet TO blessednet_user;
\q
```

---

## 2️⃣ Backend Setup (3 min)

```bash
cd BACKEND

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Edit .env file with your database credentials
# DATABASE_URL=postgresql://blessednet_user:strongpassword123@localhost:5432/blessednet

# Run backend
python app.py
```

**✅ Backend running at**: `http://localhost:5000`

---

## 3️⃣ Frontend Setup (2 min)

```bash
# In another terminal
cd FRONTEND

npm install
npm start
```

**✅ Frontend running at**: `http://localhost:3000`

---

## 🎉 Done!

Your BlessedNet application is now running!

### Test Features:
1. **Register**: Create a new account
2. **Browse Products**: View products on homepage
3. **Search**: Use text, image, or voice search
4. **Add to Cart**: Click "Add to Cart" button
5. **WhatsApp Orders**: Click WhatsApp icon on products
6. **Checkout**: Complete order with test Paystack account

---

## 📝 Important Configuration

### Paystack Testing
Get free test keys from: https://paystack.com/docs/getting-started/

Update `.env`:
```
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
```

### WhatsApp Integration
Update `.env`:
```
WHATSAPP_BUSINESS_PHONE=233123456789
```

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Check virtualenv is active
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Check dependencies
pip install -r requirements.txt

# Check database connection
psql -U blessednet_user -d blessednet
```

### Frontend won't start?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't connect to backend?
- Check backend is running on port 5000
- Check `.env.local` has correct API URL
- Check CORS_ORIGINS in backend `.env`

---

## 📞 Full Guide

For complete setup with advanced configuration, see: [SETUP.md](./SETUP.md)

---

**Ready to deploy?** Check deployment section in [SETUP.md](./SETUP.md)
