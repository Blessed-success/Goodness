"""
Payment Routes for Nexus Wholesale Hub
Handles Paystack integration for Ghana payment processing
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from utils.limiter import limiter
from models import db, Order, OrderItem, User, Product, Cart, Vendor, VendorEarning
from datetime import datetime
from utils.security import safe_error_response
from utils.location_validation import is_user_location_active
import requests
import os
import re
from urllib.parse import quote

payment_bp = Blueprint('payment', __name__, url_prefix='/api/payment')
PAYSTACK_BASE_URL = 'https://api.paystack.co'


def get_paystack_secret_key():
    secret_key = current_app.config.get('PAYSTACK_SECRET_KEY')
    if not secret_key:
        raise RuntimeError('Paystack secret key is not configured')
    return secret_key


@payment_bp.route('/initialize', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def initialize_payment():
    """
    Initialize Paystack payment
    
    Request body:
    {
        "order_id": 1,
        "email": "customer@example.com"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        
        # Check if user's location is active
        is_active, region_name, city_name, reason = is_user_location_active(user_id)
        if not is_active:
            return jsonify({
                'error': 'Service not available in your location',
                'reason': reason
            }), 403
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        order_id = data.get('order_id')
        email = data.get('email', '').strip()
        
        if not order_id:
            return jsonify({'error': 'order_id is required'}), 400
        
        if not email:
            return jsonify({'error': 'email is required'}), 400
        
        # Get order
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Verify user owns this order
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if order is already paid
        if order.payment_status == 'completed':
            return jsonify({'error': 'Order already paid'}), 400
        
        # Prepare Paystack payload
        payload = {
            'email': email,
            'amount': int(order.total_amount * 100),  # Paystack expects amount in cents/pesewas
            'metadata': {
                'order_id': order.id,
                'order_number': order.order_number,
                'user_id': user_id
            }
        }
        
        # Send request to Paystack
        secret_key = get_paystack_secret_key()
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f'{PAYSTACK_BASE_URL}/transaction/initialize',
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({
                'error': 'Failed to initialize payment with Paystack',
                'details': response.text
            }), 500
        
        paystack_response = response.json()
        
        if not paystack_response.get('status'):
            return jsonify({
                'error': 'Payment initialization failed',
                'message': paystack_response.get('message', 'Unknown error')
            }), 400
        
        data = paystack_response.get('data', {})
        
        return jsonify({
            'message': 'Payment initialized successfully',
            'data': {
                'authorization_url': data.get('authorization_url'),
                'access_code': data.get('access_code'),
                'reference': data.get('reference'),
                'order_id': order.id,
                'order_number': order.order_number,
                'amount': order.total_amount,
                'currency': 'GHS'
            }
        }), 200
    
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f'Paystack request failed: {str(e)}')
        return jsonify({'error': 'Payment service unavailable. Please try again.'}), 503
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to initialize payment')


