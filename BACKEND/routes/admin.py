"""
Admin Routes for Nexus Wholesale Hub
Handles all admin operations: products, orders, users, dashboard
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, User, Product, ProductImage, Category, ProductDescription, ProductAdCampaign, NegotiationMessage, Order, OrderItem, HeroBanner, Vendor, VendorEarning
from datetime import datetime, timedelta
from sqlalchemy import func
from utils.security import safe_error_response
from utils.cloud_storage import upload_file, is_cloud_storage_enabled
from utils.image_analysis import compute_dominant_color_for_image_url
from routes.notifications import create_notification
from routes.whatsapp_bot import send_message
from utils.ai_helpers import (
    generate_product_description,
    generate_facebook_ads,
    generate_negotiation_messages,
    analyze_trending_products,
    prepare_supplier_forwarding
)
import os
from werkzeug.utils import secure_filename
import mimetypes

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Uploads configuration. Logical bucket names - resolved to a Cloudinary
# folder or a local uploads/<name> directory by utils.cloud_storage.
UPLOAD_TYPES = {'products', 'categories', 'banners', 'banner_videos', 'vendor_logos', 'vendor_banners'}
MAX_PRODUCT_IMAGES = 10
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB (images)
MAX_VIDEO_FILE_SIZE = 40 * 1024 * 1024  # 40MB (hero banner video)

# Local dev fallback only needs its own directories; Cloudinary needs none.
if not is_cloud_storage_enabled():
    for folder in UPLOAD_TYPES:
        os.makedirs(os.path.join('uploads', folder), exist_ok=True)


def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


def allowed_file(filename, extensions=ALLOWED_EXTENSIONS):
    """Check if file is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in extensions


