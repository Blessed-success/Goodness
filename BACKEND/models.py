"""
Database Models for Nexus Wholesale Hub
Defines all tables for users, products, orders, and cart functionality
ADDED: AdminCredential model for secure credential management
"""

from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
import secrets
import string

class AdminCredential(db.Model):
    """Model for managing admin/super admin credentials securely"""
    __tablename__ = 'admin_credentials'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Credential fields
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    # Security fields
    is_active = db.Column(db.Boolean, default=True)
    requires_password_change = db.Column(db.Boolean, default=False)
    last_password_change = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    login_attempts = db.Column(db.Integer, default=0)
    is_locked = db.Column(db.Boolean, default=False)
    locked_until = db.Column(db.DateTime)
    
    # Access control
    role = db.Column(db.String(50), default='admin')  # 'admin' or 'super_admin'
    permissions = db.Column(db.Text)  # JSON string of permissions
    
    # Audit trail
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.String(120))  # Email of admin who made the change
    
    # Relationships
    user = db.relationship('User', backref=db.backref('admin_credential', uselist=False))
    password_history = db.relationship('PasswordHistory', back_populates='admin_credential', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password, maintaining history"""
        self.password_hash = generate_password_hash(password)
        self.last_password_change = datetime.utcnow()
        self.requires_password_change = False

        # PasswordHistory needs a real admin_credential_id. If this is a
        # brand-new record that hasn't been inserted yet, flush now (after
        # password_hash is set, since that column is NOT NULL too) so self.id
        # is populated.
        if self.id is None:
            db.session.add(self)
            db.session.flush()

        # Add to password history
        history = PasswordHistory(
            admin_credential_id=self.id,
            password_hash=self.password_hash,
            changed_at=datetime.utcnow()
        )
        db.session.add(history)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def increment_login_attempts(self):
        """Increment failed login attempts"""
        self.login_attempts += 1
        
        # Lock account after 5 failed attempts for 30 minutes
        if self.login_attempts >= 5:
            self.is_locked = True
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
    
    def reset_login_attempts(self):
        """Reset login attempts on successful login"""
        self.login_attempts = 0
        self.is_locked = False
        self.locked_until = None
        self.last_login = datetime.utcnow()
    
    def is_account_locked(self):
        """Check if account is currently locked"""
        if not self.is_locked:
            return False
        
        if self.locked_until and datetime.utcnow() > self.locked_until:
            self.is_locked = False
            self.locked_until = None
            self.login_attempts = 0
            return False
        
        return True
    
    def to_dict(self, include_sensitive=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'email': self.email,
            'is_active': self.is_active,
            'requires_password_change': self.requires_password_change,
            'last_password_change': self.last_password_change.isoformat() if self.last_password_change else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'role': self.role,
            'is_locked': self.is_locked,
            'locked_until': self.locked_until.isoformat() if self.locked_until else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'updated_by': self.updated_by
        }
        
        if include_sensitive:
            data['login_attempts'] = self.login_attempts
            data['permissions'] = self.permissions
        
        return data


class PasswordHistory(db.Model):
    """Track password change history for security compliance"""
    __tablename__ = 'password_history'
    
    id = db.Column(db.Integer, primary_key=True)
    admin_credential_id = db.Column(db.Integer, db.ForeignKey('admin_credentials.id'), nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    changed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    admin_credential = db.relationship('AdminCredential', back_populates='password_history')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'admin_credential_id': self.admin_credential_id,
            'changed_at': self.changed_at.isoformat()
        }


class User(db.Model):
    """User model for customer and admin accounts"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    avatar_url = db.Column(db.String(255))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    country = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    # Location fields for access control
    region = db.Column(db.String(100))
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'))
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    is_admin = db.Column(db.Boolean, default=False)
    is_vendor = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Password reset — store only the hash of the emailed token, never the
    # token itself, same reasoning as password_hash.
    reset_token_hash = db.Column(db.String(255), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    # Relationships
    region_obj = db.relationship('Region', foreign_keys=[region_id])
    city_obj = db.relationship('City', foreign_keys=[city_id])
    cart = db.relationship('Cart', back_populates='user', uselist=False, cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='user', cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'phone': self.phone,
            'avatar_url': self.avatar_url,
            'address': self.address,
            'city': self.city,
            'region': self.region,
            'region_id': self.region_id,
            'city_id': self.city_id,
            'country': self.country,
            'postal_code': self.postal_code,
            'is_admin': self.is_admin,
            'is_vendor': self.is_vendor,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Region(db.Model):
    """Region model for Ghana location-based access control"""
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    is_active = db.Column(db.Boolean, default=True)
    delivery_fee = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cities = db.relationship('City', back_populates='region', cascade='all, delete-orphan')
    
    def to_dict(self, include_cities=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'is_active': self.is_active,
            'delivery_fee': self.delivery_fee,
            'created_at': self.created_at.isoformat()
        }
        
        if include_cities:
            data['cities'] = [city.to_dict() for city in self.cities]
        
        return data


class City(db.Model):
    """City model for Ghana location-based access control"""
    __tablename__ = 'cities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    region = db.relationship('Region', back_populates='cities')
    
    # Unique constraint on (region_id, name) to prevent duplicate cities in same region
    __table_args__ = (
        db.UniqueConstraint('region_id', 'name', name='uq_region_city'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'region_id': self.region_id,
            'region_name': self.region.name if self.region else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Category(db.Model):
    """Category model for product categories, holding the display image"""
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True, index=True)
    image_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'image_url': self.image_url,
            'created_at': self.created_at.isoformat()
        }


class Product(db.Model):
    """Product model for catalog items"""
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(100), nullable=False, index=True)
    price = db.Column(db.Float, nullable=False)
    discount_percent = db.Column(db.Float, default=0)
    image_url = db.Column(db.String(500))
    rating = db.Column(db.Float, default=5.0)
    review_count = db.Column(db.Integer, default=0)
    stock_quantity = db.Column(db.Integer, default=0)
    sku = db.Column(db.String(100), unique=True)
    is_featured = db.Column(db.Boolean, default=False)
    is_trending = db.Column(db.Boolean, default=False)
    is_flash_sale = db.Column(db.Boolean, default=False)
    flash_sale_end = db.Column(db.DateTime)
    
    # Price monitoring fields (for imported products from 1688)
    source_url = db.Column(db.String(500), index=True)  # 1688 product link
    supplier_price_rmb = db.Column(db.Float)  # Original supplier price in RMB
    profit_margin_percent = db.Column(db.Float, default=40)  # Markup percentage
    last_scraped_at = db.Column(db.DateTime)  # Last time price was checked
    is_price_monitored = db.Column(db.Boolean, default=False)  # Whether to auto-track prices

    # Marketplace: null means sold directly by Nexus (unchanged legacy behavior)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=True, index=True)

    # '#rrggbb' average color of image_url, used for approximate search-by-photo matching
    dominant_color = db.Column(db.String(7))

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cart_items = db.relationship('CartItem', back_populates='product', cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', back_populates='product')
    price_alerts = db.relationship('PriceAlert', back_populates='product', cascade='all, delete-orphan')
    vendor = db.relationship('Vendor', foreign_keys=[vendor_id])
    
    @property
    def discounted_price(self):
        """Calculate discounted price"""
        return self.price * (1 - self.discount_percent / 100)
    
    def to_dict(self, include_stock=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'discount_percent': self.discount_percent,
            'discounted_price': self.discounted_price,
            'image_url': self.image_url,
            'rating': self.rating,
            'review_count': self.review_count or 0,
            'sku': self.sku,
            'is_featured': self.is_featured,
            'is_trending': self.is_trending,
            'is_flash_sale': self.is_flash_sale,
            'flash_sale_end': self.flash_sale_end.isoformat() if self.flash_sale_end else None,
            'vendor_id': self.vendor_id,
            'vendor_name': self.vendor.store_name if self.vendor_id and self.vendor else None,
            'vendor_slug': self.vendor.slug if self.vendor_id and self.vendor else None,
            'created_at': self.created_at.isoformat()
        }
        
        if include_stock:
            data['stock_quantity'] = self.stock_quantity
        
        return data


class ProductDescription(db.Model):
    """AI-generated product descriptions"""
    __tablename__ = 'product_descriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    
    # Generated content
    seo_title = db.Column(db.String(255))
    marketing_description = db.Column(db.Text)
    bullet_features = db.Column(db.Text)  # JSON array of bullet points
    whatsapp_caption = db.Column(db.Text)
    
    # Generation metadata
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_model = db.Column(db.String(100), default='openai-gpt-3.5-turbo')
    prompt_used = db.Column(db.Text)
    
    # Input data used for generation
    input_title = db.Column(db.String(255))
    input_features = db.Column(db.Text)  # JSON array
    input_category = db.Column(db.String(100))

    # Relationships
    product = db.relationship('Product', backref=db.backref('descriptions', lazy=True, cascade='all, delete-orphan'))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'seo_title': self.seo_title,
            'marketing_description': self.marketing_description,
            'bullet_features': self.bullet_features,
            'whatsapp_caption': self.whatsapp_caption,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'ai_model': self.ai_model,
            'input_title': self.input_title,
            'input_features': self.input_features,
            'input_category': self.input_category
        }


class ProductAdCampaign(db.Model):
    """AI-generated Facebook ad campaigns for products"""
    __tablename__ = 'product_ad_campaigns'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    variation_index = db.Column(db.Integer, nullable=False, default=1)
    headline = db.Column(db.String(255), nullable=False)
    primary_text = db.Column(db.Text, nullable=False)
    call_to_action = db.Column(db.String(100), nullable=False)
    hashtags = db.Column(db.String(255))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_model = db.Column(db.String(100), default='openai-gpt-3.5-turbo')
    prompt_used = db.Column(db.Text)

    product = db.relationship('Product', backref=db.backref('ad_campaigns', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'variation_index': self.variation_index,
            'headline': self.headline,
            'primary_text': self.primary_text,
            'call_to_action': self.call_to_action,
            'hashtags': self.hashtags,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'ai_model': self.ai_model,
            'prompt_used': self.prompt_used
        }


class NegotiationMessage(db.Model):
    """Generated supplier negotiation messages"""
    __tablename__ = 'negotiation_messages'

    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(255), nullable=False)
    supplier_name = db.Column(db.String(255), nullable=True)
    current_price = db.Column(db.Float, nullable=True)
    english_message = db.Column(db.Text, nullable=False)
    chinese_message = db.Column(db.Text, nullable=False)
    bulk_order_message = db.Column(db.Text, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    ai_model = db.Column(db.String(100), default='openai-gpt-3.5-turbo')
    prompt_used = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'supplier_name': self.supplier_name,
            'current_price': self.current_price,
            'english_message': self.english_message,
            'chinese_message': self.chinese_message,
            'bulk_order_message': self.bulk_order_message,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'ai_model': self.ai_model,
            'prompt_used': self.prompt_used
        }


class Cart(db.Model):
    """Cart model for user shopping carts"""
    __tablename__ = 'carts'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='cart', uselist=False)
    items = db.relationship('CartItem', back_populates='cart', cascade='all, delete-orphan')
    
    @property
    def total_price(self):
        """Calculate cart total"""
        return sum(item.subtotal for item in self.items)
    
    @property
    def total_items(self):
        """Get total items in cart"""
        return sum(item.quantity for item in self.items)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'items': [item.to_dict() for item in self.items],
            'total_items': self.total_items,
            'total_price': self.total_price,
            'updated_at': self.updated_at.isoformat()
        }


