# 1688 Product Import System - Technical Documentation

## Architecture Overview

The 1688 import system consists of three main components:

### 1. **Backend (Flask)**
- Routes: `routes/import.py` - API endpoints
- Utils: `utils/import_helper.py` - Web scraping and conversion logic
- Integration: `app.py` - Blueprint registration

### 2. **Frontend (React)**
- Pages: `src/pages/ImportPage.js` - Admin import interface
- Integration: Product listing automatically supports imported items

### 3. **Database (PostgreSQL)**
- Products table extended with import metadata
- SKU pattern: `IMP-[slug]-[timestamp]`

---

## Component Details

### Backend: routes/import.py

#### Endpoints

```python
@import_bp.route('/preview', methods=['POST'])
def preview_import()
    """Preview product before importing (no save)"""
    # No admin required - anyone can preview

@import_bp.route('/product', methods=['POST'])
def import_product()
    """Import single product to database (admin only)"""
    # Admin required - returns full product object

@import_bp.route('/batch', methods=['POST'])
def batch_import()
    """Batch import up to 20 products (admin only)"""
    # Processes array of products
    # Returns success/failure breakdown

@import_bp.route('/exchange-rate', methods=['GET'])
def get_exchange_rate()
    """Get current RMB to GHS rate"""
    # Public endpoint, cached internally

@import_bp.route('/profit-calculator', methods=['POST'])
def calculate_profit()
    """Calculate profit for given inputs"""
    # Public endpoint, no auth required

@import_bp.route('/bulk-pricing', methods=['POST'])
def bulk_pricing()
    """Calculate pricing for different quantities"""
    # Public endpoint for pricing analysis
```

---

### Backend: utils/import_helper.py

#### Core Functions

```python
def extract_1688_product_data(product_url: str) -> dict
    """
    Web scraping function using BeautifulSoup
    
    Returns:
    {
        'success': bool,
        'data': {
            'title': str,
            'price_rmb': float,
            'images': list,
            'category': str,
            'source_url': str
        } or 'error': str
    }
    """

def convert_rmb_to_ghs(price_rmb: float, profit_margin_percent: float = 40) -> dict
    """
    Currency conversion + profit margin calculation
    
    Factors:
    - Live exchange rate (cached)
    - Estimated shipping: GHS 5.0 per item
    - Profit margin: configurable 0-200%
    
    Returns pricing breakdown
    """

def generate_seo_description(
    product_title: str, 
    category: str = 'Wholesale',
    word_count: int = 100
) -> str
    """
    Template-based SEO description generation
    
    Includes:
    - Primary keyword from title
    - Category-specific content
    - Call-to-action for bulk orders
    - Quality assurances
    """

def generate_whatsapp_description(
    product_title: str,
    price_ghs: float,
    quantity: int = 1
) -> str
    """
    WhatsApp-formatted order message
    
    Includes:
    - Product name and price
    - Bulk discount offer
    - Order instructions
    - Contact CTA
    """

def validate_1688_url(url: str) -> bool
    """Check if URL is from 1688.com domain"""

def create_product_slug(title: str) -> str
    """Generate URL-friendly slug from product title
    
    Process:
    1. Lowercase
    2. Remove special characters
    3. Replace spaces with hyphens
    4. Limit to 50 chars
    """

def estimate_profit(
    price_rmb: float,
    profit_margin_percent: float = 40,
    quantity: int = 1
) -> dict
    """Comprehensive profit analysis including ROI"""

def get_current_exchange_rate() -> float
    """
    Fetch live RMB to GHS exchange rate
    
    Sources:
    1. Primary: exchangerate-api.com (free tier)
    2. Fallback: Static rate 0.55
    3. Caching: 1 hour
    """
```

---

## Data Flow Overview

