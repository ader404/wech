# Phase 6: First-Run Setup Wizard — Manual Test Instructions

## What was built

**Backend (NestJS):**
- `SetupModule` with 3 unauthenticated endpoints:
  - `GET /api/setup/status` — returns `{isComplete: boolean}` (true if any user exists)
  - `POST /api/setup/test-connection` — tests MySQL credentials without affecting app state
  - `POST /api/setup/bootstrap-admin` — creates the first SUPER_ADMIN account (self-locks: refuses if any user already exists, transaction-guarded to prevent races)

**Desktop App (Electron):**
- `main.js` — secure config storage via `safeStorage` (Windows DPAPI-backed encryption), first-run detection (checks for `config.enc` in userData), launches either `setup.html` (wizard) or main app based on config existence
- `preload.js` — context bridge exposing safe IPC APIs (`configExists`, `loadConfig`, `saveConfig`, `setupComplete`)
- `setup.html` — 5-step wizard with inline CSS/JS:
  1. **License Activation** (stubbed — accepts any key, stores it locally, shows warning that validation is disabled)
  2. **Admin Account** — name, email, password (min 8 chars, confirmed)
  3. **MySQL Setup** — host/port/database/user/password with "Test Connection" button (calls `/api/setup/test-connection`)
  4. **Database Initialization** — calls `/api/setup/bootstrap-admin` to create the admin user
  5. **Complete** — saves config via `setupComplete` IPC, closes wizard, launches main app

## How to test manually

### Prerequisites
1. MySQL running on `localhost:3306` with an empty database (e.g. `retail_crm_fresh`)
2. Backend built: `cd backend && pnpm build`
3. No existing Electron config (delete `%APPDATA%\Roaming\retail-crm-desktop\config.enc` if it exists from a prior run)

### Steps

1. **Start backend pointing at the fresh database:**
   ```bash
   cd backend
   DATABASE_URL="mysql://root:<password>@localhost:3306/retail_crm_fresh" PORT=3001 node dist/src/main.js
   ```
   Confirm it starts and logs `Application running on 127.0.0.1:3001`.

2. **Launch Electron:**
   ```bash
   cd desktop-app
   npm start
   ```
   The wizard window should open (800×700px, not resizable) showing **Step 1: License Activation**.

3. **Walk through the wizard:**
   - **Step 1 (License):** Enter any string (e.g. `TEST-1234-5678-ABCD`), note the warning banner. Click **Next**.
   - **Step 2 (Admin Account):** Fill in name, email, password (8+ chars), confirm password. Click **Next**.
   - **Step 3 (MySQL):** Enter your MySQL credentials (host, port, database, user, password). Click **Test Connection** — should show green "Connection successful!" alert. Click **Next**.
   - **Step 4 (DB Init):** Click **Initialize** — button shows spinner "Initializing...", then green "Database initialized successfully!" alert. After 1 second, auto-advances to Step 5.
   - **Step 5 (Complete):** Shows green checkmark icon and "Setup Complete!" message. Click **Launch Retail CRM**.

4. **Verify the result:**
   - Wizard window closes, main app window opens (1400×900px, loads `http://localhost:3000` by default — you'll see the frontend if it's running, or a "cannot connect" error if not, which is fine for this test).
   - Encrypted config saved to `%APPDATA%\Roaming\retail-crm-desktop\config.enc` (binary file, ~300-500 bytes).
   - Admin user exists in the database:
     ```sql
     SELECT id, name, email, role FROM users;
     ```
     Should return one row with `role='SUPER_ADMIN'` and the email you entered.
   - Re-launch Electron (`npm start` again) — it should skip the wizard and go straight to the main app window, because `config.enc` now exists.

5. **Test the self-lock:**
   - With the admin user still in the DB, try calling bootstrap-admin again:
     ```bash
     curl -X POST http://127.0.0.1:3001/api/setup/bootstrap-admin \
       -H "Content-Type: application/json" \
       -d '{"name":"Hacker","email":"hacker@test.com","password":"Test1234!"}'
     ```
   - Should return `403 Forbidden` with message "Setup already completed — an administrator account already exists".

## Automated verification (curl-based, backend only)

The backend endpoints were tested programmatically:

```bash
# Fresh database with zero users
curl http://127.0.0.1:3001/api/setup/status
# → {"isComplete":false}

# Test connection
curl -X POST http://127.0.0.1:3001/api/setup/test-connection \
  -H "Content-Type: application/json" \
  -d '{"host":"localhost","port":3306,"database":"retail_crm_wizard_test","user":"root","password":"..."}'
# → {"success":true,"message":"Connection successful"}

# Bootstrap admin
curl -X POST http://127.0.0.1:3001/api/setup/bootstrap-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Wizard Admin","email":"wizard@test.com","password":"Wizard1234!"}'
# → {user object with role: SUPER_ADMIN}

# Status now complete
curl http://127.0.0.1:3001/api/setup/status
# → {"isComplete":true}

# Second bootstrap attempt refused
curl -X POST http://127.0.0.1:3001/api/setup/bootstrap-admin ...
# → 403 Forbidden
```

All passed.

## What's stubbed (to be wired in Phase 7)

- **License validation**: The wizard accepts any license key and saves it to config, but doesn't call a real license API. The "Test Connection" button on Step 3 is real; the license field on Step 1 is purely local storage for now.

## Security notes

- **Config encryption**: `safeStorage.encryptString()` uses Windows DPAPI (or Keychain on macOS, libsecret on Linux) — encrypted data is tied to the current Windows user account and cannot be decrypted on another machine or by another user.
- **No plaintext credentials**: The encrypted `config.enc` file is the only place MySQL credentials live on disk. The app never writes `.env` or logs passwords.
- **Setup endpoints are unauthenticated by design**: This is safe because `bootstrap-admin` self-locks (refuses once any user exists), and the endpoint only runs when the backend is freshly installed with zero users — not a production risk once the first admin is created.

## Files changed/added

**Backend:**
- `src/modules/setup/setup.module.ts` (new)
- `src/modules/setup/setup.controller.ts` (new)
- `src/modules/setup/setup.service.ts` (new)
- `src/modules/setup/dto/bootstrap-admin.dto.ts` (new)
- `src/modules/setup/dto/test-connection.dto.ts` (new)
- `src/app.module.ts` (added SetupModule import)
- `package.json` (added `mysql2` dependency for test-connection)

**Desktop App:**
- `main.js` (complete rewrite: config storage, first-run detection, wizard/main window logic, IPC handlers)
- `preload.js` (new: context bridge)
- `setup.html` (new: 5-step wizard UI)

## Next steps (Phase 7)

- Build License API (generate/validate license keys tied to machine IDs)
- Wire the wizard's License Activation step to call the real API instead of accepting any input
- Add license check to backend startup (refuse to run if license is invalid/expired)
