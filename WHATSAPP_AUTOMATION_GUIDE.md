# 🤖 WhatsApp Bot & Bulk Import Features

## Overview

BlessedNet now includes two powerful automation features:
1. **Automated WhatsApp Bot** - AI-powered customer service via WhatsApp  
2. **1-Click Bulk Product Import** - Import up to 20 products at once from 1688

---

## 🤖 WhatsApp Bot Automation

### What it does

The WhatsApp bot automatically replies to customer messages with:
- Product recommendations
- Price information
- Order assistance  
- FAQ and support
- Bulk pricing
- Contact information

### Supported Commands

Customers can text these keywords to get instant responses:

| Keyword | Response |
|---------|----------|
| `hello`, `hi`, `greeting` | Main menu |
| `help`, `faq` | Help & FAQ |
| `products`, `search` | Product search guide |
| `order`, `buy`, `checkout` | Order information |
| `bulk`, `bulk discount` | Bulk pricing |
| `contact`, `contact us` | Contact sales team |

### Setup Instructions

#### Step 1: Create Meta Business Account
1. Go to [Facebook Business Manager](https://business.facebook.com)
2. Create/select your business account
3. Go to **Settings > Business Settings**

#### Step 2: Create WhatsApp Business Account
1. In Business Manager, go to **Apps > Apps and Websites**
2. Add **WhatsApp Business App**
3. Complete WhatsApp Business setup

#### Step 3: Generate API Credentials
1. Get **Phone Number ID** from WhatsApp settings
2. Get **Business Account ID** from WhatsApp settings
3. Generate **API Token** from Apps section
4. Create **Verify Token** (any random string - keep it secret!)

#### Step 4: Configure Environment Variables

Update `.env` with your credentials:

```bash
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_API_TOKEN=your_api_token_here
WHATSAPP_VERIFY_TOKEN=your_verify_token_change_this
WHATSAPP_BUSINESS_PHONE=233xxxxxxxxx  # Your WhatsApp number
```

#### Step 5: Set Webhook URL

1. In Meta App Manager, go to **WhatsApp > Configuration**
2. Set **Webhook URL** to: `https://yourdomain.com/api/whatsapp/webhook`
3. Set **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN`
4. Click **Verify and Save**

#### Step 6: Subscribe to Messages

In App Roles, enable:
- `messages` - To receive messages
- `message_status` - To track delivery

### Webhook Format (What Meta Sends)

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "233123456789",
          "id": "message_id",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hello!"
          }
        }]
      }
    }]
  }]
}
```

### Auto-Reply Examples

**Customer:** "hello"  
**Bot Response:**
```
🎉 Welcome to BlessedNet Wholesale Hub!

What can we help you with?

1️⃣ 📦 Browse Products
2️⃣ 💰 Bulk Pricing
3️⃣ 🔍 Search Product
4️⃣ 📞 Contact Us
5️⃣ ❓ Help & FAQ
```

**Customer:** "bulk discount"  
**Bot Response:**
```
📦 How to Place Your Order

Step 1: Browse our products
Step 2: Add to cart
Step 3: Checkout with payment
...
[Detailed ordering information]
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot not receiving messages | Check webhook URL is correct and publicly accessible |
| Messages marked as undelivered | Verify API token is valid and has correct permissions |
| Bot sends no reply | Check environment variables are set correctly |
| Webhook fails verification | Verify token must match exactly |

---

## 🚀 1-Click Bulk Product Import

### What it does

Import up to 20 products from 1688 in one click:
- Automatically extracts product data
- Converts RMB to GHS with profit margins
- Creates product SKUs
- Adds product images
- Sets stock quantities

### Access

**Admin Dashboard** → **Products** → **1688 Product Importer** → **Bulk Import Tab**

### Usage Steps

1. **Prepare URLs**
   ```
   https://www.1688.com/offer/12345...
   https://www.1688.com/offer/67890...
   https://www.1688.com/offer/11111...
   ```

2. **Set Profit Margin**
   - Recommended: 30-50% for wholesale
   - Default: 40%

3. **Click "Start Bulk Import"**
   - Takes 30-60 seconds
   - Processes all URLs in parallel

4. **Review Results**
   - ✅ Successful imports
   - ❌ Failed URLs (if any)

### Bulk Import Process

```
1. Extract 1688 product data
   ├─ Title
   ├─ Price (RMB)
   ├─ Images
   └─ Category

2. Convert pricing
   ├─ RMB → GHS exchange rate
   ├─ Add shipping cost (~5 GHS)
   ├─ Add profit margin
   └─ Round pricing

3. Generate SKU
   ├─ Slug from product title
   └─ Timestamp for uniqueness

4. Create product
   ├─ Save to database
   ├─ Link images
   ├─ Set stock quantity
   └─ Mark as imported

5. Return results
   ├─ Success count
   ├─ Failed count
   └─ Download CSV (optional)
```

### Bulk Import Limits

- Maximum 20 products per batch
- Maximum 5 requests per minute
- Timeout: 5 minutes per import

### Pricing Example

```
1688 Price: ¥100
Exchange Rate: 1 RMB = 0.55 GHS
Base Price: GHS 55

Shipping: GHS 5
Subtotal: GHS 60

Profit Margin: 40%
Final Price: GHS 84
Profit: GHS 24 per unit
```

### API Endpoints

#### Preview Single Product
```bash
POST /api/import/preview
{
  "product_url": "https://www.1688.com/...",
  "profit_margin_percent": 40
}
```

#### Import Single Product
```bash
POST /api/import/product
{
  "product_url": "...",
  "product_title": "...",
  "price_ghs": 299.99,
  "images": ["url1", "url2"],
  "category": "wholesale",
  "profit_margin_percent": 40,
  "stock_quantity": 50,
  "is_featured": false
}
```

#### Bulk Import
```bash
POST /api/import/batch
{
  "products": [
    {
      "product_url": "...",
      "profit_margin_percent": 40
    },
    {
      "product_url": "...",
      "profit_margin_percent": 40
    }
  ]
}
```

### Bulk Import Results

```json
{
  "successful": [
    {
      "product": { 
        "id": 1,
        "name": "Product Name",
        ...
      },
      "sku": "IMP-product-name-1234567890",
      "whatsapp_message": "..."
    }
  ],
  "failed": [
    {
      "index": 0,
      "url": "https://...",
      "error": "Invalid URL or price not found"
    }
  ]
}
```

---

## 🔗 Integration Points

### WhatsApp ↔ Checkout Flow

When customer texts product inquiry:
1. Bot provides product link
2. Customer clicks link
3. Directs to product page
4. Customer can add to cart
5. Checkout with Paystack

### Import ↔ Inventory

When product is imported:
1. Added to product database
2. Stock quantity tracked
3. Automatically available for sale
4. WhatsApp bot can recommend

### Bot ↔ Products

Bot can:
- List featured products
- Send product images
- Quote bulk pricing
- Handle ordertracking

---

## 📊 Monitoring & Analytics

### Track Imports
```bash
# View import history
SELECT * FROM products WHERE source_url IS NOT NULL
ORDER BY created_at DESC;
```

### Track WhatsApp Messages
- Enable logging in `.env`
- Check `logs/whatsapp.log`
- Monitor message delivery status

---

## ✅ Security Checklist

- [ ] WhatsApp API token is in `.env` (not in code)
- [ ] Webhook verify token is changed from default
- [ ] Webhook URL uses HTTPS
- [ ] Rate limiting enabled on `/api/whatsapp`
- [ ] Message validation checks are in place
- [ ] Admin-only import routes are protected
- [ ] API tokens are rotated regularly

---

## 🐛 Common Issues

### WhatsApp Bot

**Bot not replying**
- Check webhook logs: `tail -f logs/whatsapp.log`
- Verify phone number format: must include country code
- Check verify token matches exactly

**Webhook fails verification**
- Error: "Invalid verify token"
- Solution: Ensure `WHATSAPP_VERIFY_TOKEN` matches in Meta
- Try refreshing Meta app configuration

**Messages not marked as read**
- This is optional - bot will still process messages
- May improve delivery on retry

### Bulk Import

**"Maximum 20 products per batch"**
- Split into multiple batches
- Each batch will be imported separately

**"Invalid 1688 URL"**
- Must be from `1688.com` domain
- Must include product ID
- Example: `https://www.1688.com/offer/123456.html`

**"Failed to extract product data"**
- 1688 page structure may have changed
- Try single import first to preview
- Contact support if persists

---

## 🚀 Getting Started

### Quick Start

**1. Configure WhatsApp (5 mins)**
```bash
# In .env file
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
WHATSAPP_API_TOKEN=your_token_here
WHATSAPP_VERIFY_TOKEN=your_token_here
```

**2. Start the backend**
```bash
cd BACKEND
python app.py
```

**3. Test webhook**
```bash
curl -X GET "http://localhost:5000/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_token_here"
```

**4. Start bulk import**
- Go to Admin → Import
- Switch to "Bulk Import" tab
- Paste 1688 URLs
- Click "Start Bulk Import"

---

## 📚 Resources

- [Meta WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [1688.com](https://www.1688.com)
- [Paystack Ghana Integration](https://paystack.com)

---

## 📞 Support

For issues or questions:
1. Check logs: `BACKEND/logs/`
2. Review this guide
3. Contact development team

---

**Last Updated:** April 5, 2026  
**Version:** 1.0
