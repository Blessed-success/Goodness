# Secure Credential Management System for Admin Users

## Overview

This guide explains how to set up and manage admin credentials securely in the BlessedNet system. The credential management system provides:

- **Secure password storage** with bcrypt hashing
- **Password history tracking** to prevent reuse
- **Account lockout** after failed login attempts
- **Role-based access control** (Admin vs Super Admin)
- **Audit trails** for compliance and security
- **Session management** with JWT tokens

## Quick Start: Creating a Super Admin

### Step 1: Register a User (if not already registered)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "email": "superadmin@blessednet.com",
    "password": "SuperAdmin@123456",
    "full_name": "Super Administrator",
    "phone": "+233123456789"
  }'
```

### Step 2: Promote User to Super Admin (Database)

Connect to your PostgreSQL database and run:

```sql
-- First, get the user ID
SELECT id FROM users WHERE email = 'superadmin@blessednet.com';

-- Then, create the admin credential
INSERT INTO admin_credentials (
    user_id,
    username,
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    1,  -- Replace with actual user ID
    'superadmin',
    'superadmin@blessednet.com',
    'hashed_password_here',  -- Use Python to generate: from werkzeug.security import generate_password_hash; generate_password_hash('SuperAdmin@123456')
    'super_admin',
    true,
    NOW(),
    NOW()
);

-- Update user to mark as admin
UPDATE users SET is_admin = TRUE WHERE email = 'superadmin@blessednet.com';
```

## API Endpoints

### 1. Create Admin Credential

**Endpoint:** `POST /api/admin/credentials/create`

**Required:** Super Admin Authentication

**Request:**
```json
{
  "user_id": 2,
  "username": "admin1",
  "email": "admin1@blessednet.com",
  "password": "Admin@123456",
  "role": "admin",
  "is_active": true
}
```

**Response:**
```json
{
  "message": "Admin credential created successfully",
  "data": {
    "id": 1,
    "user_id": 2,
    "username": "admin1",
    "email": "admin1@blessednet.com",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

### 2. List Admin Credentials

**Endpoint:** `GET /api/admin/credentials/list`

**Required:** Super Admin Authentication

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)
- `search` (string): Search by username or email
- `role` (string): Filter by 'admin' or 'super_admin'

**Response:**
```json
{
  "message": "Admin credentials retrieved successfully",
  "data": {
    "credentials": [
      {
        "id": 1,
        "user_id": 2,
        "username": "admin1",
        "email": "admin1@blessednet.com",
        "role": "admin",
        "is_active": true,
        "last_login": "2024-01-15T14:20:00",
        "last_password_change": "2024-01-15T10:30:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 3. Update Admin Password

**Endpoint:** `POST /api/admin/credentials/<credential_id>/update-password`

**Authentication:** Required (Super Admin or own credential)

**Request:**
```json
{
  "old_password": "OldPassword@123",
  "new_password": "NewPassword@456"
}
```

**Note:** Super admins can update other admin passwords without providing old password.

**Response:**
```json
{
  "message": "Password updated successfully",
  "data": {
    "credential_id": 1,
    "last_password_change": "2024-01-15T15:45:00"
  }
}
```

### 4. Get Credential Profile

**Endpoint:** `GET /api/admin/credentials/profile`

**Authentication:** Required

**Response:**
```json
{
  "message": "Profile retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 2,
    "username": "admin1",
    "email": "admin1@blessednet.com",
    "role": "admin",
    "is_active": true,
    "requires_password_change": false,
    "last_login": "2024-01-15T14:20:00",
    "last_password_change": "2024-01-15T10:30:00"
  }
}
```

### 5. Toggle Credential Active Status

**Endpoint:** `PUT /api/admin/credentials/<credential_id>/toggle-active`

**Required:** Super Admin Authentication

**Response:**
```json
{
  "message": "Credential activated",
  "data": {
    "id": 1,
    "username": "admin1",
    "is_active": true
  }
}
```

### 6. Unlock Credential

**Endpoint:** `POST /api/admin/credentials/<credential_id>/unlock`

**Required:** Super Admin Authentication

**Response:**
```json
{
  "message": "Credential unlocked successfully",
  "data": {
    "id": 1,
    "username": "admin1",
    "is_locked": false
  }
}
```

### 7. Get Password History

**Endpoint:** `GET /api/admin/credentials/<credential_id>/password-history`

**Authentication:** Required (Super Admin or own credential)

**Response:**
```json
{
  "message": "Password history retrieved",
  "data": {
    "credential_id": 1,
    "history": [
      {
        "id": 1,
        "changed_at": "2024-01-15T10:30:00"
      },
      {
        "id": 2,
        "changed_at": "2024-01-10T09:15:00"
      }
    ]
  }
}
```

### 8. Get Audit Log

**Endpoint:** `GET /api/admin/credentials/audit-log`

**Required:** Super Admin Authentication

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "message": "Audit log retrieved",
  "data": {
    "audit_entries": [
      {
        "credential_id": 1,
        "username": "admin1",
        "email": "admin1@blessednet.com",
        "role": "admin",
        "is_active": true,
        "last_login": "2024-01-15T14:20:00",
        "last_password_change": "2024-01-15T10:30:00",
        "updated_at": "2024-01-15T15:45:00",
        "updated_by": "superadmin@blessednet.com",
        "is_locked": false,
        "login_attempts": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 3,
      "pages": 1
    }
  }
}
```