```
1688 Product URL
        ↓
        └─→ [validate_1688_url]
            ├─ Valid? Continue
            └─ Invalid? Return error
        ↓
[extract_1688_product_data]
    │
    ├─→ GET request with headers
    ├─→ Parse HTML with BeautifulSoup
    ├─→ Extract: title, price, images, category
    └─→ Return product data
        ↓
[convert_rmb_to_ghs]
    │
    ├─→ Get current exchange rate
    ├─→ Calculate base price in GHS
    ├─→ Add shipping cost
    ├─→ Apply profit margin
    └─→ Return pricing breakdown
        ↓
[generate_seo_description]
    │
    ├─→ Extract keywords from title
    ├─→ Apply template
    └─→ Return description
        ↓
[generate_whatsapp_description]
    │
    ├─→ Format product info
    ├─→ Add pricing and CTA
    └─→ Return WhatsApp message
        ↓
[preview_import endpoint]
    │
    └─→ Return all above to frontend for review
        ↓
[import_product endpoint]
    │
    ├─→ Validate input
    ├─→ Check for duplicates
    ├─→ Create Product model
    ├─→ Save to database
    └─→ Return success with SKU
```

---

## Customization Guide

### 1. Change Exchange Rate Source

**File**: `utils/import_helper.py`

```python
def get_current_exchange_rate():
    """Replace API call"""
    
    # Option 1: Use different API
    response = requests.get('https://api.currencyapi.com/v3/latest...')
    
    # Option 2: Use your own rate
    return 0.60  # Fixed rate
    
    # Option 3: Database-stored rates
    rate = ExchangeRate.query.latest()
    return rate.rmb_to_ghs
```

### 2. Change Profit Margin Logic

**File**: `utils/import_helper.py`

```python
def convert_rmb_to_ghs(price_rmb, profit_margin_percent=40):
    """Modify calculation"""
    
    # Add platform fees
    platform_fee_percent = 5
    
    # Add custom shipping by category
    if category == 'Electronics':
        shipping = 8.0  # Higher for fragile
    else:
        shipping = 5.0
    
    # Custom rounding
    final_price = round(price_ghs, 1)  # Round to nearest 0.10
```

### 3. Improve Product Scraping

**File**: `utils/import_helper.py`

```python
def extract_1688_product_data(product_url):
    """Add more selectors and validation"""
    
    # Add more CSS selectors for title
    title_selectors = [
        'h1.title',
        'h1[data-testid="pc-title"]',
        '.subject-title',
        '.offer-title',
        'h1'
    ]
    
    # Add Selenium for JavaScript-rendered content
    from selenium import webdriver
    driver = webdriver.Chrome()
    driver.get(product_url)
    # Wait for dynamic content...
```

### 4. Add Image Processing

After extracting images:

```python
# Download and store locally
import requests
from PIL import Image
import io

def process_images(image_urls):
    processed = []
    for url in image_urls:
        response = requests.get(url)
        img = Image.open(io.BytesIO(response.content))
        
        # Resize
        img.thumbnail((800, 800))
        
        # Upload to CDN or local storage
        filename = f"product_{uuid.uuid4()}.jpg"
        processed.append(filename)
    
    return processed
```

### 5. Create Admin Dashboard Component

**File**: `src/components/AdminImportPanel.js`

```javascript
import React, { useState } from 'react';
import axios from 'axios';

const AdminImportPanel = () => {
  const [imports, setImports] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchImportStats();
  }, []);

  const fetchImportStats = async () => {
    // Track import history
    // Show successful vs failed imports
    // Display profit by product
  };

  return (
    <div>
      {/* Admin dashboard for import management */}
    </div>
  );
};
```

### 6. Add Image Upload Search

Complement the import system with image search:

```python
# In routes/import.py
@import_bp.route('/search-by-image', methods=['POST'])
def search_by_image():
    """Find similar products on 1688 using uploaded image"""
    
    file = request.files['image']
    
    # Option 1: Use 1688 API (requires authentication)
    # Option 2: Use Google Lens / TinEye API
    # Option 3: Use local ML model
    
    # Return list of potential products
```

### 7. Add Bulk Operations