@payment_bp.route('/verify', methods=['POST'])
@jwt_required()
@limiter.limit("10 per minute")
def verify_payment():
    """
    Verify Paystack payment
    
    Request body:
    {
        "reference": "paystack_reference_code"
    }
    """
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        reference = data.get('reference', '').strip()
        
        if not reference:
            return jsonify({'error': 'reference is required'}), 400
        
        # Verify with Paystack
        secret_key = get_paystack_secret_key()
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{PAYSTACK_BASE_URL}/transaction/verify/{reference}',
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({
                'error': 'Failed to verify payment with Paystack',
                'details': response.text
            }), 500
        
        paystack_response = response.json()
        
        if not paystack_response.get('status'):
            return jsonify({
                'error': 'Payment verification failed',
                'message': paystack_response.get('message', 'Unknown error')
            }), 400
        
        transaction_data = paystack_response.get('data', {})
        
        # Check if payment was successful
        if transaction_data.get('status') != 'success':
            return jsonify({
                'error': 'Payment transaction was not successful',
                'status': transaction_data.get('status')
            }), 400
        
        # Get order from metadata
        metadata = transaction_data.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if not order_id:
            return jsonify({'error': 'Order information not found in transaction'}), 400
        
        # Update order
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        # Verify user owns this order
        if order.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Ensure transaction amount matches expected order amount and buyer email matches if available
        expected_amount = int(round(order.total_amount * 100))
        transaction_amount = int(transaction_data.get('amount', 0))
        if transaction_amount != expected_amount:
            return jsonify({
                'error': 'Transaction amount does not match order amount',
                'expected': expected_amount,
                'received': transaction_amount
            }), 400

        currency = (transaction_data.get('currency') or '').upper()
        if currency and currency != 'GHS':
            return jsonify({'error': 'Unsupported payment currency'}), 400

        customer_email = transaction_data.get('customer', {}).get('email')
        if customer_email and customer_email.lower() != order.user.email.lower():
            return jsonify({'error': 'Transaction email does not match order email'}), 400

        # Avoid duplicate commits if order is already marked completed
        if order.payment_status == 'completed':
            return jsonify({
                'message': 'Payment already verified',
                'data': {
                    'order_id': order.id,
                    'order_number': order.order_number,
                    'status': order.status,
                    'payment_status': order.payment_status,
                    'amount': transaction_amount / 100,
                    'currency': currency
                }
            }), 200

        # Deduct stock and clear user cart after successful payment
        for item in order.items:
            product = Product.query.get(item.product_id)
            if not product or product.stock_quantity < item.quantity:
                return jsonify({
                    'error': f'Insufficient stock for {item.product.name if item.product else item.product_id}'
                }), 400
            product.stock_quantity -= item.quantity
            db.session.add(product)

            # Marketplace commission ledger: money still flows through this
            # single Paystack account as before — this only records what
            # each vendor is owed for admin to reconcile/pay out manually.
            if product.vendor_id:
                vendor = Vendor.query.get(product.vendor_id)
                if vendor:
                    gross = item.subtotal
                    commission = gross * (vendor.commission_percent / 100)
                    db.session.add(VendorEarning(
                        vendor_id=vendor.id,
                        order_id=order.id,
                        order_item_id=item.id,
                        gross_amount=gross,
                        commission_amount=commission,
                        net_amount=gross - commission,
                    ))

        cart = Cart.query.filter_by(user_id=user_id).first()
        if cart:
            for cart_item in list(cart.items):
                db.session.delete(cart_item)

        order.payment_status = 'completed'
        order.paystack_reference = reference
        order.paid_at = datetime.utcnow()
        order.status = 'processing'
        order.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Payment verified successfully',
            'data': {
                'order_id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'payment_status': order.payment_status,
                'amount': transaction_data.get('amount') / 100,  # Convert pesewas to GHS
                'currency': transaction_data.get('currency')
            }
        }), 200
    
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f'Paystack verification failed: {str(e)}')
        return jsonify({'error': 'Payment verification service unavailable. Please try again.'}), 503
    except Exception as e:
        db.session.rollback()
        current_app.logger.exception(e)
        return safe_error_response('Failed to verify payment')


@payment_bp.route('/verify/<reference>', methods=['GET'])
def verify_payment_get(reference):
    """
    Verify Paystack payment by reference (GET endpoint)
    
    URL parameter:
    - reference: Paystack transaction reference
    """
    try:
        # Verify with Paystack
        secret_key = get_paystack_secret_key()
        headers = {
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            f'{PAYSTACK_BASE_URL}/transaction/verify/{reference}',
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 200:
            return jsonify({
                'error': 'Failed to verify payment with Paystack',
                'details': response.text
            }), 500
        
        paystack_response = response.json()
        
        data = paystack_response.get('data', {})
        
        if data.get('status') == 'success':
            # Log order confirmation
            current_app.logger.info(f"Order confirmed: {data}")
            
            # Send WhatsApp notification
            customer_email = data.get('customer', {}).get('email', 'N/A')
            amount_ghs = data.get('amount', 0) / 100
            message = f"New Order!\nEmail: {customer_email}\nAmount: GHS {amount_ghs}"
            encoded_message = message.replace(' ', '%20').replace('\n', '%0A')
            whatsapp_url = f"https://wa.me/233502683544?text={encoded_message}"
            current_app.logger.info(f"Send WhatsApp: {whatsapp_url}")
            
            return jsonify({
                'message': 'Payment verified & order confirmed',
                'data': data
            }), 200
        else:
            return jsonify({'message': 'Payment not successful'}), 400
    
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f'Paystack verification failed: {str(e)}')
        return jsonify({'error': 'Payment verification service unavailable. Please try again.'}), 503
    except Exception as e:
        current_app.logger.exception(e)
        return jsonify({'error': 'Internal server error'}), 500


