"""
BlessedNet Wholesale Hub - Flask Backend
Full-stack eCommerce application with JWT authentication, Paystack integration, and PostgreSQL
FIXED: Corrected admin user creation, improved error handling, optimized token expiry
"""

import os
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from database import db
from sqlalchemy.exc import IntegrityError

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
database_url = os.getenv('DATABASE_URL', 'sqlite:///blessednet.db')
# Render (and most Postgres providers) hand out "postgres://" URLs, but SQLAlchemy 1.4+
# only recognizes the "postgresql://" scheme.
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'change-this-secret-key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-secret-key')
app.config['PAYSTACK_SECRET_KEY'] = os.getenv('PAYSTACK_SECRET_KEY')
app.config['PAYSTACK_PUBLIC_KEY'] = os.getenv('PAYSTACK_PUBLIC_KEY')
# FIXED: Reduced token expiry from 30 days to 24 hours for security
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JSON_SORT_KEYS'] = False

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
from utils.limiter import limiter, init_limiter
init_limiter(app)

# Enable CORS with specific origins
CORS(app, resources={
    r"/*": {
        "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5500').split(','),
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Import database models
from models import User, Product, Cart, Order, CartItem, OrderItem, Region, City

# Import and register blueprints (routes) - moved to bottom to avoid circular imports

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# Import and register blueprints (routes) - moved here to avoid circular imports
from routes.auth import auth_bp
from routes.products import products_bp
from routes.cart import cart_bp
from routes.orders import orders_bp
from routes.payment import payment_bp, verify_payment
import importlib
import_routes = importlib.import_module('routes.import')
from routes.bulk_import import bulk_import_bp
from routes.price_monitor import price_monitor_bp
from routes.admin import admin_bp
from routes.location import location_bp
from routes.whatsapp_bot import whatsapp_bp
from routes.competitor_tracker import competitor_bp
from utils.scheduler import SchedulerManager

# Add verify payment routes after imports
@app.route('/verify-payment', methods=['POST'])
def verify_payment_route():
    """Alias route for Paystack verification when frontend calls /verify-payment."""
    return verify_payment()

@app.route('/api/verify-payment', methods=['POST'])
def api_verify_payment_route():
    """Alias route for Paystack verification when frontend calls /api/verify-payment."""
    return verify_payment()

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'BlessedNet Wholesale Hub API is running'
    }), 200

# Welcome endpoint
@app.route('/', methods=['GET'])
def home():
    """Welcome endpoint"""
    return jsonify({
        'message': 'Welcome to BlessedNet Wholesale Hub API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth',
            'products': '/api/products',
            'cart': '/api/cart',
            'orders': '/api/orders',
            'payment': '/api/payment',
            'import': '/api/import'
        }
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

# Register all blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(products_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(import_routes.import_bp)
app.register_blueprint(bulk_import_bp)
app.register_blueprint(price_monitor_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(location_bp)
app.register_blueprint(whatsapp_bp)
app.register_blueprint(competitor_bp)

def init_database():
    """Create tables and seed default data. Runs on import so it executes
    both under `python app.py` (local dev) and under gunicorn (production)."""
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully")
        
        # Seed default admin user if not exists (FIXED: Proper admin creation)
        admin_email = os.getenv('DEFAULT_ADMIN_EMAIL', 'admin@besthub.com')
        admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'Admin@123')
        
        try:
            existing_admin = User.query.filter_by(email=admin_email).first()
            if not existing_admin:
                admin_user = User(
                    username='admin',  # FIXED: Added required username field
                    email=admin_email,
                    full_name='System Administrator',
                    is_admin=True,
                    is_active=True
                )
                admin_user.set_password(admin_password)  # FIXED: Use proper password setter
                db.session.add(admin_user)
                db.session.commit()
                print(f"✅ Default admin user created: {admin_email}")
            else:
                print(f"ℹ️  Admin user already exists: {admin_email}")
        except IntegrityError as e:  # FIXED: Handle duplicate entry error
            db.session.rollback()
            print(f"⚠️  Admin user creation failed (may already exist): {str(e)}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error creating admin user: {str(e)}")
        
        # Seed default Ghana regions and cities if not exists
        if Region.query.count() == 0:
            regions_data = [
                {
                    'name': 'Greater Accra',
                    'delivery_fee': 5.0,
                    'cities': ['Accra', 'Tema', 'Kasoa']
                },
                {
                    'name': 'Ashanti',
                    'delivery_fee': 6.0,
                    'cities': ['Kumasi', 'Obuasi', 'Mampong']
                },
                {
                    'name': 'Central',
                    'delivery_fee': 5.5,
                    'cities': ['Cape Coast', 'Sekondi', 'Winneba']
                },
                {
                    'name': 'Western',
                    'delivery_fee': 7.0,
                    'cities': ['Takoradi', 'Shama', 'Nzema']
                },
                {
                    'name': 'East African',
                    'delivery_fee': 8.0,
                    'cities': ['Koforidua', 'Akyem', 'Aburi']
                },
                {
                    'name': 'Volta',
                    'delivery_fee': 7.5,
                    'cities': ['Ho', 'Keta', 'Hohoe']
                },
                {
                    'name': 'Northern',
                    'delivery_fee': 10.0,
                    'cities': ['Tamale', 'Tema', 'Bolgatanga']
                },
                {
                    'name': 'Upper East',
                    'delivery_fee': 9.0,
                    'cities': ['Bolgatanga', 'Navrongo', 'Bawku']
                },
                {
                    'name': 'Upper West',
                    'delivery_fee': 9.5,
                    'cities': ['Wa', 'Lawra', 'Nandom']
                },
                {
                    'name': 'North East',
                    'delivery_fee': 8.5,
                    'cities': ['Yendi', 'Nalerigu', 'Savelugu']
                },
                {
                    'name': 'Savannah',
                    'delivery_fee': 12.0,
                    'cities': ['Damongo', 'Salaga', 'Buipe']
                },
                {
                    'name': 'Bono',
                    'delivery_fee': 6.5,
                    'cities': ['Sunyani', 'Dormaa', 'Berekum']
                },
                {
                    'name': 'Bono East',
                    'delivery_fee': 7.0,
                    'cities': ['Techiman', 'Nkoranza', 'Kintampo']
                }
            ]
            
            try:
                for region_data in regions_data:
                    region = Region(
                        name=region_data['name'],
                        delivery_fee=region_data['delivery_fee'],
                        is_active=True
                    )
                    db.session.add(region)
                    db.session.flush()  # Get region ID
                    
                    for city_name in region_data['cities']:
                        city = City(
                            name=city_name,
                            region_id=region.id,
                            is_active=True
                        )
                        db.session.add(city)
                
                db.session.commit()
                print(f"✅ Default Ghana regions and cities seeded ({len(regions_data)} regions)")
            except IntegrityError:
                db.session.rollback()
                print(f"ℹ️  Regions already exist ({Region.query.count()} regions)")
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error seeding regions: {str(e)}")
        else:
            print(f"ℹ️  Regions already exist ({Region.query.count()} regions)")
        
        # Initialize price monitor scheduler
        # if SchedulerManager.initialize(app):
        #     print("✅ Price monitor scheduler initialized")
        # else:
        #     print("⚠️  Price monitor scheduler initialization failed")
        print("⚠️  Price monitor scheduler disabled for debugging")


# Run once at import time so tables/seed data exist under gunicorn too, not just `python app.py`.
init_database()

if __name__ == '__main__':
    # Production-ready server configuration
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