## Security Features

### 1. Password Requirements

- Minimum 8 characters
- Must contain uppercase, lowercase, digits, and special characters
- Cannot reuse last 3 passwords
- Auto-hashed with bcrypt

### 2. Account Lockout

- Automatic lockout after 5 failed login attempts
- 30-minute lockout period
- Super admins can manually unlock
- Login attempts reset on successful login

### 3. Audit Trail

- All credential changes tracked
- Records who made the change (updated_by)
- Timestamps for all modifications
- Password change history maintained

### 4. Role-Based Access

- **Super Admin**: Can manage all credentials, create/modify/delete admin accounts
- **Admin**: Can only change their own password, view own profile
- **Customer**: No access to credential management

## Best Practices

### 1. Initial Setup

```bash
# Create super admin user
1. Register user via /api/auth/register
2. Promote to super_admin via database
3. Create admin credentials via /api/admin/credentials/create
```

### 2. Regular Password Changes

- Change passwords every 90 days
- Use strong, unique passwords
- Never share credentials
- Store in secure password manager

### 3. Monitoring

- Regularly review audit logs
- Check for suspicious login attempts
- Monitor last_login timestamps
- Deactivate unused accounts

### 4. Backup & Recovery

```sql
-- Backup admin credentials
BACKUP DATABASE blessednet;

-- If needed, reset password (database)
UPDATE admin_credentials 
SET password_hash = 'new_hashed_password' 
WHERE id = 1;
```

## Troubleshooting

### Account Locked

**Issue:** "Account is locked" error

**Solution:**
```bash
curl -X POST http://localhost:5000/api/admin/credentials/1/unlock \
  -H "Authorization: Bearer <super_admin_token>"
```

### Forgot Password

**Solution:** Super admin must reset via database or API

```bash
# Generate new hash in Python
from werkzeug.security import generate_password_hash
generate_password_hash('NewPassword@123')
```

### Cannot Create Admin Credential

**Checklist:**
- [ ] Authenticated as super admin
- [ ] User exists in users table
- [ ] No existing credential for that user
- [ ] Required fields provided
- [ ] Role is 'admin' or 'super_admin'

## Environment Configuration

Add to `.env`:

```env
# Credential Management
CREDENTIAL_PASSWORD_MIN_LENGTH=8
CREDENTIAL_PASSWORD_HISTORY_COUNT=3
CREDENTIAL_LOCKOUT_ATTEMPTS=5
CREDENTIAL_LOCKOUT_DURATION_MINUTES=30
CREDENTIAL_PASSWORD_EXPIRY_DAYS=90
```

## Database Schema

### admin_credentials Table

```sql
CREATE TABLE admin_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_password_change BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    login_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMP,
    role VARCHAR(50) DEFAULT 'admin',
    permissions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(120),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_history (
    id SERIAL PRIMARY KEY,
    admin_credential_id INTEGER NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (admin_credential_id) REFERENCES admin_credentials(id)
);
```

## Next Steps

1. Run database migration to create tables
2. Create super admin credentials
3. Configure role-based permissions
4. Set up audit log monitoring
5. Train admins on security best practices

For more information, see the main README.md and API_DOCUMENTATION.md.