@payment_bp.route('/webhook', methods=['POST'])
def paystack_webhook():
    """
    Paystack webhook endpoint for payment notifications
    Securely verify webhook signature before processing
    """
    try:
        # Get request body
        request_body = request.get_data()
        
        # Verify signature
        signature = request.headers.get('X-Paystack-Signature', '')
        
        import hmac
        import hashlib
        
        secret_key = get_paystack_secret_key()
        expected_signature = hmac.new(
            secret_key.encode(),
            request_body,
            hashlib.sha512
        ).hexdigest()
        
        if signature != expected_signature:
            return jsonify({'error': 'Invalid signature'}), 403
        
        # Process webhook
        event_data = request.get_json()
        event = event_data.get('event')
        data = event_data.get('data', {})
        
        if event == 'charge.success':
            # Payment successful
            reference = data.get('reference')
            metadata = data.get('metadata', {})
            order_id = metadata.get('order_id')
            
            if order_id:
                order = Order.query.get(order_id)
                if order:
                    order.payment_status = 'completed'
                    order.paystack_reference = reference
                    order.paid_at = datetime.utcnow()
                    order.status = 'processing'
                    order.updated_at = datetime.utcnow()
                    db.session.commit()
        
        elif event == 'charge.failed':
            # Payment failed
            reference = data.get('reference')
            metadata = data.get('metadata', {})
            order_id = metadata.get('order_id')
            
            if order_id:
                order = Order.query.get(order_id)
                if order:
                    order.payment_status = 'failed'
                    order.paystack_reference = reference
                    order.updated_at = datetime.utcnow()
                    db.session.commit()
        
        return jsonify({'message': 'Webhook processed'}), 200
    
    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Webhook processing failed')


@payment_bp.route('/whatsapp-order', methods=['POST'])
def whatsapp_order():
    """
    Generate a WhatsApp click-to-chat link for a quote request.
    Accepts either a single product (product_id + quantity, used from
    product cards) or a full order (order_id, used from checkout) so the
    generated message always reflects everything the customer is asking
    about instead of only the first item. customer_name/customer_phone are
    optional — this is a low-friction "ask for a quote" flow, not gated
    behind having an account or a saved phone number.

    Request body (one of):
    { "product_id": 1, "quantity": 2, "customer_name": "John Doe", "customer_phone": "+233123456789" }
    { "order_id": 42, "customer_name": "John Doe", "customer_phone": "+233123456789" }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        product_id = data.get('product_id')
        order_id = data.get('order_id')
        quantity = data.get('quantity', 1)
        customer_name = (data.get('customer_name') or '').strip() or 'Guest'
        customer_phone = (data.get('customer_phone') or '').strip() or 'Not provided'

        if not product_id and not order_id:
            return jsonify({'error': 'product_id or order_id is required'}), 400

        if order_id:
            order = Order.query.get(order_id)
            if not order:
                return jsonify({'error': 'Order not found'}), 404

            items = OrderItem.query.filter_by(order_id=order.id).all()
            lines = [
                f"\U0001F4E6 {item.quantity}x {item.product.name if item.product else 'Product'} @ GHS {item.price_at_purchase} = GHS {item.subtotal}"
                for item in items
            ]
            items_block = '\n'.join(lines) if lines else 'No items'
            reference_label = f"Order #{order.order_number}"
            total_price = order.total_amount
        else:
            product = Product.query.get(product_id)
            if not product:
                return jsonify({'error': 'Product not found'}), 404

            total_price = product.discounted_price * quantity
            items_block = (
                f"\U0001F4E6 Product: {product.name}\n"
                f"\U0001F522 Quantity: {quantity}\n"
                f"\U0001F4B0 Unit Price: GHS {product.price}\n"
                f"\U0001F4CA Discount: {product.discount_percent}%"
            )
            reference_label = product.name

        # Get WhatsApp number from environment. WhatsApp's click-to-chat links
        # require digits only (no '+', spaces, or dashes) or the link fails.
        whatsapp_number_raw = os.getenv('WHATSAPP_BUSINESS_PHONE', os.getenv('WHATSAPP_BUSINESS_PHONE_NUMBER', '233xxxxxxxxx'))
        whatsapp_number = re.sub(r'\D', '', whatsapp_number_raw)

        # Prepare message
        message = f"""
Hello Nexus Wholesale Hub! \U0001F44B

I'm interested in:
{items_block}
\U0001F4B9 Total Price: GHS {total_price}

Customer Details:
\U0001F464 Name: {customer_name}
\U0001F4F1 Phone: {customer_phone}

Please provide a quote and delivery details.
        """.strip()

        # quote() percent-encodes everything unsafe for a URL query value
        # (including '&', '#', '%', and non-ASCII characters like names or
        # emoji) — a manual str.replace() on just spaces/newlines let those
        # characters through and silently truncated/corrupted the message.
        whatsapp_url = f"https://api.whatsapp.com/send?phone={whatsapp_number}&text={quote(message)}"

        return jsonify({
            'message': 'WhatsApp order message generated',
            'data': {
                'whatsapp_url': whatsapp_url,
                'whatsapp_number': whatsapp_number,
                'reference': reference_label,
                'order': {
                    'total_price': total_price,
                    'customer_name': customer_name,
                    'customer_phone': customer_phone
                }
            }
        }), 200

    except Exception as e:
        current_app.logger.exception(e)
        return safe_error_response('Failed to generate WhatsApp message')
