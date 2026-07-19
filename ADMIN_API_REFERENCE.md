# Admin API Reference

## Base URL
```
http://localhost:5000/api/admin
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format
All successful responses follow this format:
```json
{
  "message": "Success description",
  "data": { /* endpoint-specific data */ }
}
```

Error responses:
```json
{
  "error": "Error description"
}
```

---

## DASHBOARD

### Get Dashboard Statistics
```http
GET /dashboard
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Dashboard data retrieved successfully",
  "data": {
    "stats": {
      "total_products": 45,
      "total_orders": 127,
      "total_users": 89,
      "total_revenue": 45320.50,
      "pending_orders": 12,
      "recent_orders": 18
    },
    "top_products": [
      {
        "id": 5,
        "name": "Wholesale Phone Case",
        "total_quantity": 156
      }
    ],
    "revenue_by_day": [
      {
        "date": "2024-01-15",
        "revenue": 2500.00
      }
    ]
  }
}
```

---

## PRODUCTS

### List All Products
```http
GET /products?page=1&limit=10&search=phone
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `search` (string) - Search by product name or SKU

**Response (200 OK):**
```json
{
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Wholesale Phone Case",
        "description": "Durable phone case",
        "category": "Electronics",
        "price": 45.00,
        "discount_percent": 10,
        "image_url": "/uploads/products/1234567890_phone.jpg",
        "stock_quantity": 150,
        "sku": "PHONE-CASE-001",
        "rating": 4.5,
        "is_featured": true,
        "is_trending": false,
        "is_flash_sale": false,
        "created_at": "2024-01-10T14:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

### Get Single Product
```http
GET /products/1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Product retrieved successfully",
  "data": {
    "id": 1,
    "name": "Wholesale Phone Case",
    "description": "Durable phone case",
    "category": "Electronics",
    "price": 45.00,
    "discount_percent": 10,
    "image_url": "/uploads/products/1234567890_phone.jpg",
    "stock_quantity": 150,
    "sku": "PHONE-CASE-001",
    "rating": 4.5,
    "is_featured": true,
    "is_trending": false,
    "is_flash_sale": false,
    "created_at": "2024-01-10T14:30:00"
  }
}
```

### Create Product
```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Wholesale Phone Case",
  "description": "Durable protective case",
  "category": "Electronics",
  "price": 45.00,
  "discount_percent": 10,
  "image_url": "/uploads/products/1234567890_phone.jpg",
  "stock_quantity": 150,
  "sku": "PHONE-CASE-001",
  "rating": 5.0,
  "is_featured": true,
  "is_trending": false,
  "is_flash_sale": false
}
```

**Fields:**
- `name` (string, required) - Product name (max 255 chars)
- `category` (string, required) - Category name (max 100 chars)
- `price` (number, required) - Product price in GHS
- `description` (string) - Product description
- `discount_percent` (number) - Discount percentage (0-100)
- `image_url` (string) - Product image URL
- `stock_quantity` (integer) - Available stock
- `sku` (string) - Unique SKU (must be unique)
- `rating` (number) - Product rating (0-5)
- `is_featured` (boolean) - Featured product flag
- `is_trending` (boolean) - Trending product flag
- `is_flash_sale` (boolean) - Flash sale flag

**Response (201 Created):**
```json
{
  "message": "Product created successfully",
  "data": { /* product object */ }
}
```

**Error (409 Conflict):**
```json
{
  "error": "SKU already exists"
}
```

### Update Product
```http
PUT /products/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Phone Case",
  "price": 50.00,
  "stock_quantity": 200
}
```

**Response (200 OK):**
```json
{
  "message": "Product updated successfully",
  "data": { /* updated product object */ }
}
```

### Delete Product
```http
DELETE /products/1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Product deleted successfully"
}
```

---

## IMAGE UPLOAD

### Upload Product Image
```http
POST /upload-image
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

**Specifications:**
- Accepted formats: PNG, JPG, JPEG, GIF, WebP
- Max file size: 5MB
- Stored in: `uploads/products/` directory
- Naming: `<timestamp>_<filename>`

