# 🎭 Test Users for Retail CRM Desktop

Use these credentials to test different user roles and permissions.

---

## 👤 Test Users

### 1. Super Admin (Full Access)
- **Email:** `admin@shop.com`
- **Password:** `Admin123!`
- **Role:** SUPER_ADMIN
- **Permissions:** Everything - manage users, settings, all CRUD operations

### 2. Manager (Most Access)
- **Email:** `manager@shop.com`
- **Password:** `Manager123!`
- **Role:** ADMIN
- **Permissions:** Most operations except user management and critical settings

### 3. Cashier (Sales & Basic Operations)
- **Email:** `cashier@shop.com`
- **Password:** `Cashier123!`
- **Role:** CASHIER
- **Permissions:** Create sales, view inventory, basic customer operations

### 4. Sales Person (Sales Focus)
- **Email:** `sales@shop.com`
- **Password:** `Cashier123!`
- **Role:** CASHIER
- **Permissions:** Create sales, manage customers, view products

### 5. Test User (Your Original)
- **Email:** `test@shop.com`
- **Password:** `Test123456`
- **Role:** SUPER_ADMIN
- **Permissions:** Full access

### 6. Your Setup User
- **Email:** `mmm@gmail.com`
- **Password:** (whatever you set during setup)
- **Role:** SUPER_ADMIN
- **Permissions:** Full access

---

## 🧪 Testing Scenarios

### Test Different Roles:
1. Login as **Admin** - verify you can create users
2. Login as **Manager** - verify you can manage inventory
3. Login as **Cashier** - verify you can only make sales
4. Try accessing settings/users as Cashier - should be denied

### Test CRUD Operations:
1. **Products** - Create, edit, delete products
2. **Sales** - Create new sales, refund sales
3. **Customers** - Add customers, view history
4. **Inventory** - Adjust stock levels
5. **Expenses** - Record expenses

### Test Permissions:
- Try accessing admin features as Cashier
- Try deleting users as Manager
- Verify role-based UI elements show/hide correctly

---

## 🔑 Quick Login Test

PowerShell command to test any user:
```powershell
$body = '{"email":"admin@shop.com","password":"Admin123!"}'
Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -ContentType 'application/json' -Body $body
```

Replace email/password to test other users.

---

## 📊 Role Comparison

| Feature | SUPER_ADMIN | ADMIN | CASHIER |
|---------|-------------|-------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Create Sales | ✅ | ✅ | ✅ |
| View Products | ✅ | ✅ | ✅ |
| Manage Products | ✅ | ✅ | ❌ |
| Manage Inventory | ✅ | ✅ | ❌ |
| Manage Customers | ✅ | ✅ | ⚠️ Limited |
| View Reports | ✅ | ✅ | ⚠️ Limited |
| Manage Users | ✅ | ❌ | ❌ |
| Settings | ✅ | ⚠️ Limited | ❌ |
| Expenses | ✅ | ✅ | ❌ |

---

## 🎯 Recommended Test Flow

1. **Login as Admin** (`admin@shop.com`)
   - Create 2-3 products
   - Add some inventory
   - Create a customer

2. **Login as Cashier** (`cashier@shop.com`)
   - Make a sale
   - Try to access settings (should fail)
   - View products only

3. **Login back as Admin**
   - Check the sale was recorded
   - View reports
   - Adjust inventory

This will test the complete flow and permission system! 🚀
