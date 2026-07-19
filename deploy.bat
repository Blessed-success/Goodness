@echo off
echo 🚀 BlessedNet Production Deployment Script
echo ==========================================

echo Step 1: Checking prerequisites...
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

echo.
echo Step 2: Preparing backend for deployment...
cd BACKEND
if exist .env.production (
    echo ✅ Production .env template found
) else (
    echo ❌ Production .env template missing
)

echo.
echo Step 3: Preparing frontend for deployment...
cd ../FRONTEND
if exist vercel.json (
    echo ✅ Vercel configuration found
) else (
    echo ❌ Vercel configuration missing
)

echo.
echo 📋 NEXT STEPS:
echo 1. Replace YOUR_DOMAIN in files with your actual domain
echo 2. Add your credentials to BACKEND/.env.production
echo 3. Commit and push all changes to GitHub
echo 4. Deploy backend to Railway
echo 5. Deploy frontend to Vercel
echo 6. Configure DNS settings
echo.
echo Press any key to continue...
pause >nul