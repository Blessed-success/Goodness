# BlessedNet Wholesale Hub - API Documentation

Complete REST API documentation for the BlessedNet backend.

**Base URL**: `http://localhost:5000/api` (development)

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Cart](#cart)
4. [Orders](#orders)
5. [Payment](#payment)
6. [Admin](#admin)
7. [Response Format](#response-format)
8. [Error Codes](#error-codes)

---

## Authentication

All endpoints (except auth register/login) require JWT token in header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Register User

**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe",
  "phone": "+233123456789"
}
```

**Response**:
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "is_admin": false
    },
    "access_token": "eyJhbGc..."
  }
}
```

### Login User

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "is_admin": false
    },
    "access_token": "eyJhbGc..."
  }
}
```

### Get Profile

**Endpoint**: `GET /auth/profile`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "full_name": "John Doe",
    "phone": "+233123456789",
    "address": "123 Main St",
    "city": "Accra",
    "country": "Ghana",
    "postal_code": "00100",
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

### Update Profile

**Endpoint**: `PUT /auth/profile`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "full_name": "John Smith",
  "phone": "+233123456789",
  "address": "456 New Ave",
  "city": "Kumasi",
  "country": "Ghana",
  "postal_code": "00234"
}
```

**Response**: (Updated user object)

### Change Password

**Endpoint**: `POST /auth/change-password`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123"
}
```

**Response**:
```json
{
  "message": "Password changed successfully"
}
```

---

## Products

### Get All Products

**Endpoint**: `GET /products`

**Query Parameters**:
- `category` (string) - Filter by category
- `search` (string) - Search by name or description
- `sort` (string) - Sort field: name, price, rating, created_at
- `order` (string) - Sort order: asc, desc
- `page` (integer) - Page number (default: 1)
- `limit` (integer) - Items per page (default: 20, max: 100)
- `trending` (boolean) - Show only trending
- `featured` (boolean) - Show only featured
- `flash_sale` (boolean) - Show only flash sale items

**Example**: 
```
GET /products?category=Electronics&sort=price&order=asc&page=1&limit=20
```

**Response**:
```json
{
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "description": "Product description",
        "category": "Electronics",
        "price": 99.99,
        "discount_percent": 10,
        "discounted_price": 89.99,
        "image_url": "https://example.com/image.jpg",
        "rating": 4.5,
        "stock_quantity": 50,
        "is_featured": true,
        "is_trending": true,
        "is_flash_sale": false,
        "created_at": "2024-01-15T10:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Get Single Product

**Endpoint**: `GET /products/<id>`

**Response**:
```json
{
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "Product Name",
    "description": "Product description",
    "category": "Electronics",
    "price": 99.99,
    "discount_percent": 10,
    "discounted_price": 89.99,
    "image_url": "https://example.com/image.jpg",
    "rating": 4.5,
    "stock_quantity": 50,
    "sku": "PROD-001",
    "is_featured": true,
    "is_trending": true,
    "is_flash_sale": false,
    "flash_sale_end": "2024-02-15T23:59:59",
    "created_at": "2024-01-15T10:30:00"
  }
}
```

### Create Product (Admin Only)

**Endpoint**: `POST /products`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Request**:
```json
{
  "name": "New Product",
  "description": "Product description",
  "category": "Electronics",
  "price": 199.99,
  "discount_percent": 15,
  "image_url": "https://example.com/image.jpg",
  "sku": "PROD-002",
  "stock_quantity": 100,
  "rating": 5.0,
  "is_featured": true,
  "is_trending": false,
  "is_flash_sale": false,
  "flash_sale_end": null
}
```

**Response**: (Created product object)

### Update Product (Admin Only)

**Endpoint**: `PUT /products/<id>`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Request**: (Same fields as create)

**Response**: (Updated product object)

### Delete Product (Admin Only)

**Endpoint**: `DELETE /products/<id>`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Response**:
```json
{
  "message": "Product deleted successfully"
}
```

---

## Cart

### Get Cart

**Endpoint**: `GET /cart`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "message": "Cart retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product": {
          "id": 1,
          "name": "Product Name",
          "price": 99.99,
          "discounted_price": 89.99,
          "image_url": "https://example.com/image.jpg"
        },
        "quantity": 2,
        "unit_price": 89.99,
        "total_price": 179.98,
        "added_at": "2024-01-20T15:30:00"
      }
    ],
    "total_items": 2,
    "total_price": 179.98,
    "created_at": "2024-01-20T14:00:00",
    "updated_at": "2024-01-20T15:30:00"
  }
}
```

### Add to Cart

**Endpoint**: `POST /cart/add`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Response**:
```json
{
  "message": "Item added to cart successfully",
  "data": {
    "item": {
      "id": 1,
      "product_id": 1,
      "quantity": 2,
      "unit_price": 89.99,
      "total_price": 179.98
    },
    "cart": { /* Full cart object */ }
  }
}
```

### Update Cart Item

**Endpoint**: `PUT /cart/item/<item_id>`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "quantity": 5
}
```

