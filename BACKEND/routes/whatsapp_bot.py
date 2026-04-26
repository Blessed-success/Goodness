"""
WhatsApp Bot Routes for BlessedNet Wholesale Hub
Handles incoming WhatsApp messages and auto-replies with product info
"""

from flask import Blueprint, request, jsonify, current_app
from models import db, Product
from datetime import datetime
import os
import requests
import json

whatsapp_bp = Blueprint('whatsapp', __name__, url_prefix='/api/whatsapp')

# WhatsApp Business API credentials
WHATSAPP_VERIFY_TOKEN = os.getenv('WHATSAPP_VERIFY_TOKEN', 'your_verify_token')
WHATSAPP_API_TOKEN = os.getenv('WHATSAPP_API_TOKEN', 'your_api_token')
WHATSAPP_BUSINESS_ACCOUNT_ID = os.getenv('WHATSAPP_BUSINESS_ACCOUNT_ID', 'your_account_id')
WHATSAPP_PHONE_NUMBER_ID = os.getenv('WHATSAPP_PHONE_NUMBER_ID', 'your_phone_number_id')
WHATSAPP_API_URL = 'https://graph.instagram.com/v18.0'


@whatsapp_bp.route('/webhook', methods=['GET'])
def webhook_verify():
    """
    Webhook verification endpoint for WhatsApp
    WhatsApp will call this with challenge token during setup
    """
    verify_token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')
    mode = request.args.get('hub.mode')

    if mode == 'subscribe' and verify_token == WHATSAPP_VERIFY_TOKEN:
        return challenge, 200
    else:
        return jsonify({'error': 'Invalid verify token'}), 403


@whatsapp_bp.route('/webhook', methods=['POST'])
def webhook_messages():
    """
    Receive and process incoming WhatsApp messages
    Auto-replies with product info and support
    """
    try:
        data = request.get_json()

        if data.get('object') != 'whatsapp_business_account':
            return jsonify({'status': 'ok'}), 200

        # Get message data
        entry = data.get('entry', [{}])[0]
        changes = entry.get('changes', [{}])[0]
        value = changes.get('value', {})
        messages = value.get('messages', [])

        for message in messages:
            sender_id = message.get('from')
            message_id = message.get('id')
            timestamp = message.get('timestamp')
            message_type = message.get('type')  # text, image, document, etc.

            if not sender_id:
                continue

            # Process different message types
            if message_type == 'text':
                text_content = message.get('text', {}).get('body', '').strip().lower()
                handle_text_message(sender_id, text_content, message_id)

            elif message_type == 'image':
                # Handle product inquiries via image
                handle_image_inquiry(sender_id, message.get('image'), message_id)

            elif message_type == 'document':
                # Handle bulk order documents
                handle_document(sender_id, message.get('document'), message_id)

            # Mark message as read
            mark_message_read(message_id)

        return jsonify({'status': 'ok'}), 200

    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'status': 'error', 'error': str(e)}), 500


def handle_text_message(sender_id, text_content, message_id):
    """
    Handle incoming text messages and send appropriate replies
    """
    
    # Check for greeting/help keywords
    greetings = ['hello', 'hi', 'hey', 'greeting', 'help', 'menu', 'start']
    help_keywords = ['help', 'support', 'how', 'guide', 'contact']
    product_keywords = ['product', 'find', 'search', 'price', 'cost', 'bulk', 'order']
    order_keywords = ['order', 'buy', 'purchase', 'checkout', 'cart']

    if any(keyword in text_content for keyword in greetings):
        send_main_menu(sender_id)

    elif any(keyword in text_content for keyword in help_keywords):
        send_help_message(sender_id)

    elif any(keyword in text_content for keyword in product_keywords):
        send_product_search_guide(sender_id)

    elif any(keyword in text_content for keyword in order_keywords):
        send_order_info(sender_id)

    else:
        # Default: ask what they need
        send_default_response(sender_id)


def handle_image_inquiry(sender_id, image_data, message_id):
    """
    Handle product image inquiries
    """
    message = """
👋 *Thank you for your interest!*

We received your image. Our team will analyze it and get back to you shortly with product recommendations and pricing.

In the meantime, here are some quick options:
1️⃣ *Browse our catalog* - Type "products"
2️⃣ *Get bulk pricing* - Type "bulk discount"
3️⃣ *Contact sales team* - Type "contact us"

⏱️ Typical response time: 30 minutes
    """
    send_message(sender_id, message)


def handle_document(sender_id, document_data, message_id):
    """
    Handle bulk order documents
    """
    message = """
📄 *Bulk Order Document Received*

Thank you for submitting your bulk order request! 

Our B2B team will:
✅ Review your requirements
✅ Check stock availability  
✅ Prepare custom quotation
✅ Reach out within 2 hours

Expected turnaround: *2 hours* for quotation

Questions? Type "contact us" to reach our B2B team directly.
    """
    send_message(sender_id, message)


