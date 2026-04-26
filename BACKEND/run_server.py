#!/usr/bin/env python3
import sys
import os

# Add backend to path
sys.path.insert(0, r'C:\Users\HP\Desktop\BestNET\BACKEND')
os.chdir(r'C:\Users\HP\Desktop\BestNET\BACKEND')

try:
    print("Loading app...")
    from app import app, db
    
    print("Creating database tables...")
    with app.app_context():
        db.create_all()
        print("✅ Database initialized")
    
    print("✅ App loaded successfully!")
    print("Starting server on http://0.0.0.0:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
