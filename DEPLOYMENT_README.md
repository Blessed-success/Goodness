# BlessedNet Production Deployment

## 🚀 Quick Deploy

1. **Run the deployment script:**
   ```bash
   ./deploy.bat  # Windows
   # or
   chmod +x deploy.sh && ./deploy.sh  # Linux/Mac
   ```

2. **Add your credentials** (see section below)

3. **Deploy to hosting services**

---

## 📋 What Was Prepared

✅ **Backend (Flask)**
- Production-ready `app.py` with proper port configuration
- Updated `requirements.txt` with production dependencies
- Created `Procfile` for Railway deployment
- Created `runtime.txt` for Python version
- Created `.env.production` template

✅ **Frontend (React)**
- Updated `api.js` for production API URL
- Created `vercel.json` for Vercel deployment

✅ **Deployment Scripts**
- `deploy.bat` for Windows automation
- Ready for Railway + Vercel deployment

---

## 🔑 ADD YOUR CREDENTIALS HERE

### 1. Copy Production Environment File
```bash
cd BACKEND
copy .env.production .env
```

### 2. Edit `.env` and Replace These Values:

```env
# Generate random 64-character secrets
SECRET_KEY=your_super_secret_key_here_generate_random_64_chars
JWT_SECRET_KEY=your_jwt_secret_key_here_generate_random_64_chars

# Your domain (replace YOUR_DOMAIN)
CORS_ORIGINS=https://YOUR_DOMAIN,https://www.YOUR_DOMAIN

# Paystack credentials from https://dashboard.paystack.com/settings/developer
PAYSTACK_SECRET_KEY=sk_test_your_actual_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_actual_paystack_public_key

# Your WhatsApp Business number (without +)
WHATSAPP_BUSINESS_PHONE=233xxxxxxxxx

# Your admin credentials
DEFAULT_ADMIN_EMAIL=admin@YOUR_DOMAIN
DEFAULT_ADMIN_PASSWORD=YourSecurePassword123!
```

### 3. Update Frontend API URL
Edit `FRONTEND/src/api.js`:
```javascript
const API_BASE_URL = 'https://api.YOUR_DOMAIN/api';
```

Edit `FRONTEND/vercel.json`:
```json
{
  "env": {
    "REACT_APP_API_BASE_URL": "https://api.YOUR_DOMAIN/api"
  }
}
```

---

## 🌐 DEPLOYMENT STEPS

### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Deploy from `BACKEND` folder
4. Add environment variables from your `.env` file
5. Add PostgreSQL database
6. Set custom domain: `api.YOUR_DOMAIN`

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `FRONTEND`
4. Add environment variable: `REACT_APP_API_BASE_URL=https://api.YOUR_DOMAIN/api`
5. Set custom domain: `YOUR_DOMAIN`

### DNS Configuration
In your domain registrar (GoDaddy, Namecheap, etc.):

**For Frontend:**
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

**For Backend:**
```
Type: CNAME
Name: api
Value: [Railway CNAME value]
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Domain configured in DNS
- [ ] Backend deployed and accessible at `https://api.YOUR_DOMAIN/api/health`
- [ ] Frontend deployed and accessible at `https://YOUR_DOMAIN`
- [ ] Admin login works: `admin@YOUR_DOMAIN` / `YourSecurePassword123!`
- [ ] User registration and login functional
- [ ] Product browsing works
- [ ] Cart and checkout functional
- [ ] Payment processing with Paystack works
- [ ] Mobile responsive on all devices

---

## 🆘 TROUBLESHOOTING

**API calls failing?**
- Check browser console for CORS errors
- Verify API_BASE_URL in frontend
- Check Railway backend logs

**Domain not working?**
- Wait 30 minutes for DNS propagation
- Use `nslookup YOUR_DOMAIN` to verify
- Check DNS records are correct

**Payments not working?**
- Verify Paystack keys
- Check webhook URL in Paystack dashboard
- Test with Paystack test cards

---

## 🎯 FINAL RESULT

Your BlessedNet store will be live at: `https://YOUR_DOMAIN`

**Admin Panel:** `https://YOUR_DOMAIN/admin` (after login)

**API Documentation:** `https://api.YOUR_DOMAIN/api/`