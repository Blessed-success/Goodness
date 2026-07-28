"""
One-off backfill: compute dominant_color for existing products that were
created before image-search shipped (new/edited products get this
automatically going forward — see routes/products.py).

Run manually from BACKEND/:
    ./venv/Scripts/python.exe scripts/backfill_product_colors.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from database import db
from models import Product
from utils.image_analysis import compute_dominant_color_for_image_url


def main():
    with app.app_context():
        products = Product.query.filter(
            Product.dominant_color.is_(None),
            Product.image_url.isnot(None),
            Product.image_url != '',
        ).all()

        updated = 0
        skipped = 0
        for product in products:
            color = compute_dominant_color_for_image_url(product.image_url)
            if color:
                product.dominant_color = color
                updated += 1
            else:
                skipped += 1

        db.session.commit()
        print(f'Backfilled {updated} product(s), skipped {skipped} (non-local or unreadable image_url).')


if __name__ == '__main__':
    main()
