#!/usr/bin/env python3
print("Testing app import...")
try:
    import app
    print("✅ App imported successfully!")
except Exception as e:
    print(f"❌ Import error: {e}")
    import traceback
    traceback.print_exc()