**Response**: (Updated cart object)

### Remove from Cart

**Endpoint**: `DELETE /cart/item/<item_id>`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "message": "Item removed from cart successfully",
  "data": { /* Updated cart object */ }
}
```

### Clear Cart

**Endpoint**: `DELETE /cart/clear`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "message": "Cart cleared successfully",
  "data": { /* Empty cart object */ }
}
```

---

## Orders

### Get My Orders

**Endpoint**: `GET /orders`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Query Parameters**:
- `page` (integer) - Page number
- `limit` (integer) - Items per page
- `status` (string) - Filter by status

**Response**:
```json
{
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "BN-20240120-001",
        "user_id": 1,
        "status": "pending",
        "payment_status": "pending",
        "total_amount": 250.50,
        "items": [
          {
            "id": 1,
            "product_id": 1,
            "quantity": 2,
            "unit_price": 89.99,
            "total_price": 179.98
          }
        ],
        "shipping_address": "123 Main St, Accra, Ghana",
        "created_at": "2024-01-20T16:00:00",
        "updated_at": "2024-01-20T16:00:00"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### Get Single Order

**Endpoint**: `GET /orders/<order_id>`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**: (Single order object)

### Create Order

**Endpoint**: `POST /orders`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "shipping_address": "123 Main St, Accra, Ghana",
  "shipping_city": "Accra",
  "shipping_country": "Ghana",
  "shipping_postal_code": "00100",
  "notes": "Please deliver carefully"
}
```

**Response**:
```json
{
  "message": "Order created successfully",
  "data": {
    "order": { /* Order object */ },
    "next_step": "Pay with Paystack"
  }
}
```

### Cancel Order

**Endpoint**: `POST /orders/<order_id>/cancel`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Response**:
```json
{
  "message": "Order cancelled successfully",
  "data": { /* Updated order object */ }
}
```

### Get All Orders (Admin)

**Endpoint**: `GET /orders/admin/all`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Query Parameters**: Same as Get My Orders

### Update Order Status (Admin)

**Endpoint**: `PUT /orders/admin/<order_id>/status`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Request**:
```json
{
  "status": "processing"
}
```

Valid statuses: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

**Response**: (Updated order object)

---

## Payment

### Initialize Paystack Payment

**Endpoint**: `POST /payment/initialize`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "order_id": 1,
  "email": "customer@example.com"
}
```

**Response**:
```json
{
  "message": "Payment initialized successfully",
  "data": {
    "authorization_url": "https://checkout.paystack.com/XXX",
    "access_code": "XXX",
    "reference": "XXX",
    "order_id": 1,
    "order_number": "BN-20240120-001",
    "amount": 250.50,
    "currency": "GHS"
  }
}
```

### Verify Paystack Payment

**Endpoint**: `POST /payment/verify`

**Headers**: 
```
Authorization: Bearer TOKEN
```

**Request**:
```json
{
  "reference": "paystack_reference_code"
}
```

**Response**:
```json
{
  "message": "Payment verified successfully",
  "data": {
    "order_id": 1,
    "order_number": "BN-20240120-001",
    "status": "processing",
    "payment_status": "completed",
    "amount": 250.50,
    "currency": "GHS"
  }
}
```

### WhatsApp Order

**Endpoint**: `POST /payment/whatsapp-order`

**Request**:
```json
{
  "product_id": 1,
  "quantity": 2,
  "customer_name": "John Doe",
  "customer_phone": "+233123456789"
}
```

**Response**:
```json
{
  "message": "WhatsApp order message generated",
  "data": {
    "whatsapp_url": "https://api.whatsapp.com/send?phone=...",
    "whatsapp_number": "233123456789",
    "product": { /* Product info */ },
    "order": { /* Order info */ }
  }
}
```

---

## Admin

### Dashboard Stats

**Endpoint**: `GET /admin/stats`

**Headers**: 
```
Authorization: Bearer ADMIN_TOKEN
```

**Response**:
```json
{
  "message": "Stats retrieved successfully",
  "data": {
    "total_users": 150,
    "total_products": 500,
    "total_orders": 1200,
    "total_revenue": 50000.00,
    "pending_orders": 45,
    "active_users_today": 25
  }
}
```

---

## Response Format

All responses follow this format:

```json
{
  "message": "Success/Error message",
  "data": { /* Response data */ }
}
```

Or for errors:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

---

## Error Codes

| Code | Message | Meaning |
|------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User not authorized (not admin, etc.) |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (email, username) |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Payment service error |

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }'
```

### Get Products
```bash
curl http://localhost:5000/api/products?limit=10&sort=price&order=asc
```

### Add to Cart
```bash
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

---

**Last Updated**: April 2026  
**API Version**: 1.0.0  
**Status**: Production-Ready
