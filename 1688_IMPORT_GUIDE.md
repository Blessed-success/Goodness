# 1688 Product Import System - User Guide

## Overview

BlessedNet Wholesale Hub includes a **semi-automatic product import system** that allows you to import wholesale products directly from 1688 (Alibaba's B2B platform for China). The system automatically:

- Extracts product details (title, images, price)
- Converts RMB prices to GHS
- Calculates profit margins
- Generates SEO descriptions
- Creates WhatsApp order messages

**Perfect for dropshippers and wholesale retailers!**

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Single Product Import](#single-product-import)
3. [Batch Import](#batch-import)
4. [Profit Calculator](#profit-calculator)
5. [API Endpoints](#api-endpoints)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Admin access to BlessedNet dashboard
- 1688.com account (optional, for research)
- Product URLs from 1688.com

### Access the Import Tool

1. Login to your BlessedNet admin account
2. Navigate to **Admin Dashboard** → **Product Importer**
3. Or use the API directly with your JWT token

---

## Single Product Import

### Step 1: Get the 1688 Product URL

1. Visit [1688.com](https://www.1688.com)
2. Search for your desired product category
3. Copy the product URL from your browser address bar

**Example URL:**
```
https://www.1688.com/offer/123456789.html
```

### Step 2: Preview the Product

1. Paste the URL into the import form
2. Click **"Preview Product"**
3. The system will:
   - Extract product title
   - Retrieve product images
   - Find the price in RMB
   - Generate SEO description

### Step 3: Set Profit Margin

The profit margin is configurable per product:

- **Recommended**: 30-50% for wholesale
- **Conservative**: 20-30% for high volume
- **Premium**: 50-100% for specialty items

**Formula:**
```
Final Price = (RMB Price × Exchange Rate + Shipping) × (1 + Profit Margin %)
```

**Example:**
```
¥50 product:
- Base in GHS: ¥50 × 0.55 = GHS 27.50
- Plus shipping: GHS 27.50 + 5.00 = GHS 32.50
- With 40% margin: GHS 32.50 × 1.40 = GHS 45.50
```

### Step 4: Review Preview

The preview shows:

- ✅ **Product Images** - Up to 5 images extracted
- 💰 **Pricing Breakdown** - Original RMB → Final GHS
- 💹 **Profit Analysis** - Per-unit profit estimation
- 📝 **SEO Description** - Auto-generated description
- 💬 **WhatsApp Message** - Pre-formatted order message

### Step 5: Import to Catalog

Click **"✨ Import to Store"** to:

1. Save product to your database
2. Create unique SKU (Import-[name]-[timestamp])
3. Set stock quantity (default: 10 units)
4. Generate WhatsApp order message

---

## Batch Import

### Import Multiple Products at Once

Perfect for scaling your store quickly!

**API Endpoint:**
```bash
POST /api/import/batch
```

**Request Example:**
```json
{
  "products": [
    {
      "product_url": "https://www.1688.com/offer/123456789.html",
      "profit_margin_percent": 40
    },
    {
      "product_url": "https://www.1688.com/offer/987654321.html",
      "profit_margin_percent": 35
    }
  ]
}
```

**Limits:**
- Maximum 20 products per batch
- Takes 10-30 seconds depending on network
- Shows success/failure for each product

**Response Example:**
```json
{
  "message": "Batch import completed: 2 successful, 0 failed",
  "data": {
    "successful": [
      {
        "index": 0,
        "title": "Product Name",
        "sku": "IMP-product-name-1712358400",
        "price_ghs": 45.50,
        "id": 42
      }
    ],
    "failed": []
  }
}
```

---

## Profit Calculator

### Calculate Profit Before Importing

Use the Profit Calculator to:

- Estimate ROI for different products
- Test various profit margins
- Compare unit pricing vs bulk pricing
- Plan inventory investment

### Calculator Inputs

1. **1688 Price (RMB)** - Product price in Chinese Yuan
2. **Profit Margin (%)** - Your desired markup percentage
3. **Quantity** - Number of units to sell

### Calculator Outputs

| Output | Description |
|--------|-------------|
| Original Price | Price from 1688 in RMB |
| Final Price | Calculated GHS price per unit |
| Profit per Unit | Your profit per sale |
| Total Profit | Profit for quantity × units |
| ROI | Return on Investment percentage |

### Example Calculation

**Input:**
- 1688 Price: ¥50
- Profit Margin: 40%
- Quantity: 100 units

**Output:**
```
Original Price:      ¥50
Final Price (unit):  GHS 45.50
Profit per Unit:     GHS 13.00
Total Profit:        GHS 1,300.00
ROI:                 40% (plus shipping)
```

---

## API Endpoints

### 1. Preview Product (Preview Before Importing)

**Endpoint:**
```
POST /api/import/preview
```

**Authentication:** Required (JWT Token)

**Request:**
```json
{
  "product_url": "https://www.1688.com/offer/123456789.html",
  "profit_margin_percent": 40
}
```

**Response:**
```json
{
  "message": "Product preview generated successfully",
  "data": {
    "product": {
      "title": "High Quality Electronics",
      "description": "SEO-optimized description...",
      "category": "Electronics",
      "original_price_rmb": 50,
      "images": ["url1", "url2", "url3"],
      "source_url": "https://..."
    },
    "pricing": {
      "price_rmb": 50,
      "exchange_rate": 0.55,
      "price_ghs_base": 27.50,
      "shipping_cost": 5.0,
      "subtotal": 32.50,
      "profit_margin_percent": 40,
      "final_price_ghs": 45.50,
      "profit_per_unit": 13.00
    },
    "profit_estimate": {
      "price_rmb": 50,
      "final_price_ghs": 45.50,
      "profit_per_unit_ghs": 13.00,
      "quantity": 1,
      "total_profit_ghs": 13.00,
      "profit_margin_percent": 40,
      "roi": "40%"
    },
    "whatsapp_message": "...formatted message...",
    "ready_to_import": true
  }
}
```

### 2. Import Single Product

**Endpoint:**
```
POST /api/import/product
```

**Authentication:** Required (Admin only)

**Request:**
```json
{
  "product_title": "High Quality Electronics",
  "price_ghs": 45.50,
  "images": ["url1", "url2"],
  "category": "Electronics",
  "description": "Auto-generated or custom...",
  "profit_margin_percent": 40,
  "stock_quantity": 10
}
```

**Response:**
```json
{
  "message": "Product imported successfully",
  "data": {
    "product": { /* Full product object */ },
    "sku": "IMP-electronics-1712358400",
    "whatsapp_message": "...formatted message...",
    "import_summary": {
      "title": "High Quality Electronics",
      "price_ghs": 45.50,
      "category": "Electronics",
      "stock": 10,
      "images_imported": 2
    }
  }
}
```

### 3. Batch Import Products

**Endpoint:**
```
POST /api/import/batch
```

**Authentication:** Required (Admin only)

**Request:**
```json
{
  "products": [
    {
      "product_url": "https://www.1688.com/offer/123.html",
      "profit_margin_percent": 40
    }
  ]
}
```

### 4. Get Exchange Rate

**Endpoint:**
```
GET /api/import/exchange-rate
```

**No Authentication Required**

**Response:**
```json
{
  "message": "Exchange rate retrieved",
  "data": {
    "from": "RMB",
    "to": "GHS",
    "rate": 0.55,
    "timestamp": "2024-01-20T15:30:00",
    "example": "1 RMB = 0.55 GHS"
  }
}
```

### 5. Profit Calculator

**Endpoint:**
```
POST /api/import/profit-calculator
```

**No Authentication Required**

**Request:**
```json
{
  "price_rmb": 50,
  "profit_margin_percent": 40,
  "quantity": 1
}
```

### 6. Bulk Pricing

**Endpoint:**
```
POST /api/import/bulk-pricing
```

**No Authentication Required**

**Request:**
```json
{
  "price_rmb": 50,
  "profit_margin_percent": 40,
  "quantities": [1, 5, 10, 50, 100]
}
```

**Response:**
```json
{
  "message": "Bulk pricing calculated successfully",
  "data": {
    "base_price_rmb": 50,
    "profit_margin_percent": 40,
    "pricing_tiers": [
      {
        "quantity": 1,
        "unit_price_ghs": 45.50,
        "total_price_ghs": 45.50,
        "profit_per_unit": 13.00
      },
      {
        "quantity": 5,
        "unit_price_ghs": 45.50,
        "total_price_ghs": 227.50,
        "profit_per_unit": 13.00
      }
    ]
  }
}
```

---

## Best Practices

### For Dropshipping Success

#### 1. Price Research
- ✅ Use the Profit Calculator to test different margins
- ✅ Research competitor pricing on Google Shopping
- ✅ Consider local market prices in Ghana
- ❌ Don't accept all extracted prices blindly

#### 2. Product Selection
- ✅ Choose products with 30-50% profit margin
- ✅ Select items with good images (4+ photos)
- ✅ Verify product titles are in English
- ✅ Check that descriptions are auto-generated correctly
- ❌ Avoid very cheap items (low profit, high shipping %)

#### 3. Image Management
- ✅ System extracts up to 5 images automatically
- ✅ Replace with your own photos if possible
- ✅ Ensure images are clear and high-quality
- ✅ Add lifestyle/usage photos for context

#### 4. SEO Optimization
- ✅ Edit auto-generated descriptions
- ✅ Add keywords relevant to your market
- ✅ Include dimensions and specifications
- ✅ Add shipping info and warranty details

#### 5. Pricing Strategy
- ✅ Import similar products in same category
- ✅ Maintain consistent pricing structure
- ✅ Offer bulk discounts via /api/import/bulk-pricing
- ✅ Adjust margins based on competition

#### 6. Testing
- ✅ Start with 5-10 products
- ✅ Monitor sales and feedback
- ✅ Adjust prices and descriptions based on data
- ✅ Scale gradually

### Exchange Rate Updates

The system fetches live exchange rates from [exchangerate-api.com](https://exchangerate-api.com):

- **Updates**: Every time you preview/import (or cached for 1 hour)
- **Accuracy**: Real-time market rates
- **Fallback**: Uses default 1 RMB = 0.55 GHS if API unavailable

---

## Troubleshooting

### Problem: "Failed to extract product data"

**Causes:**
- Product page doesn't exist (404)
- Cloudflare blocking the request
- URL is not publicly accessible
- Network timeout

**Solutions:**
- ✅ Copy fresh URL from 1688.com
- ✅ Check product is in stock
- ✅ Try different product
- ✅ Wait 30 seconds and retry

### Problem: "Price not found"

**Causes:**
- Price hidden behind login
- Price fetches via JavaScript
- Unusual price format
- Flash sale or special pricing

**Solutions:**
- ✅ Manually enter price using Profit Calculator
- ✅ Try different product
- ✅ Use bulk pricing endpoint instead

### Problem: "Images not extracted"

**Causes:**
- Images load via JavaScript
- Images hosted on external server
- Product has no images
- CORS blocking

**Solutions:**
- ✅ Add images manually to the product
- ✅ Download images and upload to CDN
- ✅ Use product description instead

### Problem: "Exchange rate endpoint error"

**Causes:**
- API service temporarily unavailable
- Network connectivity issue
- API rate limit exceeded

**Solutions:**
- ✅ System will use default rate (1 RMB = 0.55 GHS)
- ✅ Manually update rate if needed
- ✅ Retry after 1 minute

---

## Tips for Maximizing Profit

### 1. Sourcing Good Deals
- Browse categories with high demand
- Filter by seller rating (4.8+ stars)
- Check MOQ (Minimum Order Quantity)
- Verify shipping time to Ghana

### 2. Setting Competitive Prices
- Monitor local market prices
- Use Google Shopping to research
- Set prices 10-20% above cost
- Offer occasional discounts

### 3. Optimizing Descriptions
- Match product to local keywords
- Include WhatsApp order CTA
- Add shipping and return policy
- Highlight quality and authenticity

### 4. Marketing Imported Products
- Share on WhatsApp Business
- Promote flash sales
- Cross-sell related items
- Get customer reviews

### 5. Scaling Your Business
- Batch import 5-10 products weekly
- Build product categories
- Create collections/bundles
- Offer wholesale pricing

---

## Security & Safety

### Data Protection
- ✅ Only admin can import products
- ✅ API requires JWT authentication
- ✅ Inputs are sanitized and validated
- ✅ No customer data is exposed

### 1688 Terms of Service
- ✅ Product import is allowed
- ✅ Resale on other platforms is permitted
- ✅ You must comply with local laws
- ⚠️ Some products may have intellectual property restrictions

---

## FAQ

### Q: Is product import legal?
**A:** Yes! Importing and reselling products from 1688 is legal for dropshipping and wholesale business. However, ensure you comply with:
- Local trade laws in Ghana
- Intellectual property (avoid counterfeit products)
- Import/export regulations
- Consumer protection laws

### Q: Why is my profit margin lower than expected?
**A:** Several factors affect final price:
1. Exchange rate fluctuations
2. Estimated shipping costs (GHS 5 per item)
3. Platform fees/taxes not included
4. Profit margin percentage calculation

### Q: Can I import products without images?
**A:** Yes, but not recommended. Product images are critical for:
- Customer trust
- SEO rankings
- Conversion rates
- Social media sharing

### Q: What if the extracted description is wrong?
**A:** You can:
1. Edit the description after import
2. Write a custom description before importing
3. Use a different product with better extracted data

### Q: How often are exchange rates updated?
**A:** The system fetches live rates each time you preview/import. Rates are cached for 1 hour for performance.

### Q: Can I import from other marketplaces?
**A:** Currently, the import system is optimized for 1688.com. Other sources may not work due to different page structures.

---

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Documentation](./API_DOCUMENTATION.md)
3. Contact admin support via WhatsApp

---

**Last Updated:** April 2026  
**Version:** 1.0.0  
**Status:** Production-Ready
