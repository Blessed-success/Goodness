"""
Setup Script for Location-Based Access Control System
Run this ONCE to seed the database with Ghana regions and cities

Usage:
    python setup_locations.py
    
Or from Python shell:
    python
    >>> from setup_locations import setup_database
    >>> setup_database()
"""

import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def setup_database():
    """Set up the database with all Ghana locations"""
    from app import app, db
    from utils.ghana_locations import seed_ghana_locations
    
    print("🚀 Starting Location-Based Access Control Setup...\n")
    
    with app.app_context():
        try:
            # Create all tables
            print("📋 Creating database tables...")
            db.create_all()
            print("✅ Database tables created/updated\n")
            
            # Seed Ghana locations
            print("🌍 Seeding Ghana locations...")
            seed_ghana_locations(db)
            print("✅ Ghana locations seeded successfully\n")
            
            # Print summary
            from models import Region, City
            
            region_count = Region.query.count()
            city_count = City.query.count()
            active_regions = Region.query.filter_by(is_active=True).count()
            active_cities = City.query.filter_by(is_active=True).count()
            
            print("=" * 50)
            print("📊 SETUP SUMMARY")
            print("=" * 50)
            print(f"✓ Total Regions: {region_count}")
            print(f"✓ Active Regions: {active_regions}")
            print(f"✓ Total Cities: {city_count}")
            print(f"✓ Active Cities: {active_cities}")
            print("=" * 50)
            print("\n✅ Setup completed successfully!")
            print("\n📸 Next Steps:")
            print("1. Start the application: python app.py")
            print("2. Go to Admin Dashboard")
            print("3. Navigate to 'Location-Based Access Control'")
            print("4. Configure which regions/cities are active")
            print("5. Users can now select their location\n")
            
            return True
            
        except Exception as e:
            print(f"\n❌ Error during setup: {str(e)}")
            print("\nPlease check your database connection and try again.")
            return False


if __name__ == '__main__':
    success = setup_database()
    sys.exit(0 if success else 1)
