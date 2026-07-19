# Automatic Price Monitoring & Update System

Complete automatic price monitoring system for 1688 imported products with background scheduling, duplicate prevention, and admin dashboard.

## Overview

The system automatically detects when supplier prices change and updates your store prices accordingly:

- ✅ **Automatic Tracking**: Monitor all imported products from 1688
- ✅ **6-Hour Scheduler**: Background job runs every 6 hours
- ✅ **Smart Updates**: Auto-update prices when they DROP, notify admin when they INCREASE
- ✅ **Alert System**: Create PriceAlert records for all changes
- ✅ **Admin Dashboard**: View, approve, and manage price changes
- ✅ **Error Handling**: Graceful handling of failed scraping, duplicate prevention
- ✅ **Production-Ready**: Fast, reliable, and fully automated

---

## Database Schema

### Product Model (Enhanced)
```python
source_url              # 1688 product link (indexed for lookup)
supplier_price_rmb      # Original supplier price in RMB
profit_margin_percent   # Markup percentage (e.g., 40%)
last_scraped_at         # Timestamp of last price check
is_price_monitored      # Boolean flag to enable/disable tracking
```

### PriceAlert Model (New)
```python
product_id              # FK to Product
old_price_rmb           # Previous supplier price
new_price_rmb           # Latest supplier price
old_price_ghs           # Previous store price
new_price_ghs           # New store price (calculated)
price_change_percent    # Percentage change (positive=increase, negative=decrease)
alert_type              # 'price_increase' or 'price_decrease'
status                  # pending, approved, dismissed, auto_updated
auto_update_applied     # Whether system auto-updated price
admin_notes             # Notes from admin decisions
created_at              # Timestamp
updated_at              # Last modification time
```

---

## How It Works

### 1. Automatic Price Check (Every 6 Hours)

**Uses APScheduler to run background job automatically:**

```
Timeline:
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│  Hour 0 │  Hour 6 │ Hour 12 │ Hour 18 │ Hour 24 │
└────┬────┴────┬────┴────┬────┴────┬────┴────┬───┘
     ✅ Check │         │ Check  │         │ Check
              ✅ Check  │        ✅ Check  │
```

### 2. Price Comparison Logic

For each monitored product:

```
1. Fetch latest 1688 product data
   ↓
2. Compare: new_price_rmb vs old_price_rmb
   ↓
3a. NO CHANGE? → Skip (< 0.01 RMB difference)
   ↓
3b. PRICE DROPPED? → Auto-update store price ✅
   ↓
3c. PRICE INCREASED? → Create alert, wait for admin approval
```

### 3. Price Update Calculation

```
RMB Price → GHS Price (with auto-calculated profit margin)

new_price_ghs = new_price_rmb * exchange_rate * (1 + profit_margin_percent/100)
                + shipping_cost + customs_estimate
```

### 4. Alert Decision Logic

```
IF Price Decreased:
  - Auto-update database immediately
  - Mark alert status as "auto_updated"
  - Admin sees dashboard updated in real-time

IF Price Increased:
  - Create pending alert
  - Notify admin
  - Wait for manual approval before updating
  - Prevents customer price hikes without review
```

---

## API Endpoints

### Admin-Only Endpoints

#### Get Monitor Status
```
GET /api/price-monitor/status

Response:
{
  "scheduler": {
    "status": "running",
    "jobs": [
      {
        "id": "price_monitor_6h",
        "name": "Price Monitor (6-hour)",
        "next_run": "2026-04-05T14:30:00"
      }
    ]
  },
  "stats": {
    "total_monitored_products": 42,
    "pending_alerts": 3,
    "price_increases": 2,
    "price_decreases": 1,
    "highest_increase_percent": 15.5,
    "highest_decrease_percent": 8.2
  }
}
```

#### Trigger Manual Price Check
```
POST /api/price-monitor/manual-check

Response:
{
  "products_checked": 42,
  "prices_updated": 4,
  "alerts_created": 6,
  "errors": 0,
  "timestamp": "2026-04-05T12:30:00"
}
```

