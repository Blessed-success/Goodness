"""
Ghana Locations Data
Complete list of all 16 regions and major cities in Ghana
Used for location-based access control system
"""

GHANA_REGIONS = {
    "Greater Accra": [
        "Accra",
        "Tema",
        "Kasoa",
        "Madina",
        "Dansoman",
        "Teshie",
        "Osu",
        "Labadi",
        "Achimota",
        "Legon"
    ],
    "Ashanti": [
        "Kumasi",
        "Obuasi",
        "Ejisu",
        "Bechem",
        "Mankranso",
        "Sekondi"
    ],
    "Central": [
        "Cape Coast",
        "Winneba",
        "Takoradi",
        "Kasoa",
        "Elmina",
        "Moree"
    ],
    "Northern": [
        "Tamale",
        "Yendi",
        "Savelugu",
        "Bawku",
        "Gushegu",
        "Nalerigu"
    ],
    "Upper East": [
        "Bolgatanga",
        "Navrongo",
        "Zuarungu",
        "Bawku",
        "Zebilla"
    ],
    "Upper West": [
        "Wa",
        "Lawra",
        "Nadowli",
        "Tumu",
        "Jirapa"
    ],
    "Volta": [
        "Ho",
        "Koforidua",
        "Asikuma",
        "Keta",
        "Denu",
        "Ave"
    ],
    "Eastern": [
        "Koforidua",
        "Akim Oda",
        "Juaso",
        "Nkawkaw",
        "Akyem",
        "Abomoso"
    ],
    "Wese": [
        "Senya Beraku",
        "Sekondi",
        "Takoradi",
        "Nzema"
    ],
    "Bono": [
        "Sunyani",
        "Techiman",
        "Bamako",
        "Adum",
        "Wenchi"
    ],
    "Bono East": [
        "New Tafo",
        "Nkoranza",
        "Atebubu"
    ],
    "Ahafo": [
        "Goaso",
        "Asafo",
        "Kenyasi",
        "Asokwa"
    ],
    "Savannah": [
        "Damongo",
        "Salaga",
        "Buipe",
        "Karaga"
    ],
    "North East": [
        "Walewale",
        "Gushegu",
        "Karaga"
    ],
    "Oti": [
        "Dambai",
        "Nkwanta North",
        "Nkwanta South"
    ],
    "Western": [
        "Sekondi",
        "Takoradi",
        "Tarkwa",
        "Axim",
        "Half Assini",
        "Enchi"
    ]
}


def get_all_regions():
    """Get list of all regions"""
    return list(GHANA_REGIONS.keys())


def get_cities_by_region(region_name):
    """Get cities for a specific region"""
    return GHANA_REGIONS.get(region_name, [])


def is_valid_region(region_name):
    """Check if region exists"""
    return region_name in GHANA_REGIONS


def is_valid_city_in_region(region_name, city_name):
    """Check if city exists in region"""
    cities = GHANA_REGIONS.get(region_name, [])
    return city_name in cities


def seed_ghana_locations(db):
    """
    Seed database with Ghana regions and cities
    Call this once during initial setup or in a management command
    
    Usage:
        from app import app, db
        from utils.ghana_locations import seed_ghana_locations
        
        with app.app_context():
            seed_ghana_locations(db)
    """
    from models import Region, City
    
    # Check if already seeded
    if Region.query.first() is not None:
        print("⚠️  Ghana locations already seeded. Skipping...")
        return
    
    print("🌍 Seeding Ghana regions and cities...")
    
    try:
        for region_name, cities in GHANA_REGIONS.items():
            # Create region
            region = Region(name=region_name, is_active=True)
            db.session.add(region)
            db.session.flush()  # Flush to get the region ID
            
            # Create cities for this region
            for city_name in cities:
                city = City(
                    name=city_name,
                    region_id=region.id,
                    is_active=True
                )
                db.session.add(city)
        
        db.session.commit()
        print(f"✅ Successfully seeded {len(GHANA_REGIONS)} regions and {sum(len(cities) for cities in GHANA_REGIONS.values())} cities")
    
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error seeding locations: {str(e)}")
        raise
