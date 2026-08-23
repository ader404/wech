# License API + Admin Dashboard — Complete & Running

## ✅ What's Working Now

### License API Backend
- **Running at:** http://localhost:3002
- **Database:** SQLite at `license-api/prisma/license.db`
- **Swagger API docs:** http://localhost:3002/api/docs

### Admin Dashboard UI
- **URL:** http://localhost:3002/dashboard.html
- **Login credentials:**
  - Email: `admin@retailcrm.com`
  - Password: `Admin123!`

### Features Available
✅ Customer management (create, list, view)
✅ License generation with custom max devices & expiration
✅ License revocation with reason tracking
✅ Device activation tracking
✅ Overview dashboard with stats (total customers, active licenses, active devices)
✅ Public activation endpoints (no auth required for desktop apps)
✅ Admin-protected management endpoints (JWT authentication)
✅ HMAC-signed activation responses (prevents tampering)

## How to Use the Dashboard

### 1. Open the dashboard
Navigate to: http://localhost:3002/dashboard.html

### 2. Login
- Email: `admin@retailcrm.com`
- Password: `Admin123!`

### 3. Create a customer
- Click **Customers** tab
- Click **+ New Customer**
- Fill in: Name, Email, Company (optional), Phone (optional)
- Click **Create**

### 4. Generate a license
- Click **Licenses** tab
- Click **+ Generate License**
- Select a customer from dropdown
- Set max devices (default: 1)
- Set expiration date (optional, leave empty for perpetual)
- Click **Generate**
- The license key will appear (format: `XXXX-XXXX-XXXX-XXXX`)

### 5. View activations
- Click **Activations** tab
- See all devices that have activated licenses
- Shows device name, device ID, last check time, customer info

### 6. Revoke a license
- Go to **Licenses** tab
- Click **Revoke** button next to a license
- Enter a reason (e.g., "Customer requested refund")
- Click **Revoke License**
- All devices using this license will be immediately blocked

## API Endpoints Reference

### Public Endpoints (for desktop apps)

**Activate a license:**
```bash
POST http://localhost:3002/api/activations/activate
Content-Type: application/json

{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "unique-hardware-id",
  "deviceName": "John's PC"
}

Response:
{
  "valid": true,
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "unique-hardware-id",
  "expiresAt": "2027-12-31T23:59:59.000Z",
  "lastCheckAt": "2026-08-11T23:45:00.000Z",
  "timestamp": "2026-08-11T23:45:00.000Z",
  "signature": "abc123..." // HMAC signature for validation
}
```

**Periodic validation check:**
```bash
POST http://localhost:3002/api/activations/check
Content-Type: application/json

{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "unique-hardware-id"
}

Response: Same as activate (refreshed signature and timestamp)
```

**Deactivate a device:**
```bash
POST http://localhost:3002/api/activations/deactivate
Content-Type: application/json

{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "deviceId": "unique-hardware-id"
}

Response: { "success": true }
```

### Admin Endpoints (require JWT token)

**Login:**
```bash
POST http://localhost:3002/api/auth/login
Content-Type: application/json

{
  "email": "admin@retailcrm.com",
  "password": "Admin123!"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "email": "...", "name": "..." }
}
```

**List all customers:**
```bash
GET http://localhost:3002/api/customers
Authorization: Bearer <token>
```

**Create customer:**
```bash
POST http://localhost:3002/api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Shop Name",
  "email": "shop@example.com",
  "company": "Example Corp"
}
```

**List all licenses:**
```bash
GET http://localhost:3002/api/licenses
Authorization: Bearer <token>
```

**Generate license:**
```bash
POST http://localhost:3002/api/licenses
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer-id-here",
  "maxDevices": 1,
  "expiresAt": "2027-12-31T23:59:59.000Z"  // optional
}
```

**Revoke license:**
```bash
POST http://localhost:3002/api/licenses/XXXX-XXXX-XXXX-XXXX/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer requested refund"
}
```

## Commands Reference

### Start the license API (development)
```bash
cd C:\Users\amoh0\Desktop\CRMs\retail-crm-desktop\license-api
node dist/main.js
```

### Rebuild after code changes
```bash
cd license-api
npx nest build
```

### View database
```bash
cd license-api
npx prisma studio
# Opens GUI at http://localhost:5555
```

### Reset database (WARNING: deletes all data)
```bash
cd license-api
rm prisma/license.db
npx prisma db push
# Then recreate admin: curl -X POST http://localhost:3002/api/auth/create-admin ...
```