def send_main_menu(sender_id):
    """
    Send main menu with options
    """
    message = """
🎉 *Welcome to BlessedNet Wholesale Hub!*

What can we help you with?

1️⃣ *📦 Browse Products* - Type "products"
2️⃣ *💰 Bulk Pricing* - Type "bulk discount"
3️⃣ *🔍 Search Product* - Type "search [product name]"
4️⃣ *📞 Contact Us* - Type "contact us"
5️⃣ *❓ Help & FAQ* - Type "help"

📱 *Quick Shop*: Visit our store at https://blessednet.local

⏰ *Business Hours*: Mon-Fri 8AM-6PM GMT (Ghana Time)
    """
    send_message(sender_id, message)


def send_help_message(sender_id):
    """
    Send help and FAQ information
    """
    message = """
❓ *FAQ & Support*

*How do I place an order?*
1. Browse products
2. Select quantity
3. Proceed to checkout
4. Choose payment method (Paystack or Manual)

*What payment methods do you accept?*
✓ Paystack (instant)
✓ Bank transfer
✓ Mobile money
✓ Cash on delivery (Accra only)

*Do you offer bulk discounts?*
Yes! Bulk discounts start from 10+ units. Type "bulk discount" for details.

*How long is delivery?*
🏙️ Accra: 1-2 days
🌍 Other regions: 3-5 days
📦 Shipping cost based on location

*Can I request custom products?*
Yes! Type "contact us" to speak with our sourcing team.

Need more help? Reply with your question! 💬
    """
    send_message(sender_id, message)


def send_product_search_guide(sender_id):
    """
    Guide for searching products
    """
    # Get some featured products
    featured = Product.query.filter_by(is_featured=True).limit(3).all()
    
    message = "🛍️ *Product Search Guide*\n\n"
    message += "Type 'search [product name]' to find items.\n\n"
    message += "*Featured Products:*\n\n"
    
    for product in featured:
        discount = f" -{product.discount_percent}%" if product.discount_percent > 0 else ""
        price = f"GHS {product.price:.2f}" if not product.discount_percent else f"GHS {product.discounted_price:.2f}"
        message += f"📦 *{product.name}*\n"
        message += f"   💰 {price}{discount}\n"
        message += f"   ⭐ {product.rating}/5\n\n"
    
    message += "*Popular Categories:*\n"
    message += "• Electronics\n"
    message += "• Fashion & Clothing\n"
    message += "• Home & Garden\n"
    message += "• Beauty & Wellness\n"
    message += "• Sports & Outdoors\n\n"
    message += "Type 'category [name]' to explore! 🔍"
    
    send_message(sender_id, message)


def send_order_info(sender_id):
    """
    Send order information and process
    """
    message = """
📦 *How to Place Your Order*

*Step 1:* Browse our products
• Type "products" to see all items
• Type "search [name]" to find specific items

*Step 2:* Add to cart
• Reply with product name + quantity

*Step 3:* Checkout
• Provide shipping address
• Choose payment method
• Complete payment

*Payment Methods:*
💳 Paystack - Instant confirmation
🏦 Bank Transfer - 10 mins confirmation
📱 Mobile Money - Instant
🚗 Cash on Delivery (Accra only)

*Shipping:*
📍 Accra: 1-2 days (GHS 5)
🌍 Other areas: 3-5 days (GHS 10-20)

*Bulk Orders:*
Order 10+ items? Get special discount!
Type "bulk discount" for pricing.

Ready to order? Type your product name! 🛒
    """
    send_message(sender_id, message)


def send_default_response(sender_id):
    """
    Send default response for unrecognized messages
    """
    message = """
👋 I didn't quite understand that!

Try one of these:
• *products* - Browse our catalog
• *search* - Find a specific item
• *bulk* - Get bulk discounts
• *order* - How to place an order
• *help* - Get assistance
• *contact* - Reach our team

Or just describe what you're looking for! 😊
    """
    send_message(sender_id, message)


def send_message(sender_id, message_text):
    """
    Send WhatsApp message using Meta API
    """
    try:
        headers = {
            'Authorization': f'Bearer {WHATSAPP_API_TOKEN}',
            'Content-Type': 'application/json'
        }

        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': sender_id,
            'type': 'text',
            'text': {
                'preview_url': False,
                'body': message_text
            }
        }

        response = requests.post(
            f'{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages',
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code != 200:
            current_app.logger.error(
                f'WhatsApp send failed: {response.status_code} - {response.text}'
            )

        return response.status_code == 200

    except Exception as e:
        current_app.logger.error(f'Error sending WhatsApp message: {str(e)}')
        return False


def mark_message_read(message_id):
    """
    Mark WhatsApp message as read
    """
    try:
        headers = {
            'Authorization': f'Bearer {WHATSAPP_API_TOKEN}',
            'Content-Type': 'application/json'
        }

        payload = {
            'messaging_product': 'whatsapp',
            'status': 'read',
            'message_id': message_id
        }

        requests.post(
            f'{WHATSAPP_API_URL}/{WHATSAPP_PHONE_NUMBER_ID}/messages',
            headers=headers,
            json=payload,
            timeout=5
        )

    except Exception as e:
        current_app.logger.warning(f'Could not mark message as read: {str(e)}')
