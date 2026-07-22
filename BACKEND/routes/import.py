"""
Product Import Routes for Nexus Wholesale Hub
Handles 1688 product import for dropshipping workflow
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Product, User
from utils.import_helper import (
    validate_1688_url,
    extract_1688_product_data,
    convert_rmb_to_ghs,
    generate_seo_description,
    generate_whatsapp_description,
    create_product_slug,
    estimate_profit
)
from utils.security import safe_error_response
from datetime import datetime
import re

import_bp = Blueprint('import', __name__, url_prefix='/api/import')


def is_admin(user_id):
    """Check if user is admin"""
    user = User.query.get(user_id)
    return user and user.is_admin


@import_bp.route('/preview', methods=['POST'])
@jwt_required()
def preview_import():
    """
    Preview product data before importing (no admin required for preview)
    
    Request body:
    {
        "product_url": "https://www.1688.com/...",
        "profit_margin_percent": 40
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        product_url = data.get('product_url', '').strip()
        profit_margin = data.get('profit_margin_percent', 40)
        
        if not product_url:
            return jsonify({'error': 'product_url is required'}), 400
        
        # Validate URL
        if not validate_1688_url(product_url):
            return jsonify({'error': 'Invalid URL. Must be from 1688.com'}), 400
        
        # Extract product data
        extraction = extract_1688_product_data(product_url)
        
        if not extraction['success']:
            return jsonify({
                'error': 'Failed to extract product data',
                'details': extraction.get('error')
            }), 400
        
        product_data = extraction['data']
        
        # Convert price if available
        price_conversion = None
        if product_data['price_rmb']:
            price_conversion = convert_rmb_to_ghs(
                product_data['price_rmb'],
                profit_margin
            )
        
        # Generate descriptions
        seo_description = generate_seo_description(
            product_data['title'],
            product_data['category']
        )
        
        final_price = price_conversion['data']['final_price_ghs'] if price_conversion else None
        
        whatsapp_message = generate_whatsapp_description(
            product_data['title'],
            final_price
        ) if final_price else None
        
        # Get profit estimate
        profit_estimate = None
        if product_data['price_rmb']:
            profit_estimate = estimate_profit(
                product_data['price_rmb'],
                profit_margin
            )
        
        return jsonify({
            'message': 'Product preview generated successfully',
            'data': {
                'product': {
                    'title': product_data['title'],
                    'description': seo_description,
                    'category': product_data['category'],
                    'original_price_rmb': product_data['price_rmb'],
                    'images': product_data['images'],
                    'source_url': product_url
                },
                'pricing': price_conversion['data'] if price_conversion else None,
                'profit_estimate': profit_estimate['data'] if profit_estimate else None,
                'whatsapp_message': whatsapp_message,
                'ready_to_import': all([
                    product_data['title'],
                    product_data['price_rmb'],
                    product_data['images']
                ])
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Preview generation failed')


@import_bp.route('/product', methods=['POST'])
@jwt_required()
def import_product():
    """
    Import and save product to database (admin only)
    
    Request body:
    {
        "product_url": "https://www.1688.com/...",
        "product_title": "Product Name",
        "price_ghs": 299.99,
        "images": ["url1", "url2"],
        "category": "Electronics",
        "profit_margin_percent": 40,
        "stock_quantity": 50,
        "is_featured": false
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Check if user is admin
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['product_title', 'price_ghs', 'category']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        product_title = data.get('product_title', '').strip()
        price_ghs = float(data.get('price_ghs', 0))
        category = data.get('category', 'Wholesale').strip()
        images = data.get('images', [])
        stock_quantity = data.get('stock_quantity', 10)
        is_featured = data.get('is_featured', False)
        source_url = data.get('product_url', '').strip()
        
        if price_ghs <= 0:
            return jsonify({'error': 'Price must be greater than 0'}), 400
        
        # Generate SEO description
        seo_description = data.get('description')
        if not seo_description:
            seo_description = generate_seo_description(product_title, category)
        
        # Create product slug for SKU
        slug = create_product_slug(product_title)
        
        # Generate unique SKU
        sku = f"IMP-{slug}-{int(datetime.utcnow().timestamp())}"[:50]
        
        # Check if product already exists
        if Product.query.filter_by(sku=sku).first():
            return jsonify({'error': 'Product already imported (duplicate SKU)'}), 409
        
        # Use first image as main product image
        main_image = images[0] if images else None
        
        # Create product
        product = Product(
            name=product_title,
            description=seo_description,
            category=category,
            price=price_ghs,
            discount_percent=0,
            image_url=main_image,
            stock_quantity=stock_quantity,
            sku=sku,
            rating=4.5,  # Default rating for imported products
            is_featured=is_featured,
            is_trending=False,
            is_flash_sale=False
        )
        
        # Store source information in metadata (if available)
        if source_url:
            product.source_url = source_url  # You can add this column to the model
        
        db.session.add(product)
        db.session.commit()
        
        # Generate WhatsApp message for this product
        whatsapp_msg = generate_whatsapp_description(product_title, price_ghs)
        
        return jsonify({
            'message': 'Product imported successfully',
            'data': {
                'product': product.to_dict(),
                'sku': product.sku,
                'whatsapp_message': whatsapp_msg,
                'import_summary': {
                    'title': product_title,
                    'price_ghs': price_ghs,
                    'category': category,
                    'stock': stock_quantity,
                    'images_imported': len(images)
                }
            }
        }), 201
    
    except ValueError:
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Import failed')


@import_bp.route('/batch', methods=['POST'])
@jwt_required()
def batch_import():
    """
    Batch import multiple products (admin only)
    
    Request body:
    {
        "products": [
            {
                "product_url": "...",
                "profit_margin_percent": 40
            }
        ]
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Check if user is admin
        if not is_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        if not data or 'products' not in data:
            return jsonify({'error': 'products array is required'}), 400
        
        products_list = data['products']
        
        if not isinstance(products_list, list) or len(products_list) == 0:
            return jsonify({'error': 'products must be a non-empty array'}), 400
        
        if len(products_list) > 20:
            return jsonify({'error': 'Maximum 20 products per batch import'}), 400
        
        results = {
            'successful': [],
            'failed': []
        }
        
        for idx, product_data in enumerate(products_list):
            try:
                product_url = product_data.get('product_url', '').strip()
                profit_margin = product_data.get('profit_margin_percent', 40)
                
                if not product_url:
                    results['failed'].append({
                        'index': idx,
                        'error': 'product_url is required'
                    })
                    continue
                
                if not validate_1688_url(product_url):
                    results['failed'].append({
                        'index': idx,
                        'url': product_url,
                        'error': 'Invalid 1688 URL'
                    })
                    continue
                
                # Extract product data
                extraction = extract_1688_product_data(product_url)
                
                if not extraction['success']:
                    results['failed'].append({
                        'index': idx,
                        'url': product_url,
                        'error': extraction.get('error')
                    })
                    continue
                
                product_info = extraction['data']
                
                # Convert price
                if not product_info['price_rmb']:
                    results['failed'].append({
                        'index': idx,
                        'title': product_info['title'],
                        'error': 'Price not found'
                    })
                    continue
                
                price_conversion = convert_rmb_to_ghs(
                    product_info['price_rmb'],
                    profit_margin
                )
                
                if not price_conversion['success']:
                    results['failed'].append({
                        'index': idx,
                        'title': product_info['title'],
                        'error': 'Price conversion failed'
                    })
                    continue
                
                final_price = price_conversion['data']['final_price_ghs']
                
                # Generate descriptions
                seo_desc = generate_seo_description(
                    product_info['title'],
                    product_info['category']
                )
                
                # Create product
                slug = create_product_slug(product_info['title'])
                sku = f"IMP-{slug}-{int(datetime.utcnow().timestamp())}"[:50]
                
                product = Product(
                    name=product_info['title'],
                    description=seo_desc,
                    category=product_info['category'],
                    price=final_price,
                    discount_percent=0,
                    image_url=product_info['images'][0] if product_info['images'] else None,
                    stock_quantity=10,
                    sku=sku,
                    rating=4.5,
                    is_featured=False,
                    is_trending=False
                )
                
                db.session.add(product)
                db.session.commit()
                
                results['successful'].append({
                    'index': idx,
                    'title': product_info['title'],
                    'sku': sku,
                    'price_ghs': final_price,
                    'id': product.id
                })
            
            except Exception as e:
                current_app.logger.error(f'Batch import error for product {idx}: {str(e)}')
                results['failed'].append({
                    'index': idx,
                    'error': 'Failed to import this product'
                })
                db.session.rollback()
        
        return jsonify({
            'message': f'Batch import completed: {len(results["successful"])} successful, {len(results["failed"])} failed',
            'data': results
        }), 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Batch import failed')


@import_bp.route('/exchange-rate', methods=['GET'])
def get_exchange_rate():
    """Get current RMB to GHS exchange rate"""
    try:
        from utils.import_helper import get_current_exchange_rate
        
        rate = get_current_exchange_rate()
        
        return jsonify({
            'message': 'Exchange rate retrieved',
            'data': {
                'from': 'RMB',
                'to': 'GHS',
                'rate': rate,
                'timestamp': datetime.utcnow().isoformat(),
                'example': f'1 RMB = {rate} GHS'
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to get exchange rate')


@import_bp.route('/profit-calculator', methods=['POST'])
def calculate_profit():
    """
    Calculate profit for a given price and margin
    
    Request body:
    {
        "price_rmb": 50.00,
        "profit_margin_percent": 40,
        "quantity": 10
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        price_rmb = float(data.get('price_rmb', 0))
        profit_margin = float(data.get('profit_margin_percent', 40))
        quantity = int(data.get('quantity', 1))
        
        if price_rmb <= 0:
            return jsonify({'error': 'price_rmb must be greater than 0'}), 400
        
        if profit_margin < 0 or profit_margin > 200:
            return jsonify({'error': 'profit_margin_percent should be between 0 and 200'}), 400
        
        profit = estimate_profit(price_rmb, profit_margin, quantity)
        
        if not profit['success']:
            return jsonify({'error': profit.get('error')}), 400
        
        return jsonify({
            'message': 'Profit calculated successfully',
            'data': profit['data']
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid data format. Check field types.'}), 400
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Calculation failed')


@import_bp.route('/bulk-pricing', methods=['POST'])
def bulk_pricing():
    """
    Calculate bulk pricing for different quantities
    
    Request body:
    {
        "price_rmb": 50.00,
        "profit_margin_percent": 40,
        "quantities": [1, 10, 50, 100]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        price_rmb = float(data.get('price_rmb', 0))
        profit_margin = float(data.get('profit_margin_percent', 40))
        quantities = data.get('quantities', [1, 5, 10, 50])
        
        if price_rmb <= 0:
            return jsonify({'error': 'price_rmb must be greater than 0'}), 400
        
        pricing_tiers = []
        
        for qty in quantities:
            profit = estimate_profit(price_rmb, profit_margin, int(qty))
            if profit['success']:
                pricing_tiers.append({
                    'quantity': int(qty),
                    'unit_price_ghs': profit['data']['final_price_ghs'],
                    'total_price_ghs': profit['data']['final_price_ghs'] * int(qty),
                    'profit_per_unit': profit['data']['profit_per_unit_ghs']
                })
        
        return jsonify({
            'message': 'Bulk pricing calculated successfully',
            'data': {
                'base_price_rmb': price_rmb,
                'profit_margin_percent': profit_margin,
                'pricing_tiers': pricing_tiers
            }
        }), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Bulk pricing calculation failed')