## Next Steps for Desktop Integration

### 1. Install machine-id package in desktop-app
```bash
cd desktop-app
npm install node-machine-id
```

### 2. Update `setup.html` Step 1 (License Activation)
Replace the stub with real API call:
```javascript
async function validateLicense() {
  const licenseKey = document.getElementById('licenseKey').value.trim()
  const deviceId = await window.electronAPI.getDeviceId() // IPC call to main process
  const deviceName = require('os').hostname()
  
  const response = await fetch('http://localhost:3002/api/activations/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey, deviceId, deviceName })
  })
  
  if (!response.ok) {
    const error = await response.json()
    showAlert(error.message || 'Activation failed', 'error')
    return false
  }
  
  const activation = await response.json()
  config.activation = activation // Store in config
  return true
}
```

### 3. Add device ID generation to `main.js`
```javascript
const { machineIdSync } = require('node-machine-id')

ipcMain.handle('device:getId', () => {
  return machineIdSync() // Hardware-based unique ID
})
```

### 4. Add periodic validation to `main.js`
```javascript
async function validateLicense() {
  const config = loadConfig()
  if (!config.activation) return false
  
  try {
    const response = await fetch('http://localhost:3002/api/activations/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: config.activation.licenseKey,
        deviceId: config.activation.deviceId
      })
    })
    
    if (!response.ok) {
      // License invalid (revoked, expired, etc.)
      return false
    }
    
    const activation = await response.json()
    
    // Verify HMAC signature to prevent tampering
    const crypto = require('crypto')
    const secret = 'activation-secret-change-me-in-production'
    const { signature, ...payload } = activation
    const expectedSig = crypto.createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    
    if (signature !== expectedSig) {
      console.error('Activation signature invalid')
      return false
    }
    
    // Update last check time in config
    config.activation = activation
    saveConfig(config)
    return true
  } catch (err) {
    // Network error - check offline grace period
    const lastCheck = new Date(config.activation.lastCheckAt)
    const daysSinceCheck = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysSinceCheck > 7) {
      // Offline for more than 7 days - block app
      return false
    }
    
    // Still within grace period - allow
    return true
  }
}

// Call on app startup
app.on('ready', async () => {
  const valid = await validateLicense()
  if (!valid) {
    dialog.showErrorBox(
      'License Invalid',
      'Your license is invalid, expired, or has been revoked. Please contact support.'
    )
    app.quit()
    return
  }
  
  createMainWindow()
})
```

## Production Deployment

### Switch to Neon PostgreSQL

1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Update `license-api/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
6. Push schema: `npx prisma db push`
7. Recreate admin account

### Deploy License API
- Deploy to Render, Railway, Fly.io, or any Node.js host
- Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `ACTIVATION_SECRET`
- Update desktop app to point at production URL (not localhost:3002)

### Secure the Dashboard
- Move dashboard to separate domain with HTTPS
- Add rate limiting (e.g., express-rate-limit)
- Add 2FA for admin accounts (future enhancement)

## File Structure

```
license-api/
├── prisma/
│   ├── schema.prisma          # Database schema (SQLite/PostgreSQL)
│   └── license.db             # SQLite database file
├── src/
│   ├── modules/
│   │   ├── auth/              # JWT authentication
│   │   ├── customers/         # Customer CRUD
│   │   ├── licenses/          # License generation & validation
│   │   └── activations/       # Device activation & periodic checks
│   ├── prisma/                # PrismaService
│   ├── common/guards/         # JWT auth guard
│   ├── app.module.ts
│   └── main.ts                # Server bootstrap + static file serving
├── public/
│   └── dashboard.html         # ✅ Admin dashboard UI
├── dist/                      # Built JS output
├── .env                       # Environment variables
└── package.json
```

## Known Limitations & Future Enhancements

**Current:**
- Single admin user (no multi-admin or roles)
- No license renewal flow (manual DB update for now)
- Offline grace period is client-side (can be bypassed by determined users, but signature validation prevents license forgery)
- No usage analytics beyond last-check tracking

**Future:**
- Multi-admin with role-based permissions
- License renewal/upgrade flows
- Usage telemetry (feature usage, crash reports)
- Email notifications for expiring licenses
- Customer self-service portal

---

**Status:** License API + Admin Dashboard are 100% complete and running. Desktop integration and single-shop conversion remain per `4.txt`.
