"""
Category Routes for BlessedNet Wholesale Hub
Public endpoint for category listing with display images.
"""

from flask import Blueprint, jsonify, current_app
from models import db, Product, Category
from utils.security import safe_error_response

categories_bp = Blueprint('categories', __name__, url_prefix='/api/categories')


@categories_bp.route('', methods=['GET'])
def get_categories():
    """
    Get all categories with their display image.

    Merges categories that already exist on products (so filters/tiles never
    go empty) with admin-managed Category rows (which carry the image_url).
    """
    try:
        product_category_names = db.session.query(Product.category).distinct().all()
        product_category_names = {name[0] for name in product_category_names if name[0]}

        managed_categories = {c.name: c for c in Category.query.all()}

        all_names = sorted(product_category_names | set(managed_categories.keys()))
        data = [
            {
                'id': managed_categories[name].id if name in managed_categories else None,
                'name': name,
                'image_url': managed_categories[name].image_url if name in managed_categories else None
            }
            for name in all_names
        ]

        return jsonify({
            'message': 'Categories retrieved successfully',
            'data': data
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve categories')
