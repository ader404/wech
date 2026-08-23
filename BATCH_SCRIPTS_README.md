# Retail CRM Desktop - Batch Scripts

This directory contains helpful batch scripts for managing the desktop CRM.

## Available Scripts

### 🚀 RUN-DESKTOP.bat
**Purpose:** Start all services (License API, Backend API, Desktop App)

**Usage:**
```bash
RUN-DESKTOP.bat
```

**What it does:**
- Checks if MySQL is running
- Starts License API on port 3002
- Starts Backend API on port 3001
- Launches Desktop Electron App
- Installs dependencies if needed

---

### 🔄 RESET-USERS.bat
**Purpose:** Clear all users and configuration to start fresh

**Usage:**
```bash
RESET-USERS.bat
```

**What it does:**
- Deletes all users from the database
- Clears sessions and audit logs
- Removes desktop app config files
- Allows you to run setup wizard again

**⚠️ Warning:** This is destructive! Use only when you want to start fresh.

---

## Quick Start Guide

### First Time Setup
1. Ensure MySQL is running
2. Run `RUN-DESKTOP.bat`
3. Desktop app will open with setup wizard
4. Follow the wizard to create admin user and activate license

### Reset and Start Over
1. Close all running services
2. Run `RESET-USERS.bat`
3. Run `RUN-DESKTOP.bat` again
4. Go through setup wizard again

### Manual Start (Alternative)
If you prefer to start services individually:

```bash
# Terminal 1: License API
cd license-api
node dist/main.js

# Terminal 2: Backend
cd backend
set PORT=3001
node dist/src/main.js

# Terminal 3: Desktop App
cd desktop-app
npm start
```

## Service URLs

- **License API:** http://localhost:3002
- **License Dashboard:** http://localhost:3002/dashboard.html
  - Login: admin@retailcrm.com / Admin123!
- **Backend API:** http://localhost:3001
- **Desktop App:** Electron window

## Troubleshooting

### "MySQL is not running"
- Start MySQL service from Windows Services
- Or use MySQL Workbench to start the server

### "Admin already exists" on setup
- Run `RESET-USERS.bat` to clear existing users
- Then run `RUN-DESKTOP.bat` again

### License activation fails
- Ensure License API is running on port 3002
- Check license-api logs for errors
- Verify you have internet connection (for initial activation)

### Port already in use
- Stop any existing processes on ports 3001 or 3002
- Or change ports in the .env files

## Database Info

- **Database:** retail_crm
- **User:** root
- **Schema:** Single-shop architecture (no branches)

## Need Help?

See `FINAL_STATUS_REPORT.md` for complete system status and testing guide.