#### Get Price Alerts
```
GET /api/price-monitor/alerts?status=pending&type=price_increase&page=1&limit=20

Filters:
- status: pending, approved, dismissed, auto_updated
- type: price_increase, price_decrease

Response:
{
  "alerts": [
    {
      "id": 1,
      "product_id": 5,
      "product_name": "Wireless Headphones",
      "old_price_rmb": 89.99,
      "new_price_rmb": 104.50,
      "old_price_ghs": 450.00,
      "new_price_ghs": 524.50,
      "price_change_percent": 16.05,
      "alert_type": "price_increase",
      "status": "pending",
      "auto_update_applied": false,
      "created_at": "2026-04-05T08:15:00"
    }
  ]
}
```

#### Approve Price Alert
```
POST /api/price-monitor/alerts/<alert_id>/approve

Body (optional):
{
  "notes": "Approved - customer demand high"
}

Response:
{
  "message": "Alert approved and price updated",
  "product": { ... }
}
```

#### Dismiss Price Alert
```
POST /api/price-monitor/alerts/<alert_id>/dismiss

Body:
{
  "notes": "Dismissing due to competitor pricing"
}

Response:
{
  "message": "Alert dismissed",
  "data": { ... }
}
```

#### Enable Monitoring
```
POST /api/price-monitor/enable/<product_id>

Response:
{
  "product_id": 5,
  "product_name": "Wireless Headphones",
  "is_price_monitored": true
}
```

#### Get Monitored Products
```
GET /api/price-monitor/products/monitored?page=1&limit=20

Response:
{
  "products": [
    {
      "id": 5,
      "name": "Wireless Headphones",
      "price": 450.00,
      "source_url": "https://www.1688.com/offer/12345",
      "supplier_price_rmb": 89.99,
      "profit_margin_percent": 40,
      "last_scraped_at": "2026-04-05T06:30:00",
      "pending_alerts": 1
    }
  ]
}
```

---

## Usage Guide

### 1. Enable Price Monitoring for a Product

When importing products, automatically set:
```
product.source_url = "1688_url"
product.supplier_price_rmb = 89.99
product.profit_margin_percent = 40  # Default or custom
product.is_price_monitored = True   # Enable tracking
```

Or enable via API:
```javascript
POST /api/price-monitor/enable/5
```

### 2. Check Price Monitor Dashboard

Admin navigates to: `/admin/price-monitor`

Dashboard shows:
- **Pending Alerts**: Items with price changes
- **Monitored Products**: All tracked products with last check time
- **Status**: Scheduler status, next run time, statistics

### 3. Handle Price Alerts

**Price Decreased (Green Alert):**
- System auto-updated price immediately
- Admin sees: ✅ "Auto-updated 2 hours ago"
- Action: No approval needed

**Price Increased (Red Alert):**
- Awaiting admin decision
- Admin can: 
  - ✅ Approve & apply new price
  - ❌ Dismiss & keep old price

### 4. Manual Price Check

Click "Run Price Check Now" button to:
- Immediately check ALL monitored products
- Bypass the 6-hour wait
- Useful after supplier announcements

---

## Configuration

### Scheduler Settings

Edit `BACKEND/utils/scheduler.py`:

```python
# Change interval (default: 6 hours)
IntervalTrigger(hours=6)  # Change to hours=1, hours=12, etc.

# Change misfire grace period (default: 60 seconds)
misfire_grace_time=60  # Allow 1 minute grace
```

### Exchange Rate & Pricing

Located in `BACKEND/utils/import_helper.py`:

```python
def convert_rmb_to_ghs(price_rmb, profit_margin):
    exchange_rate = get_exchange_rate()  # 1 RMB = X GHS
    shipping_cost = 5  # Fixed shipping, adjust as needed
    customs_percent = 0.05  # 5% customs estimate
    
    return price_rmb * exchange_rate * (1 + profit_margin/100) + shipping
```

---

## Error Handling

### Web Scraping Failures
- If 1688 page is unreachable: Skip product, log error
- If price not found: Mark error, try again next cycle
- Failed products don't update or create alerts

### Duplicate Prevention
- Check `source_url` before importing
- Skip if product already exists with same URL
- Prevents duplicate product creation

### Failed Updates
- Database transaction rolls back on error
- Alert remains pending for retry next cycle
- Admin can retry manually via API

---

## Performance Optimization

