# License API — Implementation Status & Guide

## What's Complete

### Backend API (NestJS + Neon PostgreSQL)
✅ Complete license management system built at `C:\Users\amoh0\Desktop\CRMs\retail-crm-desktop\license-api`

**Prisma Schema:**
- `Customer` — license holders (name, email, phone, company)
- `License` — license keys with max devices, expiration, revocation
- `Activation` — device bindings (deviceId, deviceName, lastCheckAt)
- `Admin` — dashboard authentication

**Core Services:**
- `LicensesService` — generate keys (XXXX-XXXX-XXXX-XXXX format), validate, revoke, CRUD
- `ActivationsService` — activate/deactivate devices, periodic validation, HMAC-signed responses
- `CustomersService` — customer CRUD
- `AuthService` — admin JWT authentication

**REST Endpoints:**

Public (no auth required, for desktop apps):
- `POST /api/activations/activate` — activate a license on a device
- `POST /api/activations/check` — periodic validation check (returns signed response)
- `POST /api/activations/deactivate` — remove a device activation

Admin (requires JWT Bearer token):
- `POST /api/auth/login` — get JWT token
- `POST /api/auth/create-admin` — create first admin account
- `GET /api/customers` — list all customers
- `POST /api/customers` — create customer
- `GET /api/licenses` — list all licenses
- `POST /api/licenses` — generate new license
- `POST /api/licenses/:key/revoke` — revoke a license
- `GET /api/activations` — list all device activations

**Swagger docs:** Available at `http://localhost:3002/api/docs` when running

### Security Features
✅ HMAC-signed activation responses (desktop validates signature to prevent tampering)
✅ Device binding via `deviceId` (hardware-based identifier)
✅ Max devices enforcement per license
✅ Revocation support with reason logging
✅ Expiration date support
✅ JWT-protected admin endpoints

## Build & Run Commands

```bash
cd license-api

# Generate Prisma client (required before first build)
npx prisma generate

# Push schema to Neon PostgreSQL (creates tables)
npx prisma db push

# Build
npx nest build

# Development mode (auto-reload)
pnpm start:dev

# Production mode
pnpm start:prod
```

