@echo off
REM BlessedNet - Quick Start Script for Windows
REM This script automates the initial setup for both backend and frontend

setlocal enabledelayedexpansion

echo.
echo ========================================
echo BlessedNet Full-Stack - Quick Start
echo ========================================
echo.

REM Check if running from correct directory
if not exist "BACKEND" (
    echo ❌ Error: BACKEND folder not found
    echo Please run this script from the BestNET root directory
    pause
    exit /b 1
)

if not exist "FRONTEND" (
    echo ❌ Error: FRONTEND folder not found
    echo Please run this script from the BestNET root directory
    pause
    exit /b 1
)

REM Menu
echo.
echo What would you like to setup?
echo.
echo 1. Setup Backend Only
echo 2. Setup Frontend Only
echo 3. Setup Both (Recommended)
echo 4. Run Backend
echo 5. Run Frontend
echo 6. Setup Both + Run Both (Full Setup)
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto setup_backend
if "%choice%"=="2" goto setup_frontend
if "%choice%"=="3" goto setup_both
if "%choice%"=="4" goto run_backend
if "%choice%"=="5" goto run_frontend
if "%choice%"=="6" goto full_setup
if "%choice%"=="7" goto exit_script
echo ❌ Invalid choice
goto menu

:setup_backend
echo.
echo Setting up Backend...
echo.
cd BACKEND

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ from python.org
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
) else (
    echo Virtual environment already exists
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)

echo ✅ Virtual environment activated
echo.

echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Setup .env file
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo ⚠️  .env file created. Please edit it with your configuration:
    echo   - Change SECRET_KEY and JWT_SECRET_KEY
    echo   - Add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY
    echo   - Configure WHATSAPP_BUSINESS_PHONE if needed
    echo   - Ensure CORS_ORIGINS includes your frontend URL
    echo.
) else (
    echo .env file already exists
)

echo.
echo ✅ Backend setup complete!
echo.
cd ..

goto menu

:setup_frontend
echo.
echo Setting up Frontend...
echo.
cd FRONTEND

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found: 
node --version

echo ✅ npm found:
npm --version
echo.

echo Installing dependencies (this may take a few minutes)...
call npm install

if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed
echo.

REM Setup .env file
if not exist ".env" (
    echo Creating .env file...
    (
        echo REACT_APP_API_URL=http://localhost:5000/api
        echo REACT_APP_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
    ) > .env
    echo ✅ .env file created
    echo Please update it with your Paystack public key
) else (
    echo .env file already exists
)

echo.
echo ✅ Frontend setup complete!
echo.
cd ..

goto menu

:setup_both
call :setup_backend
call :setup_frontend
goto menu

:run_backend
echo.
echo Starting Backend Server...
echo.
cd BACKEND

REM Check if venv exists
if not exist "venv" (
    echo ❌ Virtual environment not found
    echo Please run option 1 or 3 first to setup backend
    pause
    cd ..
    goto menu
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting Flask server...
echo Backend will run on: http://localhost:5000
echo.
python app.py

cd ..
goto menu

:run_frontend
echo.
echo Starting Frontend Server...
echo.
cd FRONTEND

REM Check if node_modules exists
if not exist "node_modules" (
    echo ❌ Node modules not found
    echo Please run option 2 or 3 first to setup frontend
    pause
    cd ..
    goto menu
)

echo.
echo Starting React development server...
echo Frontend will run on: http://localhost:5500 or http://localhost:3000
echo.
call npm start

cd ..
goto menu

:full_setup
echo.
echo Running Full Setup (Backend + Frontend)...
echo.

call :setup_backend
if errorlevel 1 goto menu

call :setup_frontend
if errorlevel 1 goto menu

echo.
echo ========================================
echo ✅ Full Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update BACKEND\.env with your configuration
echo 2. Update FRONTEND\.env with your Paystack key
echo.
echo To run the application:
echo - Option 4: Run Backend Only
echo - Option 5: Run Frontend Only
echo - Or run both in separate terminal windows
echo.
echo Open two terminals and run:
echo   Terminal 1: Run Backend (select option 4)
echo   Terminal 2: Run Frontend (select option 5)
echo.
echo Then open http://localhost:3000 in your browser
echo.
goto menu

:exit_script
echo.
echo Goodbye!
echo.
exit /b 0

:menu
echo.
echo What would you like to do?
echo.
echo 1. Setup Backend Only
echo 2. Setup Frontend Only
echo 3. Setup Both (Recommended)
echo 4. Run Backend
echo 5. Run Frontend
echo 6. Setup Both + Run Both (Full Setup)
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto setup_backend
if "%choice%"=="2" goto setup_frontend
if "%choice%"=="3" goto setup_both
if "%choice%"=="4" goto run_backend
if "%choice%"=="5" goto run_frontend
if "%choice%"=="6" goto full_setup
if "%choice%"=="7" goto exit_script
echo ❌ Invalid choice
goto menu
