# Admin Dashboard Documentation

## Overview

The BlessedNet Admin Dashboard is a comprehensive management system for administrators to manage products, orders, customers, and view business analytics. All admin routes are protected with JWT authentication and require admin privileges.

## Features

### 1. Dashboard
- **Real-time Statistics**
  - Total products in catalog
  - Total orders processed
  - Total users/customers
  - Total revenue (GHS)
  - Pending orders count
  - Recent activity (last 7 days)

- **Analytics & Reports**
  - Top selling products with sales trends
  - Revenue breakdown by day (7-day history)
  - Quick action buttons for common tasks

### 2. Product Management
- **View Products**
  - Paginated product listing (10 per page)
  - Search by product name or SKU
  - Display product image, price, stock, and features
  - Filter by featured/trending/flash sale status

- **Create Products**
  - Add new products with full details
  - Upload product images (PNG, JPG, JPEG, GIF, WebP)
  - Set pricing and discount percentages
  - Mark as featured, trending, or flash sale
  - Manage stock quantity

- **Edit Products**
  - Update product information
  - Change pricing and discounts
  - Upload new product images
  - Modify stock levels

- **Delete Products**
  - Remove products from catalog
  - Confirmation dialog before deletion

### 3. Order Management
- **View All Orders**
  - Paginated order listing (10 per page)
  - Filter by order status (pending, processing, shipped, delivered, cancelled)
  - Search by order number or customer email
  - Display order total, item count, and dates

- **Order Details**
  - View complete order information
  - Customer details and shipping address
  - List all items in order with prices
  - Order timeline and status
  - Customer notes

- **Update Order Status**
  - Change order status with one click
  - Status options: pending → processing → shipped → delivered
  - Can cancel orders if needed
  - Automatic timestamp updates

### 4. User Management
- **View All Users**
  - Paginated user listing (20 per page)
  - Search by email, username, or full name
  - Display user avatar/initial, order count, registration date
  - Show admin/user role and active/inactive status

- **User Administration**
  - Toggle admin privileges on/off
  - Activate/deactivate user accounts
  - Confirmation required before changes
  - Bulk statistics display (admin count, active/inactive)

### 5. Product Import
- Access to the 1688 product import system
- Semi-automatic product importing from 1688.com
- See separate [Import Documentation](./1688_IMPORT_GUIDE.md)

## Access & Security

### Authentication
- All admin routes require valid JWT token
- Login via standard login page with admin account
- Admin accounts can only be created by existing admins

### Authorization
- `is_admin` field in User model determines access
- Admin-only endpoints checked on backend
- Frontend route protection with AdminRoute component
- Session persisted in localStorage

### JWT Protection
All admin endpoints require header:
```
Authorization: Bearer <access_token>
```

## API Endpoints

### Dashboard
```
GET /api/admin/dashboard
```

### Products
```
GET    /api/admin/products                  # List all products
POST   /api/admin/products                  # Create new product
GET    /api/admin/products/<id>             # Get single product
PUT    /api/admin/products/<id>             # Update product
DELETE /api/admin/products/<id>             # Delete product
POST   /api/admin/upload-image              # Upload product image
```

### Orders
```
GET    /api/admin/orders                    # List all orders
GET    /api/admin/orders/<id>               # Get order details
PUT    /api/admin/orders/<id>/status        # Update order status
```

### Users
```
GET    /api/admin/users                     # List all users
PUT    /api/admin/users/<id>/toggle-admin   # Toggle admin status
PUT    /api/admin/users/<id>/toggle-active  # Toggle active status
```

## Navigation

### Sidebar Menu
1. **Dashboard** - Overview and analytics
2. **Products** - Product catalog management
3. **Orders** - Order tracking and management
4. **Users** - User account management
5. **Product Import** - 1688 import system
6. **Back to Store** - Return to customer view

### Mobile Responsive
- Sidebar collapses on mobile devices
- Full touch-friendly interface
- Menu toggle button in header

## Image Upload

### Specifications
- **Allowed Formats**: PNG, JPG, JPEG, GIF, WebP
- **Max File Size**: 5MB
- **Storage**: Uploaded to `uploads/products/` directory
- **Naming**: Timestamped for uniqueness (e.g., `1234567890_product.jpg`)

### Upload Process
1. Click "Product Image" field in product form
2. Select image file from device
3. Wait for upload confirmation
4. Image URL automatically added to form

## Data Validation

### Product Fields
- **Name** (required): Max 255 characters
- **Category** (required): Max 100 characters
- **Price** (required): Positive decimal number
- **Discount**: 0-100 percentage
- **Stock Quantity**: Non-negative integer
- **Rating**: 0-5 decimal number

### Order Status Flow
- Pending → Processing → Shipped → Delivered
- Can cancel at any stage
- Status change is permanent (no rollback)

## Performance

### Pagination
- Products: 10 items per page
- Orders: 10 items per page
- Users: 20 items per page
- Maximum limit: 100 items per page

### Search
- Real-time search with filter
- Case-insensitive matching
- Resets to page 1 on new search
- Debounced for performance

## Best Practices

### Managing Products
1. Always upload product images
2. Use descriptive product names
3. Set accurate stock quantities
4. Use discount wisely (not too high)
5. Update pricing regularly based on market

### Managing Orders
1. Process orders within 24 hours
2. Update status regularly for customer info
3. Review customer notes for special requests
4. Monitor pending orders during business hours

### User Management
1. Promote trusted users to admin only
2. Deactivate accounts for suspicious activity
3. Review user permissions regularly
4. Keep admin count minimal for security

## Troubleshooting

### Image Upload Fails
- Check file format (PNG, JPG, JPEG, GIF, WebP only)
- Verify file size is under 5MB
- Check internet connection
- Try clearing browser cache

### Can't Access Admin Dashboard
- Verify you're logged in with admin account
- Check that `is_admin` field is true in user
- Clear browser localStorage and login again
- Check access token validity

### Order Status Won't Update
- Verify order exists and is not deleted
- Check JWT token expiration
- Ensure status is valid (pending, processing, shipped, delivered, cancelled)
- Refresh page and try again

## Future Enhancements

- [ ] Bulk product import from CSV
- [ ] Advanced inventory management with alerts
- [ ] Customer email notifications
- [ ] Commission/revenue per product tracking
- [ ] Return/refund management
- [ ] Multi-warehouse support
- [ ] Analytics export to PDF/Excel
- [ ] Scheduled stock syncing with suppliers

## Related Documentation

- [1688 Import Guide](./1688_IMPORT_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Setup Guide](./SETUP.md)
- [Quick Start](./QUICKSTART.md)