# ==================== DASHBOARD ====================

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    """Get dashboard statistics and metrics"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        # Calculate statistics
        total_products = Product.query.count()
        total_orders = Order.query.count()
        total_users = User.query.count()
        total_revenue = db.session.query(func.sum(Order.total_amount)).scalar() or 0
        
        # Pending orders
        pending_orders = Order.query.filter_by(status='pending').count()
        
        # Recent orders (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_orders = Order.query.filter(
            Order.created_at >= seven_days_ago
        ).count()
        
        # Top selling products
        top_products = db.session.query(
            Product.id,
            Product.name,
            func.sum(OrderItem.quantity).label('total_quantity')
        ).join(OrderItem).group_by(Product.id).order_by(
            func.sum(OrderItem.quantity).desc()
        ).limit(5).all()
        
        # Revenue by day (last 7 days)
        revenue_by_day = db.session.query(
            func.date(Order.created_at).label('date'),
            func.sum(Order.total_amount).label('revenue')
        ).filter(
            Order.created_at >= seven_days_ago,
            Order.payment_status == 'completed'
        ).group_by(func.date(Order.created_at)).all()
        
        return jsonify({
            'message': 'Dashboard data retrieved successfully',
            'data': {
                'stats': {
                    'total_products': total_products,
                    'total_orders': total_orders,
                    'total_users': total_users,
                    'total_revenue': float(total_revenue),
                    'pending_orders': pending_orders,
                    'recent_orders': recent_orders
                },
                'top_products': [
                    {
                        'id': p[0],
                        'name': p[1],
                        'total_quantity': p[2]
                    } for p in top_products
                ],
                'revenue_by_day': [
                    {
                        'date': str(r[0]),
                        'revenue': float(r[1])
                    } for r in revenue_by_day
                ]
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve dashboard')


# ==================== PRODUCTS ====================

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_admin_products():
    """Get all products for admin (with pagination)"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        search = request.args.get('search', '').strip()
        
        query = Product.query
        
        if search:
            query = query.filter(
                (Product.name.ilike(f'%{search}%')) |
                (Product.sku.ilike(f'%{search}%'))
            )
        
        paginate = query.order_by(Product.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        products = [product.to_dict(include_stock=True) for product in paginate.items]
        
        return jsonify({
            'message': 'Products retrieved successfully',
            'data': {
                'products': products,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve products')


@admin_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
def get_admin_product(product_id):
    """Get single product for editing"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({
            'message': 'Product retrieved successfully',
            'data': product.to_dict(include_stock=True)
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve product')


@admin_bp.route('/products', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_admin_product():
    """Create new product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'category', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check for duplicate SKU
        sku = data.get('sku')
        if sku and Product.query.filter_by(sku=sku).first():
            return jsonify({'error': 'SKU already exists'}), 409

        # Gallery images (list of URLs already uploaded via /admin/upload-image)
        images = [u.strip() for u in data.get('images', []) if u and u.strip()][:MAX_PRODUCT_IMAGES]
        cover_image = data.get('image_url', '') or (images[0] if images else '')

        # Create product
        product = Product(
            name=data.get('name').strip(),
            description=data.get('description', '').strip(),
            category=data.get('category').strip(),
            price=float(data.get('price')),
            discount_percent=float(data.get('discount_percent', 0)),
            image_url=cover_image,
            dominant_color=compute_dominant_color_for_image_url(cover_image),
            stock_quantity=int(data.get('stock_quantity', 0)),
            sku=sku,
            rating=float(data.get('rating', 5.0)),
            is_featured=data.get('is_featured', False),
            is_trending=data.get('is_trending', False),
            is_flash_sale=data.get('is_flash_sale', False)
        )
        db.session.add(product)
        db.session.flush()

        for i, url in enumerate(images):
            db.session.add(ProductImage(product_id=product.id, image_url=url, sort_order=i))

        db.session.commit()

        return jsonify({
            'message': 'Product created successfully',
            'data': product.to_dict()
        }), 201
    
    except ValueError:
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create product')


@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_admin_product(product_id):
    """Update product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields
        if 'name' in data:
            product.name = data['name'].strip()
        if 'description' in data:
            product.description = data['description'].strip()
        if 'category' in data:
            product.category = data['category'].strip()
        if 'price' in data:
            product.price = float(data['price'])
        if 'discount_percent' in data:
            product.discount_percent = float(data['discount_percent'])
        if 'image_url' in data:
            product.image_url = data['image_url']
        if 'images' in data:
            images = [u.strip() for u in data['images'] if u and u.strip()][:MAX_PRODUCT_IMAGES]
            ProductImage.query.filter_by(product_id=product.id).delete()
            for i, url in enumerate(images):
                db.session.add(ProductImage(product_id=product.id, image_url=url, sort_order=i))
            if images and 'image_url' not in data:
                product.image_url = images[0]
        if 'image_url' in data or 'images' in data:
            product.dominant_color = compute_dominant_color_for_image_url(product.image_url)
        if 'stock_quantity' in data:
            product.stock_quantity = int(data['stock_quantity'])
        if 'rating' in data:
            product.rating = float(data['rating'])
        if 'is_featured' in data:
            product.is_featured = data['is_featured']
        if 'is_trending' in data:
            product.is_trending = data['is_trending']
        if 'is_flash_sale' in data:
            product.is_flash_sale = data['is_flash_sale']
        
        product.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'data': product.to_dict()
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update product')


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per minute")
def delete_admin_product(product_id):
    """Delete product"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        product = Product.query.get(product_id)
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product deleted successfully'
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to delete product')


# ==================== IMAGE UPLOAD ====================

@admin_bp.route('/upload-image', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def upload_image():
    """Upload a file (product/category/banner image, or banner video, via the 'type' field)"""
    try:
        user_id = int(get_jwt_identity())

        upload_type = request.form.get('type', 'products')
        # Approved vendors upload their own product photos and store branding
        # from their dashboard — the product-create/update routes already
        # scope which product a vendor can attach an uploaded image to, so
        # allowing the upload itself doesn't grant any extra access.
        is_vendor_upload = upload_type in ('vendor_logos', 'vendor_banners', 'products')
        is_own_vendor = (
            is_vendor_upload
            and Vendor.query.filter_by(user_id=user_id, is_approved=True, is_active=True).first() is not None
        )

        if not is_admin(user_id) and not is_own_vendor:
            return jsonify({'error': 'Admin access required'}), 403

        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        is_video = upload_type == 'banner_videos'
        extensions = ALLOWED_VIDEO_EXTENSIONS if is_video else ALLOWED_EXTENSIONS
        max_size = MAX_VIDEO_FILE_SIZE if is_video else MAX_FILE_SIZE

        if not allowed_file(file.filename, extensions):
            return jsonify({'error': f'Invalid file type. Allowed: {", ".join(sorted(extensions))}'}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > max_size:
            return jsonify({'error': f'File too large. Maximum {max_size // (1024 * 1024)}MB'}), 400

        folder = upload_type if upload_type in UPLOAD_TYPES else 'products'

        filename = secure_filename(file.filename)
        timestamp = int(datetime.utcnow().timestamp())
        filename = f"{timestamp}_{filename}"

        file_url = upload_file(file, folder, filename)

        return jsonify({
            'message': 'Image uploaded successfully',
            'data': {
                'filename': filename,
                'url': file_url,
                'size': file_size
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Upload failed')


@admin_bp.route('/products/<int:product_id>/images', methods=['POST'])
@jwt_required()
@limiter.limit("20 per minute")
def add_product_images(product_id):
    """Upload and attach one or more gallery images to a product (max 10 total)"""
    try:
        user_id = int(get_jwt_identity())
        product = Product.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        is_own_vendor = (
            product.vendor_id is not None
            and Vendor.query.filter_by(
                id=product.vendor_id, user_id=user_id, is_approved=True, is_active=True
            ).first() is not None
        )
        if not is_admin(user_id) and not is_own_vendor:
            return jsonify({'error': 'Admin access required'}), 403

        files = request.files.getlist('files') or request.files.getlist('file')
        if not files:
            return jsonify({'error': 'No files provided'}), 400

        existing_count = ProductImage.query.filter_by(product_id=product.id).count()
        if existing_count + len(files) > MAX_PRODUCT_IMAGES:
            return jsonify({
                'error': f'A product can have at most {MAX_PRODUCT_IMAGES} images '
                         f'({existing_count} already uploaded, {len(files)} submitted)'
            }), 400

        next_sort_order = existing_count
        created = []
        for file in files:
            if file.filename == '':
                continue
            if not allowed_file(file.filename, ALLOWED_EXTENSIONS):
                return jsonify({'error': f'Invalid file type: {file.filename}'}), 400

            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            if file_size > MAX_FILE_SIZE:
                return jsonify({'error': f'{file.filename} is too large. Maximum {MAX_FILE_SIZE // (1024 * 1024)}MB'}), 400

            filename = secure_filename(file.filename)
            timestamp = int(datetime.utcnow().timestamp() * 1000)
            filename = f"{timestamp}_{filename}"
            file_url = upload_file(file, 'products', filename)

            image = ProductImage(product_id=product.id, image_url=file_url, sort_order=next_sort_order)
            db.session.add(image)
            next_sort_order += 1
            created.append(image)

        if not product.image_url and created:
            product.image_url = created[0].image_url
            product.dominant_color = compute_dominant_color_for_image_url(product.image_url)

        db.session.commit()

        return jsonify({
            'message': 'Images uploaded successfully',
            'data': {
                'images': [img.to_dict() for img in created],
                'product': product.to_dict(include_stock=True)
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to upload images')


@admin_bp.route('/products/<int:product_id>/images/<int:image_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("30 per minute")
def delete_product_image(product_id, image_id):
    """Remove a single gallery image from a product"""
    try:
        user_id = int(get_jwt_identity())
        product = Product.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        is_own_vendor = (
            product.vendor_id is not None
            and Vendor.query.filter_by(
                id=product.vendor_id, user_id=user_id, is_approved=True, is_active=True
            ).first() is not None
        )
        if not is_admin(user_id) and not is_own_vendor:
            return jsonify({'error': 'Admin access required'}), 403

        image = ProductImage.query.filter_by(id=image_id, product_id=product.id).first()
        if not image:
            return jsonify({'error': 'Image not found'}), 404

        was_cover = product.image_url == image.image_url
        db.session.delete(image)
        db.session.flush()

        if was_cover:
            remaining = ProductImage.query.filter_by(product_id=product.id).order_by(ProductImage.sort_order).first()
            product.image_url = remaining.image_url if remaining else None
            product.dominant_color = compute_dominant_color_for_image_url(product.image_url)

        db.session.commit()

        return jsonify({
            'message': 'Image removed successfully',
            'data': {'product': product.to_dict(include_stock=True)}
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to remove image')


# ==================== CATEGORIES ====================

@admin_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_admin_categories():
    """Get all categories for admin management"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        categories = Category.query.order_by(Category.name).all()

        return jsonify({
            'message': 'Categories retrieved successfully',
            'data': [category.to_dict() for category in categories]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve categories')


@admin_bp.route('/categories', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_admin_category():
    """Create a new category"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()

        if not data or not data.get('name'):
            return jsonify({'error': 'name is required'}), 400

        name = data['name'].strip()

        if Category.query.filter_by(name=name).first():
            return jsonify({'error': 'Category already exists'}), 409

        category = Category(
            name=name,
            image_url=data.get('image_url', '')
        )

        db.session.add(category)
        db.session.commit()

        return jsonify({
            'message': 'Category created successfully',
            'data': category.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create category')


@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_admin_category(category_id):
    """Update a category"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        category = Category.query.get(category_id)

        if not category:
            return jsonify({'error': 'Category not found'}), 404

        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if 'name' in data:
            new_name = data['name'].strip()
            existing = Category.query.filter_by(name=new_name).first()
            if existing and existing.id != category.id:
                return jsonify({'error': 'Category already exists'}), 409
            category.name = new_name

        if 'image_url' in data:
            category.image_url = data['image_url']

        category.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Category updated successfully',
            'data': category.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update category')


@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per minute")
def delete_admin_category(category_id):
    """Delete a category"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        category = Category.query.get(category_id)

        if not category:
            return jsonify({'error': 'Category not found'}), 404

        db.session.delete(category)
        db.session.commit()

        return jsonify({
            'message': 'Category deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to delete category')


# ==================== HERO BANNERS ====================

HERO_BANNER_FIELDS = [
    'headline', 'subheading', 'badge_text', 'video_url', 'poster_image_url',
    'cta_shop_text', 'cta_shop_link', 'cta_deals_text', 'cta_deals_link', 'show_watch_video',
    'flash_sale_label', 'announcement_text', 'announcement_link', 'ticker_text',
    'countdown_enabled', 'countdown_label', 'overlay_color', 'accent_color',
    'is_active', 'display_order',
]
HERO_BANNER_DATETIME_FIELDS = ['countdown_end', 'starts_at', 'ends_at']


def _apply_hero_banner_fields(banner, data):
    """Assign whitelisted fields from a request payload onto a HeroBanner instance"""
    for field in HERO_BANNER_FIELDS:
        if field in data:
            setattr(banner, field, data[field])

    for field in HERO_BANNER_DATETIME_FIELDS:
        if field in data:
            value = data[field]
            setattr(banner, field, datetime.fromisoformat(value) if value else None)


@admin_bp.route('/hero-banners', methods=['GET'])
@jwt_required()
def get_admin_hero_banners():
    """Get all hero banners for admin management"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        banners = HeroBanner.query.order_by(HeroBanner.display_order.asc(), HeroBanner.updated_at.desc()).all()

        return jsonify({
            'message': 'Hero banners retrieved successfully',
            'data': [banner.to_dict() for banner in banners]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve hero banners')


@admin_bp.route('/hero-banners', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def create_admin_hero_banner():
    """Create a new hero banner"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        banner = HeroBanner()
        _apply_hero_banner_fields(banner, data)

        db.session.add(banner)
        db.session.commit()

        return jsonify({
            'message': 'Hero banner created successfully',
            'data': banner.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to create hero banner')


@admin_bp.route('/hero-banners/<int:banner_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_admin_hero_banner(banner_id):
    """Update a hero banner"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        banner = HeroBanner.query.get(banner_id)

        if not banner:
            return jsonify({'error': 'Hero banner not found'}), 404

        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        _apply_hero_banner_fields(banner, data)
        banner.updated_at = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'message': 'Hero banner updated successfully',
            'data': banner.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update hero banner')


@admin_bp.route('/hero-banners/<int:banner_id>', methods=['DELETE'])
@jwt_required()
@limiter.limit("10 per minute")
def delete_admin_hero_banner(banner_id):
    """Delete a hero banner"""
    try:
        user_id = int(get_jwt_identity())

        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        banner = HeroBanner.query.get(banner_id)

        if not banner:
            return jsonify({'error': 'Hero banner not found'}), 404

        db.session.delete(banner)
        db.session.commit()

        return jsonify({
            'message': 'Hero banner deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to delete hero banner')


# ==================== VENDORS ====================

VENDOR_ADMIN_FIELDS = ['store_name', 'is_approved', 'is_active', 'commission_percent']


@admin_bp.route('/vendors', methods=['GET'])
@jwt_required()
def get_admin_vendors():
    """List all vendor applications/profiles"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        vendors = Vendor.query.order_by(Vendor.created_at.desc()).all()

        return jsonify({
            'message': 'Vendors retrieved successfully',
            'data': [v.to_dict(include_contact=True) for v in vendors]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendors')


@admin_bp.route('/vendors/<int:vendor_id>', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_admin_vendor(vendor_id):
    """Approve/reject/deactivate a vendor, or set their commission rate"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        vendor = Vendor.query.get(vendor_id)
        if not vendor:
            return jsonify({'error': 'Vendor not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        for field in VENDOR_ADMIN_FIELDS:
            if field in data:
                setattr(vendor, field, data[field])

        vendor.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Vendor updated successfully',
            'data': vendor.to_dict(include_contact=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update vendor')


@admin_bp.route('/vendor-earnings', methods=['GET'])
@jwt_required()
def get_admin_vendor_earnings():
    """List all vendor commission-ledger entries (read-only, for reconciliation)"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        earnings = VendorEarning.query.order_by(VendorEarning.created_at.desc()).all()

        return jsonify({
            'message': 'Vendor earnings retrieved successfully',
            'data': [e.to_dict() for e in earnings]
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve vendor earnings')


@admin_bp.route('/vendor-earnings/<int:earning_id>/mark-paid', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def mark_vendor_earning_paid(earning_id):
    """Mark a vendor earning row as paid out (manual reconciliation, no automated transfer)"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        earning = VendorEarning.query.get(earning_id)
        if not earning:
            return jsonify({'error': 'Vendor earning not found'}), 404

        earning.payout_status = 'paid'
        db.session.commit()

        return jsonify({'message': 'Marked as paid', 'data': earning.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update vendor earning')


# ==================== ORDERS ====================

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_admin_orders():
    """Get all orders"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        status = request.args.get('status', '').strip()
        search = request.args.get('search', '').strip()
        
        query = Order.query
        
        if status:
            query = query.filter_by(status=status)
        
        if search:
            query = query.filter(
                (Order.order_number.ilike(f'%{search}%')) |
                (User.email.ilike(f'%{search}%'))
            ).join(User)
        
        paginate = query.order_by(Order.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        orders = []
        for order in paginate.items:
            order_data = {
                'id': order.id,
                'order_number': order.order_number,
                'user_id': order.user_id,
                'user_email': order.user.email if order.user else 'Unknown',
                'status': order.status,
                'payment_status': order.payment_status,
                'total_amount': order.total_amount,
                'items_count': len(order.items),
                'created_at': order.created_at.isoformat(),
                'updated_at': order.updated_at.isoformat()
            }
            orders.append(order_data)
        
        return jsonify({
            'message': 'Orders retrieved successfully',
            'data': {
                'orders': orders,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve orders')


@admin_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_admin_order(order_id):
    """Get single order details"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        order_data = {
            'id': order.id,
            'order_number': order.order_number,
            'user_id': order.user_id,
            'user': {
                'id': order.user.id,
                'email': order.user.email,
                'full_name': order.user.full_name,
                'phone': order.user.phone,
                'address': order.user.address
            },
            'status': order.status,
            'payment_status': order.payment_status,
            'total_amount': order.total_amount,
            'shipping_address': order.shipping_address,
            'shipping_cost': order.shipping_cost,
            'delivery_fee': order.delivery_fee,
            'notes': order.notes,
            'created_at': order.created_at.isoformat(),
            'items': [
                {
                    'id': item.id,
                    'product': {
                        'id': item.product.id,
                        'name': item.product.name,
                        'sku': item.product.sku
                    },
                    'quantity': item.quantity,
                    'price_at_purchase': item.price_at_purchase,
                    'subtotal': item.subtotal
                } for item in order.items
            ]
        }

        return jsonify({
            'message': 'Order retrieved successfully',
            'data': order_data
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve order')

@admin_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def update_order_status(order_id):
    """Update order status"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'error': 'status is required'}), 400
        
        new_status = data['status'].strip()
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Valid: {", ".join(valid_statuses)}'}), 400
        
        order.status = new_status
        order.updated_at = datetime.utcnow()

        try:
            create_notification(
                user_id=order.user_id,
                title=f'Order #{order.order_number} is now {new_status}',
                message=f'Your order #{order.order_number} status changed to "{new_status}".',
                link=f'/orders/{order.id}',
                type='order_status',
            )
        except Exception:
            current_app.logger.exception('Failed to create order-status notification')

        if order.shipping_phone:
            try:
                sent = send_message(
                    order.shipping_phone,
                    f'Hi! Your Nexus order #{order.order_number} is now "{new_status}". '
                    f'Track it here: {os.getenv("FRONTEND_URL", "")}/orders/{order.id}'
                )
                if sent:
                    order.whatsapp_notification_sent = True
            except Exception:
                current_app.logger.exception('Failed to send WhatsApp order-status message')

        db.session.commit()

        return jsonify({
            'message': 'Order status updated successfully',
            'data': {
                'order_id': order.id,
                'status': order.status,
                'updated_at': order.updated_at.isoformat()
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update order')


@admin_bp.route('/products/<int:product_id>/generate-description', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def generate_product_description_route(product_id):
    """Generate and save AI product description for a product"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        data = request.get_json() or {}
        features = data.get('features') or []
        category = data.get('category') or product.category
        translate = bool(data.get('translate', False))

        if isinstance(features, str):
            features = [item.strip() for item in features.split('\n') if item.strip()]

        result = generate_product_description(
            title=product.name,
            features=features,
            category=category,
            product_price=product.price,
            translate=translate
        )

        description = ProductDescription(
            product_id=product.id,
            seo_title=result['seo_title'],
            marketing_description=result['marketing_description'],
            bullet_features=str(result['bullet_features']),
            whatsapp_caption=result['whatsapp_caption'],
            generated_at=datetime.utcnow(),
            prompt_used=result['prompt_used'],
            input_title=product.name,
            input_features=str(features),
            input_category=category
        )

        if not product.description:
            product.description = result['marketing_description']
        db.session.add(description)
        db.session.commit()

        return jsonify({
            'message': 'Product description generated successfully',
            'data': description.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to generate description')


@admin_bp.route('/products/<int:product_id>/generate-ads', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def generate_product_ads_route(product_id):
    """Generate Facebook ad variations for a product"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        data = request.get_json() or {}
        image_url = data.get('image_url') or product.image_url or ''
        count = min(max(int(data.get('count', 4)), 1), 5)

        result = generate_facebook_ads(
            title=product.name,
            price=product.price,
            image_url=image_url,
            description=product.description or '',
            count=count
        )

        campaigns = []
        for variation in result['ads']:
            campaign = ProductAdCampaign(
                product_id=product.id,
                variation_index=variation['variation_index'],
                headline=variation['headline'],
                primary_text=variation['primary_text'],
                call_to_action=variation['call_to_action'],
                hashtags=variation['hashtags'],
                generated_at=datetime.utcnow(),
                prompt_used=result['prompt_used']
            )
            db.session.add(campaign)
            campaigns.append(campaign)

        db.session.commit()

        return jsonify({
            'message': 'Ad campaigns generated successfully',
            'data': [campaign.to_dict() for campaign in campaigns]
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to generate ads')


@admin_bp.route('/trending-products', methods=['GET'])
@jwt_required()
def get_trending_products_route():
    """Get today's top winning products"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        limit = min(int(request.args.get('limit', 10)), 20)
        winners = analyze_trending_products(limit=limit)

        return jsonify({
            'message': 'Trending products retrieved successfully',
            'data': {
                'trending_products': winners
            }
        }), 200
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve trending products')


@admin_bp.route('/generate-negotiation-message', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def generate_negotiation_message_route():
    """Generate supplier negotiation messages"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json() or {}
        product_name = data.get('product_name', '').strip()
        supplier_name = data.get('supplier_name', '').strip() or 'Supplier'
        current_price = float(data.get('current_price', 0)) if data.get('current_price') else None

        if not product_name:
            return jsonify({'error': 'product_name is required'}), 400

        result = generate_negotiation_messages(product_name, supplier_name, current_price)
        message = NegotiationMessage(
            product_name=product_name,
            supplier_name=supplier_name,
            current_price=current_price,
            english_message=result['english_message'],
            chinese_message=result['chinese_message'],
            bulk_order_message=result['bulk_order_message'],
            generated_at=datetime.utcnow(),
            prompt_used=result['prompt_used']
        )
        db.session.add(message)
        db.session.commit()

        return jsonify({
            'message': 'Negotiation message generated successfully',
            'data': message.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to generate negotiation message')


@admin_bp.route('/orders/<int:order_id>/forward-supplier', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def forward_order_to_supplier_route(order_id):
    """Prepare supplier forwarding messages for dropshipping"""
    try:
        user_id = int(get_jwt_identity())
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        data = request.get_json() or {}
        supplier_contact = data.get('supplier_contact', '').strip()
        delivery_fee = float(data.get('delivery_fee', 0)) if data.get('delivery_fee') else 0
        supplier_order_id = data.get('supplier_order_id', '').strip()

        result = prepare_supplier_forwarding(order)
        order.supplier_contact = supplier_contact or order.supplier_contact
        order.delivery_fee = delivery_fee
        order.supplier_order_id = supplier_order_id or order.supplier_order_id
        order.dropship_forwarded = True
        order.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Supplier forwarding prepared successfully',
            'data': {
                'supplier_contact': order.supplier_contact,
                'supplier_order_id': order.supplier_order_id,
                'delivery_fee': order.delivery_fee,
                'dropship_forwarded': order.dropship_forwarded,
                'whatsapp_message': result['whatsapp_message'],
                'email_message': result['email_message']
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to forward order to supplier')


# ==================== USERS ====================

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_admin_users():
    """Get all users"""
    try:
        user_id = int(get_jwt_identity())
        
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        page = request.args.get('page', 1, type=int)
        limit = min(int(request.args.get('limit', 20)), 100)
        search = request.args.get('search', '').strip()
        
        query = User.query
        
        if search:
            query = query.filter(
                (User.email.ilike(f'%{search}%')) |
                (User.username.ilike(f'%{search}%')) |
                (User.full_name.ilike(f'%{search}%'))
            )
        
        paginate = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=limit, error_out=False
        )
        
        users = []
        for user in paginate.items:
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'phone': user.phone,
                'is_admin': user.is_admin,
                'is_active': user.is_active,
                'orders_count': len(user.orders),
                'created_at': user.created_at.isoformat()
            }
            users.append(user_data)
        
        return jsonify({
            'message': 'Users retrieved successfully',
            'data': {
                'users': users,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': paginate.total,
                    'pages': paginate.pages
                }
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to retrieve users')


@admin_bp.route('/users/<int:user_id>/toggle-admin', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def toggle_admin(user_id):
    """Toggle admin status for user"""
    try:
        current_admin = int(get_jwt_identity())
        
        if not is_admin(current_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_admin = not user.is_admin
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'User {"promoted to" if user.is_admin else "removed from"} admin',
            'data': {
                'user_id': user.id,
                'is_admin': user.is_admin
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update user')


@admin_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@jwt_required()
@limiter.limit("10 per minute")
def toggle_active(user_id):
    """Toggle active status for user"""
    try:
        current_admin = int(get_jwt_identity())
        
        if not is_admin(current_admin):
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': f'User {"activated" if user.is_active else "deactivated"}',
            'data': {
                'user_id': user.id,
                'is_active': user.is_active
            }
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to update user')