class CartItem(db.Model):
    """Cart item model for products in carts"""
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('carts.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    cart = db.relationship('Cart', back_populates='items')
    product = db.relationship('Product', back_populates='cart_items')
    
    @property
    def subtotal(self):
        """Calculate subtotal for this item"""
        return self.price_at_purchase * self.quantity
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product': self.product.to_dict(),
            'quantity': self.quantity,
            'price_at_purchase': self.price_at_purchase,
            'subtotal': self.subtotal,
            'added_at': self.added_at.isoformat()
        }


class Order(db.Model):
    """Order model for customer orders"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_number = db.Column(db.String(50), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default='pending')  # pending, paid, processing, shipped, delivered, cancelled
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='paystack')  # paystack, whatsapp_quote
    payment_status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    paystack_reference = db.Column(db.String(100))
    shipping_address = db.Column(db.Text)
    shipping_city = db.Column(db.String(100))
    shipping_phone = db.Column(db.String(20))
    shipping_cost = db.Column(db.Float, default=0)
    notes = db.Column(db.Text)
    supplier_order_id = db.Column(db.String(100))
    supplier_contact = db.Column(db.String(255))
    tracking_number = db.Column(db.String(100))
    delivery_fee = db.Column(db.Float, default=0)
    dropship_forwarded = db.Column(db.Boolean, default=False)
    whatsapp_notification_sent = db.Column(db.Boolean, default=False)
    sms_notification_sent = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    shipped_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', back_populates='orders')
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    
    @property
    def item_total(self):
        """Calculate items total"""
        return sum(item.subtotal for item in self.items)
    
    def to_dict(self, include_items=True):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'order_number': self.order_number,
            'user_id': self.user_id,
            'status': self.status,
            'total_amount': self.total_amount,
            'item_total': self.item_total,
            'shipping_cost': self.shipping_cost,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'paystack_reference': self.paystack_reference,
            'shipping_address': self.shipping_address,
            'shipping_city': self.shipping_city,
            'shipping_phone': self.shipping_phone,
            'notes': self.notes,
            'supplier_order_id': self.supplier_order_id,
            'supplier_contact': self.supplier_contact,
            'tracking_number': self.tracking_number,
            'delivery_fee': self.delivery_fee,
            'dropship_forwarded': self.dropship_forwarded,
            'whatsapp_notification_sent': self.whatsapp_notification_sent,
            'sms_notification_sent': self.sms_notification_sent,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'shipped_at': self.shipped_at.isoformat() if self.shipped_at else None,
            'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
        }
        
        if include_items:
            data['items'] = [item.to_dict() for item in self.items]
        
        return data


class OrderItem(db.Model):
    """Order item model for products in orders"""
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_purchase = db.Column(db.Float, nullable=False)
    discount_percent = db.Column(db.Float, default=0)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', back_populates='items')
    product = db.relationship('Product', back_populates='order_items')
    
    @property
    def subtotal(self):
        """Calculate subtotal"""
        return self.price_at_purchase * self.quantity
    
    @property
    def discount_amount(self):
        """Calculate discount amount"""
        return self.subtotal * (self.discount_percent / 100)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product': {
                'id': self.product.id,
                'name': self.product.name,
                'sku': self.product.sku,
                'image_url': self.product.image_url
            },
            'quantity': self.quantity,
            'price_at_purchase': self.price_at_purchase,
            'discount_percent': self.discount_percent,
            'discount_amount': self.discount_amount,
            'subtotal': self.subtotal,
            'added_at': self.added_at.isoformat()
        }


class ImportJob(db.Model):
    """Track bulk import jobs for 1688 products"""
    __tablename__ = 'import_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    job_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    total_products = db.Column(db.Integer, default=0)
    successful_count = db.Column(db.Integer, default=0)
    failed_count = db.Column(db.Integer, default=0)
    progress_percent = db.Column(db.Float, default=0)
    error_message = db.Column(db.Text)
    import_type = db.Column(db.String(20))  # single, bulk, csv
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id])
    tasks = db.relationship('ImportTask', back_populates='job', cascade='all, delete-orphan')
    
    @property
    def elapsed_seconds(self):
        """Get elapsed time in seconds"""
        start = self.started_at or self.created_at
        end = self.completed_at or datetime.utcnow()
        return int((end - start).total_seconds())
    
    def to_dict(self, include_tasks=False):
        """Convert to dictionary"""
        data = {
            'id': self.id,
            'job_id': self.job_id,
            'user_id': self.user_id,
            'status': self.status,
            'total_products': self.total_products,
            'successful_count': self.successful_count,
            'failed_count': self.failed_count,
            'progress_percent': round(self.progress_percent, 1),
            'import_type': self.import_type,
            'error_message': self.error_message,
            'elapsed_seconds': self.elapsed_seconds,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
        
        if include_tasks:
            data['tasks'] = [task.to_dict() for task in self.tasks]
        
        return data


class ImportTask(db.Model):
    """Individual product import task within an import job"""
    __tablename__ = 'import_tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('import_jobs.id'), nullable=False)
    product_url = db.Column(db.String(500), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))  # Link to product if successful
    status = db.Column(db.String(20), default='pending')  # pending, processing, success, failed
    error_message = db.Column(db.Text)
    original_title = db.Column(db.String(500))
    translated_title = db.Column(db.String(500))
    price_rmb = db.Column(db.Float)
    price_ghs = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    job = db.relationship('ImportJob', back_populates='tasks')
    product = db.relationship('Product', foreign_keys=[product_id])
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'job_id': self.job_id,
            'product_url': self.product_url,
            'product_id': self.product_id,
            'status': self.status,
            'error_message': self.error_message,
            'original_title': self.original_title,
            'translated_title': self.translated_title,
            'price_rmb': self.price_rmb,
            'price_ghs': self.price_ghs,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }


class PriceAlert(db.Model):
    """Track price changes detected during monitoring"""
    __tablename__ = 'price_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    old_price_rmb = db.Column(db.Float, nullable=False)
    new_price_rmb = db.Column(db.Float, nullable=False)
    old_price_ghs = db.Column(db.Float, nullable=False)
    new_price_ghs = db.Column(db.Float, nullable=False)
    price_change_percent = db.Column(db.Float)  # Positive = increase, Negative = decrease
    alert_type = db.Column(db.String(20))  # 'price_increase' or 'price_decrease'
    status = db.Column(db.String(20), default='pending')  # pending, approved, dismissed, auto_updated
    admin_notes = db.Column(db.Text)
    auto_update_applied = db.Column(db.Boolean, default=False)  # Whether system auto-updated price
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', back_populates='price_alerts')
    
    @property
    def is_increase(self):
        """Check if price increased"""
        return self.price_change_percent > 0
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'old_price_rmb': self.old_price_rmb,
            'new_price_rmb': self.new_price_rmb,
            'old_price_ghs': self.old_price_ghs,
            'new_price_ghs': self.new_price_ghs,
            'price_change_percent': round(self.price_change_percent, 2),
            'alert_type': self.alert_type,
            'is_increase': self.is_increase,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'auto_update_applied': self.auto_update_applied,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class CompetitorPrice(db.Model):
    """Track competitor prices for comparison and strategy"""
    __tablename__ = 'competitor_prices'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    competitor_url = db.Column(db.String(500), nullable=False)
    competitor_name = db.Column(db.String(100), nullable=False)  # 'Jumia', 'AliExpress', 'Amazon', etc.
    competitor_product_title = db.Column(db.String(255))
    competitor_price = db.Column(db.Float, nullable=False)
    competitor_currency = db.Column(db.String(10), default='GHS')  # GHS, USD, etc.
    is_available = db.Column(db.Boolean, default=True)
    last_checked = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    check_frequency_hours = db.Column(db.Integer, default=24)  # How often to check this competitor
    is_active = db.Column(db.Boolean, default=True)  # Whether to continue monitoring
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    product = db.relationship('Product', backref='competitor_prices')
    
    @property
    def price_difference(self):
        """Calculate price difference with our product"""
        if not self.product:
            return None
        return self.competitor_price - self.product.price
    
    @property
    def price_difference_percent(self):
        """Calculate percentage difference"""
        if not self.product or self.product.price == 0:
            return None
        return ((self.competitor_price - self.product.price) / self.product.price) * 100
    
    @property
    def is_competitor_cheaper(self):
        """Check if competitor is cheaper"""
        return self.price_difference < 0 if self.price_difference is not None else False
    
    @property
    def is_best_deal(self):
        """Check if our price is the best deal"""
        return self.price_difference > 0 if self.price_difference is not None else False
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'competitor_url': self.competitor_url,
            'competitor_name': self.competitor_name,
            'competitor_product_title': self.competitor_product_title,
            'competitor_price': self.competitor_price,
            'competitor_currency': self.competitor_currency,
            'is_available': self.is_available,
            'price_difference': round(self.price_difference, 2) if self.price_difference else None,
            'price_difference_percent': round(self.price_difference_percent, 2) if self.price_difference_percent else None,
            'is_competitor_cheaper': self.is_competitor_cheaper,
            'is_best_deal': self.is_best_deal,
            'last_checked': self.last_checked.isoformat(),
            'check_frequency_hours': self.check_frequency_hours,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }


class CompetitorAlert(db.Model):
    """Alerts for competitor price changes and strategy recommendations"""
    __tablename__ = 'competitor_alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    competitor_price_id = db.Column(db.Integer, db.ForeignKey('competitor_prices.id'), nullable=False, index=True)
    alert_type = db.Column(db.String(50))  # 'competitor_cheaper', 'price_gap_increased', 'became_unavailable'
    old_competitor_price = db.Column(db.Float)
    new_competitor_price = db.Column(db.Float)
    price_gap_change = db.Column(db.Float)  # Change in price difference
    recommendation = db.Column(db.Text)  # Suggested action
    status = db.Column(db.String(20), default='pending')  # pending, reviewed, dismissed, action_taken
    admin_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    competitor_price = db.relationship('CompetitorPrice', backref='alerts')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'competitor_price_id': self.competitor_price_id,
            'product_name': self.competitor_price.product.name if self.competitor_price and self.competitor_price.product else None,
            'competitor_name': self.competitor_price.competitor_name if self.competitor_price else None,
            'alert_type': self.alert_type,
            'old_competitor_price': self.old_competitor_price,
            'new_competitor_price': self.new_competitor_price,
            'price_gap_change': round(self.price_gap_change, 2) if self.price_gap_change else None,
            'recommendation': self.recommendation,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat(),
        }


class HeroBanner(db.Model):
    """Fully admin-editable homepage hero banner: video, offers, timer, colors, scheduling"""
    __tablename__ = 'hero_banners'

    id = db.Column(db.Integer, primary_key=True)

    # Content
    headline = db.Column(db.String(255))
    subheading = db.Column(db.Text)
    badge_text = db.Column(db.String(100))

    # Media
    video_url = db.Column(db.String(500))
    poster_image_url = db.Column(db.String(500))

    # Calls to action
    cta_shop_text = db.Column(db.String(50), default='Shop Now')
    cta_shop_link = db.Column(db.String(255), default='/products')
    cta_deals_text = db.Column(db.String(50), default='View Deals')
    cta_deals_link = db.Column(db.String(255), default='/products?flash_sale=true')
    show_watch_video = db.Column(db.Boolean, default=True)

    # Promotions
    flash_sale_label = db.Column(db.String(100))
    announcement_text = db.Column(db.String(255))
    announcement_link = db.Column(db.String(255))
    ticker_text = db.Column(db.Text)  # pipe ("|") separated scrolling offer lines

    # Countdown
    countdown_enabled = db.Column(db.Boolean, default=False)
    countdown_end = db.Column(db.DateTime)
    countdown_label = db.Column(db.String(100), default='Flash Sale Ends In')

    # Colors
    overlay_color = db.Column(db.String(20), default='#123d2a')
    accent_color = db.Column(db.String(20), default='#82d06e')

    # Scheduling
    is_active = db.Column(db.Boolean, default=True)
    starts_at = db.Column(db.DateTime)
    ends_at = db.Column(db.DateTime)
    display_order = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'headline': self.headline,
            'subheading': self.subheading,
            'badge_text': self.badge_text,
            'video_url': self.video_url,
            'poster_image_url': self.poster_image_url,
            'cta_shop_text': self.cta_shop_text,
            'cta_shop_link': self.cta_shop_link,
            'cta_deals_text': self.cta_deals_text,
            'cta_deals_link': self.cta_deals_link,
            'show_watch_video': self.show_watch_video,
            'flash_sale_label': self.flash_sale_label,
            'announcement_text': self.announcement_text,
            'announcement_link': self.announcement_link,
            'ticker_text': self.ticker_text,
            'countdown_enabled': self.countdown_enabled,
            'countdown_end': self.countdown_end.isoformat() if self.countdown_end else None,
            'countdown_label': self.countdown_label,
            'overlay_color': self.overlay_color,
            'accent_color': self.accent_color,
            'is_active': self.is_active,
            'starts_at': self.starts_at.isoformat() if self.starts_at else None,
            'ends_at': self.ends_at.isoformat() if self.ends_at else None,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class WishlistItem(db.Model):
    """A single product saved to a customer's wishlist"""
    __tablename__ = 'wishlist_items'
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='uq_wishlist_user_product'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User')
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product': self.product.to_dict() if self.product else None,
            'created_at': self.created_at.isoformat(),
        }