**Response (200 OK):**
```json
{
  "message": "Image uploaded successfully",
  "data": {
    "filename": "1234567890_phone.jpg",
    "url": "/uploads/products/1234567890_phone.jpg",
    "size": 245632
  }
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"
}
```

---

## ORDERS

### List All Orders
```http
GET /orders?page=1&limit=10&status=pending&search=order123
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `status` (string) - Filter by status (pending, processing, shipped, delivered, cancelled)
- `search` (string) - Search by order number or customer email

**Response (200 OK):**
```json
{
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "order_number": "ORD-20240115-001",
        "user_id": 5,
        "user_email": "customer@example.com",
        "status": "pending",
        "payment_status": "completed",
        "total_amount": 245.50,
        "items_count": 3,
        "created_at": "2024-01-15T10:30:00",
        "updated_at": "2024-01-15T10:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 127,
      "pages": 13
    }
  }
}
```

### Get Order Details
```http
GET /orders/1
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Order retrieved successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-20240115-001",
    "user_id": 5,
    "user": {
      "id": 5,
      "email": "customer@example.com",
      "full_name": "John Doe",
      "phone": "+233123456789",
      "address": "123 Main St, Accra"
    },
    "status": "pending",
    "payment_status": "completed",
    "total_amount": 245.50,
    "shipping_address": "456 Delivery Ave, Accra",
    "notes": "Please deliver between 9-5",
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "Phone Case",
          "sku": "PHONE-CASE-001"
        },
        "quantity": 2,
        "unit_price": 45.00,
        "total_price": 90.00
      }
    ],
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

### Update Order Status
```http
PUT /orders/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "processing"
}
```

**Valid Status Values:**
- `pending` - Initial state
- `processing` - Being prepared
- `shipped` - In transit
- `delivered` - Completed
- `cancelled` - Cancelled

**Response (200 OK):**
```json
{
  "message": "Order status updated successfully",
  "data": {
    "order_id": 1,
    "status": "processing",
    "updated_at": "2024-01-15T11:00:00"
  }
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Invalid status. Valid: pending, processing, shipped, delivered, cancelled"
}
```

---

## USERS

### List All Users
```http
GET /users?page=1&limit=20&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `search` (string) - Search by email, username, or full name

**Response (200 OK):**
```json
{
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 5,
        "username": "johndoe",
        "email": "john@example.com",
        "full_name": "John Doe",
        "phone": "+233123456789",
        "is_admin": false,
        "is_active": true,
        "orders_count": 5,
        "created_at": "2024-01-10T14:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 89,
      "pages": 5
    }
  }
}
```

### Toggle User Admin Status
```http
PUT /users/5/toggle-admin
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User promoted to admin",
  "data": {
    "user_id": 5,
    "is_admin": true
  }
}
```

### Toggle User Active Status
```http
PUT /users/5/toggle-active
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "User deactivated",
  "data": {
    "user_id": 5,
    "is_active": false
  }
}
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Successfully retrieved data |
| 201 | Successfully created resource |
| 400 | Bad request / Invalid data |
| 403 | Admin access required |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate SKU) |
| 500 | Server error |

---

## Rate Limiting

No rate limiting is currently implemented. For production, consider implementing:
- 100 requests per minute per admin
- 10 file uploads per minute
- 50 orders updated per minute

---

## Example: Complete Workflow

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword"
  }'
```

### 2. Get Dashboard
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <token>"
```

### 3. Create Product
```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sample Product",
    "category": "Electronics",
    "price": 99.99,
    "stock_quantity": 50
  }'
```

### 4. Upload Image
```bash
curl -X POST http://localhost:5000/api/admin/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

### 5. List Orders
```bash
curl -X GET "http://localhost:5000/api/admin/orders?status=pending" \
  -H "Authorization: Bearer <token>"
```

### 6. Update Order Status
```bash
curl -X PUT http://localhost:5000/api/admin/orders/1/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "shipped"}'
```

---

## Additional Resources

- [Admin Dashboard Guide](./ADMIN_GUIDE.md)
- [Main API Documentation](./API_DOCUMENTATION.md)
- [Setup Instructions](./SETUP.md)