### Database Indexes
```python
Product.source_url          # Indexed for fast lookup
Product.is_price_monitored  # Indexed for query filtering
PriceAlert.product_id       # Indexed for related lookups
PriceAlert.created_at       # Indexed for time-based queries
```

### Batch Processing
- Check multiple products in parallel (APScheduler handles)
- Limit API calls to prevent rate limiting
- Cache exchange rates (valid for 24 hours)

### Memory Management
- Process products in batches (100 at a time)
- Close database connections after each check
- Clear temporary data after completion

---

## Monitoring & Logs

### Log Locations
```
BACKEND/app.py              # Application logs
BACKEND/utils/price_monitor.py  # Detailed price check logs
BACKEND/utils/scheduler.py      # Scheduler job logs
```

### Log Format
```
2026-04-05 12:30:15 - INFO - Starting automatic price monitoring
2026-04-05 12:30:45 - INFO - Product 5: RMB 89.99 → 104.50 (Change: 16.05%)
2026-04-05 12:31:12 - INFO - Product 5: Auto-updated price to GHS 524.50
2026-04-05 12:35:00 - INFO - Price check complete: 42 checked, 4 updated, 6 alerts
```

### Alert Notifications
```
Admin Dashboard → Alerts tab shows real-time updates
Email/SMS (optional) → Can be added to dismiss/approve actions
```

---

## Integration with Bulk Import

When importing from 1688:

```python
# In BACKEND/routes/bulk_import.py:process_import_task()

product = Product(
    name=translated_title,
    price=final_price_ghs,
    source_url=product_url,              # ← Track source
    supplier_price_rmb=price_rmb,        # ← Store original price
    profit_margin_percent=40,            # ← Set margin
    is_price_monitored=True,             # ← Enable tracking
)
```

---

## Testing

### Manual Test Scenario

1. **Setup**
   - Create product with source_url and supplier_price_rmb
   - Enable monitoring

2. **Trigger Check**
   ```
   POST /api/price-monitor/manual-check
   ```

3. **Verify Results**
   - Check logs: Should show "Product X: RMB A → B"
   - Check dashboard: New alert created
   - Check database: PriceAlert record exists

4. **Test Alert Actions**
   - Approve alert: Price should update
   - Dismiss alert: Status changes to "dismissed"

---

## Troubleshooting

### Scheduler Not Running
```
Issue: Price checks not happening at scheduled times
Solution:
1. Check app logs for initialization errors
2. Verify APScheduler installed: pip install APScheduler==3.10.4
3. Ensure Flask app context available when jobs run
4. Check /api/price-monitor/status endpoint
```

### No Alerts Created
```
Issue: Price checks run but no alerts generated
Solution:
1. Verify products have source_url and supplier_price_rmb
2. Check is_price_monitored flag is True
3. Run manual check to see actual error:
   POST /api/price-monitor/manual-check
4. Review logs for scraping failures
```

### False Positives
```
Issue: Tiny price changes (< 0.01 RMB) creating alerts
Solution: Already handled - comparison has threshold
Other options: Adjust in price_monitor.py line 96
if abs(new_price_rmb - old_price_rmb) < 0.01:
```

---

## Future Enhancements

- **Email Alerts**: Notify admin of price changes via email
- **Webhook Integration**: Connect to external systems
- **Competitor Pricing**: Monitor competitor prices too
- **Price Trends**: Show price history charts
- **Bulk Actions**: Approve/dismiss multiple alerts at once
- **Auto-Pricing Rules**: "Auto-approve drops above X%", "Auto-reject increases"
- **Inventory Sync**: Update stock quantities too
- **SMS Notifications**: Text alerts to admin phone

---

## Support & Debugging

**Enable Debug Logging:**
```python
# In BACKEND/app.py
import logging
logging.basicConfig(level=logging.DEBUG)

# In app initialization
app.logger.setLevel(logging.DEBUG)
```

**Check Scheduler Status:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/price-monitor/status
```

**Force Price Check:**
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/price-monitor/manual-check
```

---

## Summary

This price monitoring system provides:

✅ **Fully Automatic** - No manual intervention needed
✅ **Error Resilient** - Gracefully handles failures
✅ **Admin Control** - Review and approve changes
✅ **Production-Ready** - Fast, reliable, secure
✅ **Easy Integration** - Works with existing import system

The system is now live and ready to automatically track and update prices!
