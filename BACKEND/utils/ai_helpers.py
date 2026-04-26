"""AI helper utilities for product content generation and trending analysis."""
import re
from datetime import datetime
from sqlalchemy import func
from models import Product, OrderItem, db

CHINESE_CHAR_PATTERN = re.compile('[\u4e00-\u9fff]')


def contains_chinese(text):
    return bool(text and CHINESE_CHAR_PATTERN.search(text))


def translate_chinese_to_english(text):
    """Naive Chinese to English translation stub for local generation."""
    if not text:
        return text

    if contains_chinese(text):
        # Simple keyword-based translation fallback.
        return text.replace('你好', 'Hello').replace('批量购买', 'bulk purchase').replace('价格', 'price').replace('可以', 'can').replace('给我', 'give me').replace('更好的', 'a better').replace('优惠', 'discount')

    return text


def generate_product_description(title, features, category, product_price, translate=False):
    """Generate sales-focused product description content."""
    if translate:
        title = translate_chinese_to_english(title)
        features = [translate_chinese_to_english(feature) for feature in features]

    simple_title = title.strip()
    feature_summary = ', '.join([f.lower() for f in features if f])
    seo_title = f"{simple_title} - Best Price in Ghana"
    marketing_description = (
        f"{simple_title} is a reliable {category.lower()} choice for Ghana shoppers. "
        f"It comes with {feature_summary} for everyday use and great value at GHS {product_price:.2f}."
    )

    if len(marketing_description) > 220:
        marketing_description = marketing_description[:220].rstrip('.') + '.'

    bullet_features = [f"{feature.strip()}" for feature in features if feature.strip()]
    if not bullet_features:
        bullet_features = [f"Great value for Ghana shoppers", f"Fast delivery in Accra and beyond", f"Easy order and safe payment"]

    whatsapp_caption = (
        f"🔥 Hot Deal! {simple_title} now at GHS {product_price:.2f}. "
        f"Grab yours today while stock lasts. Reply now to order!"
    )

    return {
        'seo_title': seo_title,
        'marketing_description': marketing_description,
        'bullet_features': bullet_features,
        'whatsapp_caption': whatsapp_caption,
        'prompt_used': f"Generate short Ghana-focused product copy for {simple_title} with features {features} and category {category}."
    }


def generate_facebook_ads(title, price, image_url, description, count=4):
    """Generate Facebook ad variations."""
    simple_title = title.strip()
    clean_price = f"GHS {price:.2f}"
    base_headline = f"🔥 Hot Deal in Ghana!"
    cta = "Shop Now"
    variations = []

    for idx in range(count):
        if idx == 0:
            headline = base_headline
            primary_text = (
                f"Get this amazing {simple_title} today for only {clean_price}! Limited stock. Order now and enjoy fast delivery across Ghana."
            )
            hashtags = "#HotDeal #GhanaShopping #ShopNow"
        elif idx == 1:
            headline = f"{simple_title} at GHS {price:.2f}!"
            primary_text = (
                f"Your next favourite {simple_title} is here at a sweet price. Buy now before it sells out!"
            )
            hashtags = "#BestDeal #AccraSale #QuickBuy"
        elif idx == 2:
            headline = f"Save on {simple_title} Today"
            primary_text = (
                f"This {simple_title} is trusted by Ghana shoppers. Secure yours for {clean_price} with fast delivery."
            )
            hashtags = "#SaveNow #GhanaDeals #TrustedBuy"
        else:
            headline = f"Limited Stock: {simple_title}"
            primary_text = (
                f"Act fast! {simple_title} is selling quickly at GHS {price:.2f}. Order today and get it shipped fast."
            )
            hashtags = "#LimitedOffer #GhanaOnline #FastDelivery"

        variations.append({
            'variation_index': idx + 1,
            'headline': headline,
            'primary_text': primary_text,
            'call_to_action': cta,
            'hashtags': hashtags
        })

    return {
        'ads': variations,
        'prompt_used': f"Generate {count} simple Ghana-focused Facebook ad variations for {simple_title} priced {clean_price} with a friendly tone."
    }


def generate_negotiation_messages(product_name, supplier_name, current_price):
    """Generate polite negotiation text in English and simple Chinese."""
    clean_price = f"GHS {current_price:.2f}" if current_price is not None else "the listed price"
    english_message = (
        f"Hello {supplier_name or 'Supplier'},\n"
        f"I am interested in buying {product_name} in bulk for {clean_price}. "
        f"Can you offer a better price for larger orders? Thank you."
    )
    chinese_message = (
        f"你好{supplier_name or ''}，\n"
        f"我想批量采购{product_name}，目前价格是{clean_price}。\n"
        f"请问能给我更好的价格吗？谢谢。"
    )
    bulk_order_message = (
        f"We are ready to place a bulk order for {product_name}. Please send your best offer and minimum order quantity."
    )

    return {
        'english_message': english_message,
        'chinese_message': chinese_message,
        'bulk_order_message': bulk_order_message,
        'prompt_used': f"Generate polite supplier negotiation messages for {product_name} at {clean_price}."
    }


def analyze_trending_products(limit=10):
    """Analyze product performance and identify top winning products."""
    # Build product metrics using order history and product metadata.
    trends = []

    product_stats = db.session.query(
        Product.id,
        Product.name,
        Product.category,
        Product.price,
        Product.rating,
        Product.stock_quantity,
        Product.source_url,
        Product.profit_margin_percent,
        func.sum(OrderItem.quantity).label('orders_count')
    ).outerjoin(OrderItem, OrderItem.product_id == Product.id)
    product_stats = product_stats.group_by(Product.id).all()

    for record in product_stats:
        orders_count = int(record.orders_count or 0)
        score = orders_count * 1.2 + (record.rating or 0) * 10 - (record.price or 0) * 0.05
        if record.profit_margin_percent:
            score += float(record.profit_margin_percent) * 0.2

        margin = record.profit_margin_percent or 40
        suggested_sell = (record.price or 0) * (1 + margin / 100)

        trends.append({
            'product_id': record.id,
            'name': record.name,
            'category': record.category,
            'price': record.price,
            'rating': record.rating,
            'orders_count': orders_count,
            'source_url': record.source_url,
            'profit_margin_percent': margin,
            'score': round(score, 2),
            'suggested_price': round(suggested_sell, 2)
        })

    trends.sort(key=lambda item: item['score'], reverse=True)
    return trends[:limit]


def prepare_supplier_forwarding(order):
    """Generate supplier forwarding messages and dropshipping details."""
    product_lines = []
    for item in order.items:
        product_lines.append(f"- {item.product.name} x{item.quantity} @ GHS {item.price_at_purchase:.2f}")

    product_list = '\n'.join(product_lines)
    whatsapp_message = (
        f"Hello supplier,\n"
        f"Please pack and ship the following dropship order:\n"
        f"Order #{order.order_number}\n"
        f"{product_list}\n"
        f"Ship to: {order.shipping_address}, {order.shipping_city}\n"
        f"Contact: {order.shipping_phone}\n"
        f"Please confirm delivery time and tracking number."
    )

    email_message = (
        f"Subject: New Dropship Order {order.order_number}\n\n"
        f"Please process the following order immediately:\n"
        f"{product_list}\n\n"
        f"Delivery address: {order.shipping_address}, {order.shipping_city}\n"
        f"Phone: {order.shipping_phone}\n\n"
        f"Thank you."
    )

    return {
        'whatsapp_message': whatsapp_message,
        'email_message': email_message,
        'supplier_forward_text': f"Dropship order {order.order_number} should be forwarded to supplier."
    }