**Environment variables** (create `.env` from `.env.example`):
- `DATABASE_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — admin authentication secret
- `ACTIVATION_SECRET` — HMAC signature secret for activation responses
- `PORT` — defaults to 3002

## What's Still Needed

### 1. Admin Dashboard UI
Need a simple HTML/JS dashboard at `license-api/public/index.html`:
- Login form → calls `/api/auth/login`, stores JWT in localStorage
- Customers tab: list, create, edit customers
- Licenses tab: list licenses, generate new (select customer, max devices, expiration), revoke
- Activations tab: view all device activations, deactivate devices
- Use fetch() with `Authorization: Bearer <token>` header

### 2. Desktop Integration
Modify `retail-crm-desktop/desktop-app/main.js`:
- On first launch (after wizard), call `POST /api/activations/activate` with license key + deviceId
- Store signed activation response in encrypted config
- On startup, call `POST /api/activations/check` every 24h
- **Offline grace period:** if check fails, allow 7 days offline before blocking app
- **DeviceId generation:** use machine-id or hardware hash (CPU+motherboard serial)

### 3. Wizard Integration
Update `retail-crm-desktop/desktop-app/setup.html` Step 1:
- Remove stub warning
- On "Next", call `POST /api/activations/activate` (real API, not stubbed)
- Handle errors: LICENSE_NOT_FOUND, LICENSE_REVOKED, MAX_DEVICES_REACHED
- Store signed response in config

### 4. Single-Shop Conversion (Phase 7I-7J per `4.txt`)
**Phase 7I — Remove branch architecture:**
- Audit `retail-crm-desktop/backend/prisma/schema.prisma`
- Remove `branchId` from models where safe (Sales, Expenses, Inventory movements — these are now single-shop)
- Keep `Branch` model but repurpose as "Shop Settings" (single row, stores shop name/logo/address)
- Update all services to remove branch filters/params
- Remove branch CRUD from frontend

**Phase 7J — Single-shop dashboard:**
- Replace branch comparison charts with single-shop metrics:
  - Today's Revenue
  - Low Stock Alerts (< 10 units)
  - Top 5 Products (by sales)
  - Sales Trend (7-day chart)
  - Recent Transactions
- Update `frontend/app/(app)/dashboard/page.tsx`

## Testing the License API

### 1. Create first admin
```bash
curl -X POST http://localhost:3002/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailcrm.com","password":"Admin123!","name":"Admin User"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retailcrm.com","password":"Admin123!"}'
```
Save the `access_token` from response.

### 3. Create customer
```bash
curl -X POST http://localhost:3002/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Test Shop","email":"shop@test.com","company":"Test Corp"}'
```
Save the customer `id`.

### 4. Generate license
```bash
curl -X POST http://localhost:3002/api/licenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"customerId":"<customer-id>","maxDevices":1}'
```
Save the `licenseKey`.

### 5. Activate (desktop simulation)
```bash
curl -X POST http://localhost:3002/api/activations/activate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"<key>","deviceId":"test-device-123","deviceName":"Test PC"}'
```
Returns signed activation response with `signature` field.

### 6. Check (periodic validation)
```bash
curl -X POST http://localhost:3002/api/activations/check \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"<key>","deviceId":"test-device-123"}'
```
Returns refreshed signed response.

### 7. Revoke
```bash
curl -X POST http://localhost:3002/api/licenses/<key>/revoke \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason":"Customer requested refund"}'
```

## Current Project Structure

```
retail-crm-desktop/
├── backend/                 # Main CRM backend (MySQL)
├── frontend/                # Next.js CRM UI
├── desktop-app/             # Electron wrapper
│   ├── main.js             # ✅ Setup wizard, config encryption
│   ├── setup.html          # ✅ 5-step wizard (license stub)
│   └── preload.js          # ✅ IPC bridge
├── license-api/             # ✅ NEW: License management API
│   ├── prisma/
│   │   └── schema.prisma   # ✅ Customer/License/Activation/Admin
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # ✅ JWT login
│   │   │   ├── customers/  # ✅ Customer CRUD
│   │   │   ├── licenses/   # ✅ Generate/validate/revoke
│   │   │   └── activations/# ✅ Device binding + signed responses
│   │   ├── prisma/         # ✅ PrismaService
│   │   └── main.ts         # ✅ Bootstrap
│   └── dist/               # ✅ Built JS output
└── PHASE6_TEST_INSTRUCTIONS.md  # ✅ Wizard test guide
```

## Next Implementation Steps

1. **Admin Dashboard UI** (2-3 hours)
   - Single HTML file with tabs
   - JWT storage + fetch wrappers
   - Forms for customer/license CRUD

2. **Desktop License Integration** (3-4 hours)
   - Device ID generation (machine-id npm package)
   - Activation flow in wizard
   - Periodic check on startup
   - Offline grace period (7 days)
   - Block app if license invalid + show error dialog

3. **Single-Shop Conversion** (4-6 hours)
   - Remove branchId from schema (Sales, Expenses, InventoryMovement, etc.)
   - Repurpose Branch → ShopSettings (single row)
   - Update all backend services (remove branch filters)
   - Remove branch UI from frontend
   - Build single-shop dashboard (Today's Revenue, Low Stock, Top Products, Sales Trend)

4. **Final Integration Testing** (2-3 hours)
   - Fresh DB install → wizard → license activation → CRM usage
   - Test offline grace period
   - Test license revocation (should block app)
   - Test max devices (try activating on 2nd device, should fail)
   - Build Windows installer with `electron-builder`

## Deployment Notes

**License API:**
- Deploy to any Node.js host (Render, Railway, Fly.io, VPS)
- Neon PostgreSQL is serverless (no manual DB management)
- Set production `JWT_SECRET` and `ACTIVATION_SECRET` as env vars

**Desktop App:**
- Bundle with `electron-builder` (creates .exe installer)
- Point `FRONTEND_URL` env var at bundled Next.js static export (not localhost:3000)
- Hardcode license API URL in production build (not localhost:3002)

## Known Limitations

- Admin dashboard is single-user (no role-based permissions yet)
- No license renewal flow (manual DB update for now)
- Offline grace period is desktop-side only (not cryptographically enforced — a determined user could bypass by editing config, but signature validation prevents license forgery)
- No usage analytics (device last-seen is tracked, but no telemetry beyond that)

---

**Status:** License API backend is 100% complete and tested via curl. Admin dashboard UI, desktop integration, and single-shop conversion remain.
