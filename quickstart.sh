#!/bin/bash

# BlessedNet - Quick Start Script for macOS/Linux
# This script automates the initial setup for both backend and frontend

set -e

clear

echo ""
echo "========================================"
echo "BlessedNet Full-Stack - Quick Start"
echo "========================================"
echo ""

# Check if running from correct directory
if [ ! -d "BACKEND" ] || [ ! -d "FRONTEND" ]; then
    echo "❌ Error: BACKEND or FRONTEND folder not found"
    echo "Please run this script from the BestNET root directory"
    exit 1
fi

show_menu() {
    echo ""
    echo "What would you like to setup?"
    echo ""
    echo "1. Setup Backend Only"
    echo "2. Setup Frontend Only"
    echo "3. Setup Both (Recommended)"
    echo "4. Run Backend"
    echo "5. Run Frontend"
    echo "6. Setup Both + Run Both (Full Setup)"
    echo "7. Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice
    
    case $choice in
        1) setup_backend ;;
        2) setup_frontend ;;
        3) setup_both ;;
        4) run_backend ;;
        5) run_frontend ;;
        6) full_setup ;;
        7) exit_script ;;
        *) echo "❌ Invalid choice"; show_menu ;;
    esac
}

setup_backend() {
    echo ""
    echo "Setting up Backend..."
    echo ""
    cd BACKEND

    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 is not installed"
        echo "Please install Python 3.7+ from python.org or using your package manager"
        echo "  macOS: brew install python3"
        echo "  Ubuntu/Debian: sudo apt-get install python3"
        read -p "Press Enter to continue..."
        cd ..
        return 1
    fi

    python_version=$(python3 --version)
    echo "✅ Python found: $python_version"
    echo ""

    # Create virtual environment
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    else
        echo "Virtual environment already exists"
    fi

    echo ""
    echo "Activating virtual environment..."
    source venv/bin/activate

    echo "✅ Virtual environment activated"
    echo ""

    echo "Installing dependencies..."
    pip install -r requirements.txt

    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        read -p "Press Enter to continue..."
        cd ..
        return 1
    fi

    echo "✅ Dependencies installed"
    echo ""

    # Setup .env file
    if [ ! -f ".env" ]; then
        echo "Creating .env file from template..."
        cp .env.example .env
        echo ""
        echo "⚠️  .env file created. Please edit it with your configuration:"
        echo "  - Change SECRET_KEY and JWT_SECRET_KEY"
        echo "  - Add PAYSTACK_PUBLIC_KEY and PAYSTACK_SECRET_KEY"
        echo "  - Configure WHATSAPP_BUSINESS_PHONE if needed"
        echo "  - Ensure CORS_ORIGINS includes your frontend URL"
        echo ""
    else
        echo ".env file already exists"
    fi

    echo ""
    echo "✅ Backend setup complete!"
    echo ""
    cd ..
    show_menu
}

setup_frontend() {
    echo ""
    echo "Setting up Frontend..."
    echo ""
    cd FRONTEND

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed"
        echo "Please install Node.js from nodejs.org or using your package manager"
        echo "  macOS: brew install node"
        echo "  Ubuntu/Debian: sudo apt-get install nodejs npm"
        read -p "Press Enter to continue..."
        cd ..
        return 1
    fi

    echo "✅ Node.js found:"
    node --version

    echo "✅ npm found:"
    npm --version
    echo ""

    echo "Installing dependencies (this may take a few minutes)..."
    npm install

    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        read -p "Press Enter to continue..."
        cd ..
        return 1
    fi

    echo "✅ Dependencies installed"
    echo ""

    # Setup .env file
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
EOF
        echo "✅ .env file created"
        echo "Please update it with your Paystack public key"
    else
        echo ".env file already exists"
    fi

    echo ""
    echo "✅ Frontend setup complete!"
    echo ""
    cd ..
    show_menu
}

setup_both() {
    setup_backend
    setup_frontend
    show_menu
}

run_backend() {
    echo ""
    echo "Starting Backend Server..."
    echo ""
    cd BACKEND

    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo "❌ Virtual environment not found"
        echo "Please run option 1 or 3 first to setup backend"
        read -p "Press Enter to continue..."
        cd ..
        show_menu
        return 1
    fi

    echo "Activating virtual environment..."
    source venv/bin/activate

    echo ""
    echo "Starting Flask server..."
    echo "Backend will run on: http://localhost:5000"
    echo ""
    python app.py

    cd ..
    show_menu
}

run_frontend() {
    echo ""
    echo "Starting Frontend Server..."
    echo ""
    cd FRONTEND

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "❌ Node modules not found"
        echo "Please run option 2 or 3 first to setup frontend"
        read -p "Press Enter to continue..."
        cd ..
        show_menu
        return 1
    fi

    echo ""
    echo "Starting React development server..."
    echo "Frontend will run on: http://localhost:3000"
    echo ""
    npm start

    cd ..
    show_menu
}

full_setup() {
    echo ""
    echo "Running Full Setup (Backend + Frontend)..."
    echo ""

    setup_backend
    setup_frontend

    echo ""
    echo "========================================"
    echo "✅ Full Setup Complete!"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "1. Update BACKEND/.env with your configuration"
    echo "2. Update FRONTEND/.env with your Paystack key"
    echo ""
    echo "To run the application:"
    echo "- Option 4: Run Backend Only"
    echo "- Option 5: Run Frontend Only"
    echo "- Or run both in separate terminal windows"
    echo ""
    echo "Open two terminals and run:"
    echo "  Terminal 1: Run Backend (select option 4)"
    echo "  Terminal 2: Run Frontend (select option 5)"
    echo ""
    echo "Then open http://localhost:3000 in your browser"
    echo ""
    show_menu
}

exit_script() {
    echo ""
    echo "Goodbye!"
    echo ""
    exit 0
}

# Start the script
show_menu
