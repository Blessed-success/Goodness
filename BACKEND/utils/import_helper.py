"""
Product Import Helper Functions
Handles 1688 product extraction, currency conversion, and description generation
"""

import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import os

# Exchange rates (you can update these from an API)
# Using approximate rates, in production use a live API like exchangerate-api.com
EXCHANGE_RATES = {
    'RMB_TO_GHS': 0.55  # 1 RMB ≈ 0.55 GHS (approximate)
}


def get_current_exchange_rate():
    """
    Get current RMB to GHS exchange rate from API
    Falls back to static rate if API fails
    """
    try:
        # Using exchangerate-api.com (free tier available)
        response = requests.get(
            'https://api.exchangerate-api.com/v4/latest/CNY',
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            ghs_rate = data['rates'].get('GHS', EXCHANGE_RATES['RMB_TO_GHS'])
            return ghs_rate
    except Exception as e:
        print(f"Could not fetch exchange rate: {e}")
    
    return EXCHANGE_RATES['RMB_TO_GHS']


def extract_1688_product_data(product_url):
    """
    Extract product data from 1688 product URL
    
    Args:
        product_url (str): 1688 product URL
        
    Returns:
        dict: Extracted product data
    """
    try:
        # Set headers to mimic browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(product_url, headers=headers, timeout=10)
        response.encoding = 'utf-8'
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'Failed to fetch URL: HTTP {response.status_code}'
            }
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract title
        title = None
        title_selectors = [
            'h1.title',
            'h1[data-testid="pc-title"]',
            'h1',
            'span[data-testid="productTitle"]'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text(strip=True)
                break
        
        if not title:
            return {
                'success': False,
                'error': 'Could not extract product title'
            }
        
        # Extract price (RMB)
        price = None
        price_patterns = [
            r'¥[\s]*(\d+\.?\d*)',  # ¥123.45
            r'￥[\s]*(\d+\.?\d*)',  # ￥123.45
            r'从[\s]*¥[\s]*(\d+\.?\d*)',  # 从 ¥123
            r'起[\s]*¥[\s]*(\d+\.?\d*)',  # 起 ¥123
        ]
        
        page_text = soup.get_text()
        for pattern in price_patterns:
            match = re.search(pattern, page_text)
            if match:
                price = float(match.group(1))
                break
        
        if not price:
            # Return warning but continue
            price = None
        
        # Extract images
        images = []
        image_selectors = [
            'img[data-testid*="image"]',
            'img.preview-image',
            'img.detail-pic',
            'img.photo-item',
            'div.detail-images img'
        ]
        
        for selector in image_selectors:
            elements = soup.select(selector)
            for elem in elements:
                src = elem.get('src') or elem.get('data-src')
                if src and 'image' in src.lower():
                    if src.startswith('//'):
                        src = 'https:' + src
                    elif not src.startswith('http'):
                        src = 'https://image.1688.com/' + src
                    if src not in images and len(images) < 5:
                        images.append(src)
        
        # Extract category from URL or default
        category = extract_category_from_url(product_url)
        
        return {
            'success': True,
            'data': {
                'title': title,
                'price_rmb': price,
                'images': images[:5],  # Limit to 5 images
                'category': category,
                'source_url': product_url
            }
        }
    
    except requests.exceptions.RequestException as e:
        return {
            'success': False,
            'error': f'Request failed: {str(e)}'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Extraction failed: {str(e)}'
        }


def extract_category_from_url(url):
    """
    Extract category from 1688 URL
    
    Args:
        url (str): Product URL
        
    Returns:
        str: Extracted category or 'Wholesale' as default
    """
    try:
        # Pattern: 1688.com/category/productid
        match = re.search(r'1688\.com/([a-z]+)/', url.lower())
        if match:
            category_map = {
                'offer': 'Wholesale',
                'product': 'Wholesale',
                'sale': 'Wholesale',
                'buy': 'Wholesale',
                'search': 'Wholesale'
            }
            category = match.group(1)
            return category_map.get(category, 'Wholesale')
    except:
        pass
    
    return 'Wholesale'


def convert_rmb_to_ghs(price_rmb, profit_margin_percent=40):
    """
    Convert RMB price to GHS with profit margin
    
    Args:
        price_rmb (float): Price in RMB
        profit_margin_percent (float): Profit margin percentage (default 40%)
        
    Returns:
        dict: Conversion details
    """
    if price_rmb is None or price_rmb == 0:
        return {
            'success': False,
            'error': 'Invalid price'
        }
    
    # Get current exchange rate
    exchange_rate = get_current_exchange_rate()
    
    # Convert to GHS
    price_ghs_base = price_rmb * exchange_rate
    
    # Add shipping cost (estimate ~5 GHS per item for international shipping)
    shipping_cost = 5.0
    
    # Calculate with profit margin
    price_with_margin = price_ghs_base + shipping_cost
    final_price = price_with_margin * (1 + profit_margin_percent / 100)
    
    # Round to nearest 0.5 for better pricing
    final_price = round(final_price * 2) / 2
    
    return {
        'success': True,
        'data': {
            'price_rmb': price_rmb,
            'exchange_rate': exchange_rate,
            'price_ghs_base': round(price_ghs_base, 2),
            'shipping_cost': shipping_cost,
            'subtotal': round(price_with_margin, 2),
            'profit_margin_percent': profit_margin_percent,
            'final_price_ghs': final_price,
            'profit_per_unit': round(final_price - price_with_margin, 2)
        }
    }


def generate_seo_description(product_title, category='Wholesale', word_count=100):
    """
    Generate SEO-optimized product description
    
    Args:
        product_title (str): Product title
        category (str): Product category
        word_count (int): Target word count
        
    Returns:
        str: Generated description
    """
    # Extract keywords from title
    words = product_title.split()
    primary_keyword = words[0] if words else category
    
    template = f"""
Discover our premium {primary_keyword.lower()} from trusted wholesale suppliers. 
This high-quality {category.lower()} product is sourced directly from reliable manufacturers 
ensuring competitive pricing and excellent value for your business.

Perfect for resellers and retailers looking for bulk purchase options with guaranteed authenticity. 
Our {primary_keyword.lower()} undergoes rigorous quality checks before shipment.

Features:
• Authentic product
• Competitive wholesale pricing
• Fast delivery
• Bulk purchase available
• Direct from manufacturer

Ideal for: Retail stores, Resellers, Wholesale businesses

Contact us for bulk orders, customization, and special pricing.
    """.strip()
    
    return template


def generate_whatsapp_description(product_title, price_ghs, quantity=1):
    """
    Generate WhatsApp-friendly product message
    
    Args:
        product_title (str): Product name
        price_ghs (float): Price in GHS
        quantity (int): Default quantity
        
    Returns:
        str: WhatsApp message template
    """
    total_price = price_ghs * quantity
    
    message = f"""
📦 *{product_title}*

💰 *Price:* GHS {price_ghs:.2f}/unit
📊 *Quantity:* {quantity} units
💹 *Total:* GHS {total_price:.2f}

📌 *Wholesale Package Includes:*
✓ Original Product
✓ Quality Guarantee
✓ Fast Delivery
✓ Bulk Discount Available

🎯 *Special Offer:*
Buy bulk quantities and get additional discounts!

Ready to order? 📲
- Confirm quantity
- Provide delivery address
- Select payment method

Interested? Click the link above or reply to confirm your order!
    """.strip()
    
    return message


def validate_1688_url(url):
    """
    Validate if URL is from 1688 domain
    
    Args:
        url (str): URL to validate
        
    Returns:
        bool: True if valid 1688 URL
    """
    return '1688.com' in url.lower() or '1688' in url


def create_product_slug(title):
    """
    Create URL-friendly slug from product title
    
    Args:
        title (str): Product title
        
    Returns:
        str: URL-friendly slug
    """
    # Convert to lowercase
    slug = title.lower()
    
    # Remove special characters
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Limit length
    slug = slug[:50].rstrip('-')
    
    return slug


def estimate_profit(price_rmb, profit_margin_percent=40, quantity=1):
    """
    Estimate profit for a product
    
    Args:
        price_rmb (float): RMB price
        profit_margin_percent (float): Profit margin
        quantity (int): Units to sell
        
    Returns:
        dict: Profit analysis
    """
    conversion = convert_rmb_to_ghs(price_rmb, profit_margin_percent)
    
    if not conversion['success']:
        return conversion
    
    data = conversion['data']
    profit_per_unit = data['profit_per_unit']
    total_profit = profit_per_unit * quantity
    
    return {
        'success': True,
        'data': {
            'price_rmb': price_rmb,
            'final_price_ghs': data['final_price_ghs'],
            'profit_per_unit_ghs': profit_per_unit,
            'quantity': quantity,
            'total_profit_ghs': round(total_profit, 2),
            'profit_margin_percent': profit_margin_percent,
            'roi': f"{profit_margin_percent}%"
        }
    }
