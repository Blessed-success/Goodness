# 1688 Product Import - Quick Reference

**Semi-automatic product import system for dropshipping**

---

## Quick Start

### 1. Get Your Admin Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blessednet.com",
    "password": "your_password"
  }'
```

Copy the `access_token` from response.

### 2. Preview a 1688 Product

```bash
curl -X POST http://localhost:5000/api/import/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_url": "https://www.1688.com/offer/123456789.html",
    "profit_margin_percent": 40
  }'
```

### 3. Import to Store

```bash
curl -X POST http://localhost:5000/api/import/product \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_title": "Product Name",
    "price_ghs": 45.50,
    "images": ["https://...jpg"],
    "category": "Electronics",
    "profit_margin_percent": 40,
    "stock_quantity": 10
  }'
```

---

## API Endpoints

### Preview (No Save)
```
POST /api/import/preview
Headers: Authorization: Bearer TOKEN
Body: { product_url, profit_margin_percent }
```

### Import Single Product (Admin)
```
POST /api/import/product
Headers: Authorization: Bearer ADMIN_TOKEN
Body: { product_title, price_ghs, images, category, stock_quantity }
```

### Batch Import (Admin)
```
POST /api/import/batch
Headers: Authorization: Bearer ADMIN_TOKEN
Body: { products: [ { product_url, profit_margin_percent } ] }
Max: 20 products per batch
```

### Get Exchange Rate
```
GET /api/import/exchange-rate
No auth required
Returns: { from: "RMB", to: "GHS", rate: 0.55 }
```

### Calculate Profit
```
POST /api/import/profit-calculator
No auth required
Body: { price_rmb, profit_margin_percent, quantity }
Returns: Detailed profit breakdown
```

### Bulk Pricing Tiers
```
POST /api/import/bulk-pricing
No auth required
Body: { price_rmb, profit_margin_percent, quantities: [1,5,10,50] }
Returns: Pricing for each quantity tier
```

---

## Pricing Formula

```
Final Price = (RMB × Exchange Rate + Shipping) × (1 + Margin%)

Example:
¥50 × 0.55 + 5 GHS = GHS 32.50
GHS 32.50 × 1.40 (40% margin) = GHS 45.50
```

---

## Field Reference

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| product_url | string | https://www.1688.com/... | Full 1688 product URL |
| product_title | string | "High Quality Electronics" | Extracted from page |
| price_ghs | float | 45.50 | Final selling price |
| price_rmb | float | 50.00 | Original 1688 price |
| images | array | ["url1", "url2"] | Up to 5 product images |
| category | string | "Electronics" | Product category |
| profit_margin_percent | number | 40 | Profit markup (0-200) |
| stock_quantity | integer | 10 | Initial stock level |
| exchange_rate | float | 0.55 | RMB to GHS rate |
| shipping_cost | float | 5.0 | Estimated shipping per item |

---

## Common Tasks

### 1. Find Out Product Profit
```bash
# Without importing
POST /api/import/profit-calculator
Body: { price_rmb: 50, profit_margin_percent: 40, quantity: 1 }
```

### 2. Import 10 Products Quickly
```bash
# Prepare URLs list
POST /api/import/batch
Body: {
  "products": [
    { "product_url": "url1", "profit_margin_percent": 40 },
    { "product_url": "url2", "profit_margin_percent": 35 }
    // ... up to 20 products
  ]
}
```

### 3. Set Different Margins by Category
```bash
# Electronics: 45%
POST /api/import/preview
Body: {
  "product_url": "...",
  "profit_margin_percent": 45
}

# Clothing: 50%
POST /api/import/preview
Body: {
  "product_url": "...",
  "profit_margin_percent": 50
}
```

### 4. Check Real-Time Exchange Rate
```bash
GET /api/import/exchange-rate
# Returns latest RMB to GHS rate
```

---

## Profit Margin Guidelines

| Category | Margin | Reasoning |
|----------|--------|-----------|
| High-volume items | 25-35% | Competitive market |
| Standard products | 35-50% | Good balance |
| Specialty items | 50-75% | Lower search volume |
| Luxury/premium | 50-100% | High-value items |
| Flash sales | 15-25% | Volume-driven |

---

## Error Handling

### Common Error Responses

```json
{
  "error": "Invalid URL. Must be from 1688.com",
  "status": 400
}
```

```json
{
  "error": "Failed to extract product data",
  "details": "Could not find price on product page",
  "status": 400
}
```

```json
{
  "error": "Admin access required",
  "status": 403
}
```

---

## Workflow Example

### Complete Import Workflow

1. **Search 1688** → Find product you like
2. **Get URL** → Copy from browser address bar
3. **Preview** → POST /import/preview (check details)
4. **Review** → Check pricing, images, description
5. **Adjust Margin** → Set desired profit percentage
6. **Import** → POST /import/product (save to store)
7. **Edit** → Update description, adjust price if needed
8. **Test** → Create test order via WhatsApp

---

## Best Prices to Import

### High-Profit Products (40%+ margin)
- Small electronics (USB, cables, etc.)
- Fashion accessories (belts, bags)
- Home decoration
- Phone cases and screen protectors
- Beauty and skincare

### Good Volume Products (30-40% margin)
- Clothing and apparel
- Shoes and footwear
- Bags and luggage
- Sports equipment
- Power tools

### Avoid Importing
- Heavy items (high shipping cost)
- Products needing certification (electronics safety)
- Counterfeit goods
- Products with unclear images
- Items with no profit after shipping

---

## Performance Tips

1. **Preview before bulk import** - Test 1-2 products first
2. **Use batch import** - Import 5-10 at once for efficiency
3. **Cache exchange rates** - Rates update hourly
4. **Clean product data** - Edit titles and descriptions
5. **Store images locally** - Mirror images to your CDN

---

## Integration with WhatsApp

After importing, each product gets a WhatsApp order message:

```
📦 *Product Name*

💰 *Price:* GHS 45.50/unit
📊 *Quantity:* 1 units
💹 *Total:* GHS 45.50

Ready to order? 📲
```

Customers can click the WhatsApp button on product page to send pre-formatted order!

---

## Support & Help

**Documentation**: See [1688_IMPORT_GUIDE.md](./1688_IMPORT_GUIDE.md)

**API Docs**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

**Rate Limit**: None enforced (but be reasonable - max 20 products per batch)

---

Last updated: April 2026