```python
# In routes/import.py
@import_bp.route('/update-margins', methods=['PUT'])
@jwt_required()
def update_margins():
    """Batch update profit margins for imported products"""
    
    products = Product.query.filter(
        Product.sku.startswith('IMP-')
    ).all()
    
    for product in products:
        # Recalculate based on new margin
        product.price = new_price
    
    db.session.commit()
```

---

## Performance Optimization

### 1. Caching Exchange Rates
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@cache.cached(timeout=3600)
def get_current_exchange_rate():
    # Fetch and cache for 1 hour
    pass
```

### 2. Async Batch Processing
```python
from celery import Celery

celery = Celery(app.name)

@celery.task
def import_product_async(product_data):
    # Process in background
    # Send notification when complete
    pass
```

### 3. Image Optimization
```python
def optimize_images(image_urls):
    """Download, resize, and optimize images"""
    optimized = []
    
    for url in image_urls:
        img = requests.get(url)
        # Compression
        img.save('optimized.jpg', quality=85)
        # Upload to CDN
        optimized.append(cdn_url)
    
    return optimized
```

---

## Error Handling & Validation

### Input Validation

```python
# In routes/import.py
def validate_import_input(data):
    errors = []
    
    if not data.get('product_title'):
        errors.append('Title required')
    
    if float(data.get('price_ghs', 0)) <= 0:
        errors.append('Invalid price')
    
    if len(data.get('images', [])) == 0:
        errors.append('At least 1 image required')
    
    return errors
```

### Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@import_bp.route('/batch', methods=['POST'])
@limiter.limit("10 per minute")
def batch_import():
    # Prevent abuse
    pass
```

---

## Testing

### Unit Tests

```python
# tests/test_import_helper.py

def test_validate_1688_url():
    assert validate_1688_url('https://www.1688.com/offer/123.html')
    assert not validate_1688_url('https://example.com')

def test_convert_rmb_to_ghs():
    result = convert_rmb_to_ghs(50, 40)
    assert result['success']
    assert result['data']['final_price_ghs'] == 45.50

def test_create_product_slug():
    assert create_product_slug('High Quality Electronics') == 'high-quality-electronics'
```

### Integration Tests

```python
# tests/test_import_routes.py

def test_preview_product(client, auth_token):
    response = client.post('/api/import/preview',
        json={
            'product_url': 'https://www.1688.com/...',
            'profit_margin_percent': 40
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
    assert 'product' in response.json['data']
```

---

## Security Considerations

### 1. Input Validation
- Always validate product URLs
- Sanitize extracted text
- Validate prices > 0
- Limit batch size (max 20)

### 2. Rate Limiting
- Limit preview requests per IP
- Throttle batch imports
- Monitor API usage

### 3. Authentication
- Preview: Authenticated users only
- Import: Admin only
- Calculator: Public (no data saved)

### 4. External API Calls
- Timeout: 10 seconds max
- Error handling for slow APIs
- Fallback values
- No credential exposure

---

## Monitoring & Logging

```python
import logging

logger = logging.getLogger(__name__)

@import_bp.route('/product', methods=['POST'])
def import_product():
    try:
        # Process product
        logger.info(f'Product imported: {product.sku}')
    except Exception as e:
        logger.error(f'Import failed: {str(e)}')
        # Send alert
```

---

## Future Enhancements

1. **AI-Powered Descriptions** - Use GPT to generate descriptions
2. **Image Recognition** - Detect product type and category
3. **Competitor Pricing** - Automatically check prices
4. **Inventory Sync** - Auto-adjust stock based on seller
5. **Multi-Marketplace** - Support Alibaba, Taobao, eBay
6. **Advanced Analytics** - Track import ROI and margins
7. **Smart Pricing** - Dynamic pricing based on demand
8. **Bulk Operations** - Update prices, descriptions in bulk

---

## Resources

- BeautifulSoup4 Docs: https://www.crummy.com/software/BeautifulSoup/
- Requests Library: https://docs.python-requests.org/
- Exchange Rate API: https://exchangerate-api.com/docs
- Selenium: https://www.selenium.dev/documentation/

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**For Developers:** Community contributions welcome!
