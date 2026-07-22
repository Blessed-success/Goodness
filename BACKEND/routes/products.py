"""
Product Routes for Nexus Wholesale Hub
Handles product catalog, search, filtering, and admin operations
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, User, Vendor
from datetime import datetime
from sqlalchemy import and_, or_, func
from utils.security import safe_error_response
from utils.image_analysis import compute_dominant_color_for_local_path, compute_dominant_color, color_distance
from utils.limiter import limiter

products_bp = Blueprint('products', __name__, url_prefix='/api/products')

def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


def get_own_approved_vendor(user_id):
    """The current user's own approved+active vendor profile, or None"""
    return Vendor.query.filter_by(user_id=user_id, is_approved=True, is_active=True).first()


def can_manage_product(user_id, product, own_vendor):
    """Admins can manage any product; an approved vendor can manage only their own"""
    if is_admin(user_id):
        return True
    return own_vendor is not None and product.vendor_id == own_vendor.id


@products_bp.route('', methods=['GET'])
def get_products():
    """
    Get all products with optional filtering and pagination
    
    Query parameters:
    - category: filter by category
    - search: search by name or description
    - sort: sort by (name, price, rating, created_at)
    - order: asc or desc
    - page: page number (default 1)
    - limit: items per page (default 20, max 100)
    - trending: show only trending (true/false)
    - featured: show only featured (true/false)
    - flash_sale: show only flash sale (true/false)
    - min_price: minimum price
    - max_price: maximum price
    - min_rating: minimum rating (e.g. 4 for 4 stars and up)
    - on_sale: show only discounted products (true/false)
    """
    try:
        # Get query parameters
        category = request.args.get('category', '').strip()
        search = request.args.get('search', '').strip()
        sort = request.args.get('sort', 'created_at')
        order = request.args.get('order', 'desc').lower()
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)  # Max 100 items
        trending = request.args.get('trending', '').lower() == 'true'
        featured = request.args.get('featured', '').lower() == 'true'
        flash_sale = request.args.get('flash_sale', '').lower() == 'true'
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        min_rating = request.args.get('min_rating', type=float)
        on_sale = request.args.get('on_sale', '').lower() == 'true'
        ids = request.args.get('ids', '').strip()
        vendor_id = request.args.get('vendor_id', type=int)

        # Validate pagination
        if page < 1:
            page = 1
        if limit < 1:
            limit = 20

        # Build query
        query = Product.query

        # Apply filters
        if category:
            query = query.filter_by(category=category)

        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f'%{search}%'),
                    Product.description.ilike(f'%{search}%')
                )
            )

        if trending:
            query = query.filter_by(is_trending=True)

        if featured:
            query = query.filter_by(is_featured=True)

        if flash_sale:
            query = query.filter_by(is_flash_sale=True)

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if min_rating is not None:
            query = query.filter(Product.rating >= min_rating)

        if on_sale:
            query = query.filter(Product.discount_percent > 0)

        if ids:
            try:
                id_list = [int(x) for x in ids.split(',') if x.strip()]
            except ValueError:
                id_list = []
            query = query.filter(Product.id.in_(id_list))

        if vendor_id is not None:
            query = query.filter_by(vendor_id=vendor_id)

        # Apply sorting
        valid_sorts = ['name', 'price', 'rating', 'created_at']
        if sort not in valid_sorts:
            sort = 'created_at'
        
        sort_column = getattr(Product, sort)
        if order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Paginate
        paginate = query.paginate(page=page, per_page=limit, error_out=False)
        
        products = [product.to_dict() for product in paginate.items]
        
        return jsonify({
            'message': 'Products retrieved successfully',
            'data': {
                'products': products,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages,
                    'has_next': paginate.has_next,
                    'has_prev': paginate.has_prev
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve products')


@products_bp.route('/search-by-image', methods=['POST'])
@limiter.limit("10 per minute")
def search_by_image():
    """
    Approximate visual search: matches products by average-color similarity
    to the uploaded photo. This is a lightweight heuristic (no external
    vision API) — it finds products with a visually similar dominant color,
    not products containing the same object.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        query_color = compute_dominant_color(file.stream)
        if not query_color:
            return jsonify({'error': 'Could not read that image'}), 400

        # Bound the candidate set for cost — favor well-established products
        candidates = (
            Product.query
            .filter(Product.dominant_color.isnot(None))
            .order_by(Product.rating.desc(), Product.created_at.desc())
            .limit(300)
            .all()
        )

        ranked = sorted(candidates, key=lambda p: color_distance(query_color, p.dominant_color))
        matches = ranked[:20]

        return jsonify({
            'message': 'Visual search results',
            'data': {
                'query_color': query_color,
                'products': [p.to_dict() for p in matches],
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to search by image')


@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all unique product categories"""
    try:
        categories = db.session.query(Product.category).distinct().order_by(Product.category).all()
        categories = [category[0] for category in categories if category[0]]
        return jsonify({
            'message': 'Categories retrieved successfully',
            'data': categories
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve categories')


@products_bp.route('/price-range', methods=['GET'])
def get_price_range():
    """Get the min and max product price, used to bound the price filter slider"""
    try:
        min_price, max_price = db.session.query(
            func.min(Product.price), func.max(Product.price)
        ).first()

        return jsonify({
            'message': 'Price range retrieved successfully',
            'data': {
                'min_price': float(min_price) if min_price is not None else 0,
                'max_price': float(max_price) if max_price is not None else 0
            }
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve price range')


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get a single product by ID"""
    try:
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({
            'message': 'Product retrieved successfully',
            'data': product.to_dict()
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve product')


@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    """
    Create a new product (admin only)
    
    Request body:
    {
        "name": "Product Name",
        "description": "Product description",
        "category": "Electronics",
        "price": 99.99,
        "discount_percent": 10,
        "image_url": "https://example.com/image.jpg",
        "sku": "PROD-001",
        "stock_quantity": 100,
        "rating": 4.5,
        "is_featured": false,
        "is_trending": false,
        "is_flash_sale": false
    }
    """
    try:
        user_id = int(get_jwt_identity())
        admin = is_admin(user_id)
        own_vendor = get_own_approved_vendor(user_id)

        if not admin and not own_vendor:
            return jsonify({'error': 'Admin or approved vendor access required'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Validate required fields
        required_fields = ['name', 'category', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Check if SKU already exists
        if data.get('sku') and Product.query.filter_by(sku=data['sku']).first():
            return jsonify({'error': 'SKU already exists'}), 409

        # A vendor can only create products under their own store; an admin
        # may optionally assign a vendor_id (or leave it null for a
        # Nexus-direct product)
        vendor_id = own_vendor.id if own_vendor else data.get('vendor_id')

        image_url = data.get('image_url', '')

        # Create product
        product = Product(
            name=data['name'].strip(),
            description=data.get('description', '').strip(),
            category=data['category'].strip(),
            price=float(data['price']),
            discount_percent=float(data.get('discount_percent', 0)),
            image_url=image_url,
            sku=data.get('sku', ''),
            stock_quantity=int(data.get('stock_quantity', 0)),
            rating=float(data.get('rating', 5.0)),
            is_featured=bool(data.get('is_featured', False)),
            is_trending=bool(data.get('is_trending', False)),
            is_flash_sale=bool(data.get('is_flash_sale', False)),
            vendor_id=vendor_id,
            dominant_color=compute_dominant_color_for_local_path(image_url)
        )

        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'data': product.to_dict(include_stock=True)
        }), 201
    
    except ValueError:
        db.session.rollback()
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create product')


@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """
    Update a product (admin only)
    
    Request body:
    Any fields that need to be updated
    """
    try:
        user_id = int(get_jwt_identity())

        product = Product.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        own_vendor = get_own_approved_vendor(user_id)
        if not can_manage_product(user_id, product, own_vendor):
            return jsonify({'error': 'You do not have permission to edit this product'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Update allowed fields
        allowed_fields = [
            'name', 'description', 'category', 'price', 'discount_percent',
            'image_url', 'stock_quantity', 'rating', 'is_featured',
            'is_trending', 'is_flash_sale', 'flash_sale_end'
        ]
        
        for field in allowed_fields:
            if field in data:
                if field == 'price' or field == 'discount_percent' or field == 'rating':
                    setattr(product, field, float(data[field]))
                elif field == 'stock_quantity':
                    setattr(product, field, int(data[field]))
                elif field in ['is_featured', 'is_trending', 'is_flash_sale']:
                    setattr(product, field, bool(data[field]))
                else:
                    setattr(product, field, data[field].strip() if isinstance(data[field], str) else data[field])

        if 'image_url' in data:
            product.dominant_color = compute_dominant_color_for_local_path(product.image_url)

        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'data': product.to_dict(include_stock=True)
        }), 200
    
    except ValueError:
        db.session.rollback()
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update product')


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete a product (admin only)"""
    try:
        user_id = int(get_jwt_identity())

        product = Product.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        own_vendor = get_own_approved_vendor(user_id)
        if not can_manage_product(user_id, product, own_vendor):
            return jsonify({'error': 'You do not have permission to delete this product'}), 403

        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to delete product')