class Review(db.Model):
    """A customer's rating/review for a product"""
    __tablename__ = 'reviews'
    __table_args__ = (db.UniqueConstraint('user_id', 'product_id', name='uq_review_user_product'),)

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    title = db.Column(db.String(150))
    body = db.Column(db.Text)
    is_verified_purchase = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship('Product')
    user = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'rating': self.rating,
            'title': self.title,
            'body': self.body,
            'is_verified_purchase': self.is_verified_purchase,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }


class Notification(db.Model):
    """An in-app notification for a customer (order updates, promos, etc.)"""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    type = db.Column(db.String(50), default='system')  # order_status, promo, vendor, system
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text)
    link = db.Column(db.String(255))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'link': self.link,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat(),
        }


class Vendor(db.Model):
    """A marketplace seller's storefront/profile"""
    __tablename__ = 'vendors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    store_name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(160), unique=True, nullable=False, index=True)
    logo_url = db.Column(db.String(500))
    banner_url = db.Column(db.String(500))
    description = db.Column(db.Text)
    whatsapp_number = db.Column(db.String(20))
    is_approved = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    commission_percent = db.Column(db.Float, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self, include_contact=False):
        data = {
            'id': self.id,
            'store_name': self.store_name,
            'slug': self.slug,
            'logo_url': self.logo_url,
            'banner_url': self.banner_url,
            'description': self.description,
            'is_approved': self.is_approved,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
        }
        if include_contact:
            data['user_id'] = self.user_id
            data['whatsapp_number'] = self.whatsapp_number
            data['commission_percent'] = self.commission_percent
            data['updated_at'] = self.updated_at.isoformat()
        return data


class VendorEarning(db.Model):
    """A vendor's commission-ledger entry for one order-item sold.

    Money still flows through the single platform Paystack account exactly
    as before — this is a bookkeeping ledger, not an automated payout. Admin
    reconciles/pays vendors outside the app and marks rows 'paid' here.
    """
    __tablename__ = 'vendor_earnings'

    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey('vendors.id'), nullable=False, index=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_items.id'), nullable=False)
    gross_amount = db.Column(db.Float, nullable=False)
    commission_amount = db.Column(db.Float, nullable=False)
    net_amount = db.Column(db.Float, nullable=False)
    payout_status = db.Column(db.String(20), default='unpaid')  # unpaid, paid
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    vendor = db.relationship('Vendor', foreign_keys=[vendor_id])
    order = db.relationship('Order', foreign_keys=[order_id])

    def to_dict(self):
        return {
            'id': self.id,
            'vendor_id': self.vendor_id,
            'order_id': self.order_id,
            'order_item_id': self.order_item_id,
            'gross_amount': self.gross_amount,
            'commission_amount': self.commission_amount,
            'net_amount': self.net_amount,
            'payout_status': self.payout_status,
            'created_at': self.created_at.isoformat(),
        }
