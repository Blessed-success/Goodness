# Marketplace Upgrade Guide

This documents the Phase 2 upgrade of Nexus Wholesale Hub from a single-seller storefront into a fuller marketplace: wishlist, product comparison, recently-viewed, customer reviews, in-app notifications, a multi-vendor marketplace, approximate image search, and heuristic personalized recommendations.

No new environment variables are required — every feature here works out of the box with the existing `.env` setup and degrades gracefully (e.g. WhatsApp order-status messages simply don't send if WhatsApp credentials aren't configured, exactly like the existing WhatsApp bot).

---

## Wishlist, Compare, Recently Viewed

- **Wishlist** is server-side and per-account (`WishlistItem` model, `/api/wishlist`), so it follows the user across devices. Toggle it from the heart icon on any product card.
- **Compare** and **Recently Viewed** are deliberately frontend-only (`localStorage`), matching the existing Quick View modal's "no backend dependency needed" pattern from Phase 1. Compare holds up to 4 product IDs; Recently Viewed keeps the last 12 products opened in Quick View. Neither survives a cleared browser storage or a different device — that's an intentional scope tradeoff, not a bug.
- Pages: `/wishlist`, `/compare`.

## Reviews

- One review per user per product (`Review` model) — resubmitting updates your existing review rather than creating a duplicate.
- `Product.rating` and the new `Product.review_count` are recomputed automatically every time a review is created, updated, or deleted. If a product has zero reviews, `rating` keeps whatever value an admin set manually (unchanged from before this upgrade).
- `is_verified_purchase` is computed by checking for a `delivered` order containing that product for that user — it isn't required to leave a review, just shown as a trust signal.
- Submitted from inside the Quick View modal (`ProductReviews` component).

## In-App Notifications

- `Notification` model + `/api/notifications`. A notification is created automatically whenever an order's status changes (both the customer-facing and admin order-status update routes are wired).
- Shown via the bell icon in the header (`NotificationBell`), which polls every 60 seconds while logged in — no websockets, kept dependency-free per this project's existing conventions.
- This finally uses `Order.whatsapp_notification_sent`, a column that existed in the schema since before this upgrade but was never actually set — see the WhatsApp section below.

## Multi-Vendor Marketplace

**Scope note on payments**: there is no Paystack subaccount/split-payment integration. Every sale still runs through the single Nexus Paystack account exactly as before. What's new is a **commission earnings ledger** (`VendorEarning`): at payment-verify time, one row is created per vendor-owned order item recording the gross amount, commission, and net amount owed. Admin reconciles and pays vendors manually (bank transfer, mobile money, etc.) outside the app, then marks the row "paid" at `/admin/vendors` → Earnings Ledger. There is no automated bank payout.

**Flow:**
1. A logged-in customer applies at `/sell` (`POST /api/vendors/apply`) — creates a `Vendor` row with `is_approved = False`.
2. An admin approves them at `/admin/vendors` (sets `is_approved = True`, optionally adjusts `commission_percent`, default 10%).
3. The approved vendor manages their own catalog at `/vendor/dashboard` (Products / Orders / Earnings tabs). Their product creates/edits are automatically scoped to their own `vendor_id` — they cannot touch another vendor's or Nexus's own products, and vice versa (admins can still manage everything).
4. Shoppers browse the vendor's public storefront at `/store/<slug>`, and see "Sold by X" on any vendor product's card/quick-view, linking there.
5. Every existing Nexus-direct product keeps working unchanged — `Product.vendor_id` is nullable, and `null` means sold directly by Nexus (the pre-upgrade behavior).

## Image Search (Approximate, No External AI API)

A deliberate choice: real visual product search needs a paid external vision API (OpenAI Vision, Google Cloud Vision) with its own API key and per-call cost. Rather than depend on that, or fake the feature, this ships a real working pipeline using **average-color similarity**:

- `Product.dominant_color` is computed automatically (via Pillow, `utils/image_analysis.py`) whenever a product's image is set through the normal admin/vendor product create/update flow — no extra step needed going forward.
- Existing products from before this upgrade won't have a color yet; run the one-off backfill once:
  ```bash
  cd BACKEND
  ./venv/Scripts/python.exe scripts/backfill_product_colors.py   # Windows
  # or: python3 scripts/backfill_product_colors.py               # macOS/Linux
  ```
- `POST /api/products/search-by-image` accepts an uploaded photo, computes its dominant color, and ranks up to 300 candidate products by RGB distance, returning the top 20.
- **This matches by color/shape similarity, not by recognizing what's in the photo.** A red mug and a red phone case will match each other. It's a real, working feature — just an honest, lightweight one, per the explicit tradeoff chosen over spending on a vision API.
- Triggered from the camera icon next to the existing text-search and voice-search icons in the header (all three now live in one unified search bar, on both desktop and mobile).

## Heuristic Recommendations

No AI/ML model, no external API — this is intentionally simple:
- **"Recommended For You"** (homepage): looks at the most common category among a shopper's recently-viewed products (from `localStorage`) and shows more from that category. Falls back to featured products if there's no browsing history yet.
- **"You May Also Like"** (Quick View modal): same-category products, excluding the one currently being viewed.

## SEO

- `react-helmet-async` added; `HomePage`, `ProductsPage`, and `StorePage` now set their own `<title>`/meta description instead of sharing one static tag from `index.html`.
- `GET /sitemap.xml` (backend route in `app.py`) generates URLs for the homepage, the products page, every category, every approved vendor store, and up to 1000 recent products.
- `FRONTEND/public/robots.txt` added, pointing crawlers at `/sitemap.xml`.

## WhatsApp Bug Fix

`routes/whatsapp_bot.py` had `WHATSAPP_API_URL` pointed at `graph.instagram.com` instead of `graph.facebook.com` — outbound bot replies would have silently failed even with valid credentials configured. Fixed as part of this upgrade; unrelated to any new feature above.

## New Database Tables / Columns

No migration tool exists in this project (`db.create_all()` only creates missing *tables*, not missing *columns* on tables that already exist). New tables (`wishlist_items`, `reviews`, `notifications`, `vendors`, `vendor_earnings`) are created automatically on next backend startup. New columns on pre-existing tables need a one-time manual `ALTER TABLE` if you're upgrading an existing database rather than starting fresh:

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_id INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_vendor BOOLEAN DEFAULT FALSE;
```
