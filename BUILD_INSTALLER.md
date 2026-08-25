# Building Retail CRM Desktop Installer

This guide explains how to create a distributable `.exe` installer for the Retail CRM Desktop application.

## What You Get

The installer will create a desktop application that:
- ✅ Includes a setup wizard for MySQL configuration
- ✅ Allows creating an admin account during first run
- ✅ Bundles the backend and frontend together
- ✅ Can be distributed to users without requiring separate setup

## Prerequisites

Before building the installer, ensure you have:

1. **Node.js** (v18 or higher) installed
2. **MySQL Server** installed and running on target machines
3. All project dependencies installed

## Build Instructions

### Option 1: Automated Build (Recommended)

Simply run the build script:

```bash
cd desktop-app
build-installer.bat
```

This script will:
1. Install desktop app dependencies
2. Install and build backend
3. Install and build frontend  
4. Create the Windows installer

### Option 2: Manual Build

If you prefer to build manually:

```bash
# 1. Install desktop app dependencies
cd desktop-app
npm install

# 2. Build backend
cd ../backend
npm install
npm run build

# 3. Build frontend
cd ../frontend
npm install
npm run build

# 4. Build installer
cd ../desktop-app
npm run dist:win
```

## Output

After successful build, you'll find the installer at:

```
desktop-app/dist/Retail CRM Setup 1.0.0.exe
```

## Installer Size & Contents

The installer will be approximately **200-400 MB** and includes:
- Electron runtime
- Backend API (NestJS)
- Frontend UI (Next.js)
- Node.js dependencies
- Setup wizard for first-time configuration

The installed app does not run `npm install` or require Node.js on the target
machine. Electron starts the bundled backend and Next.js standalone server
using its embedded Node runtime.

## First Run Experience

When a user installs and runs the application for the first time:

### Step 1: Database Configuration
- Enter MySQL host (default: 127.0.0.1)
- Enter MySQL port (default: 3306)
- Enter database name (default: retail_crm)
- Enter MySQL username (default: root)
- **Enter MySQL root password** ← This is where they provide their password
- App tests connection and runs migrations automatically

### Step 2: Admin Account Creation
- Enter admin full name
- Enter admin email
- Enter admin password (minimum 8 characters)
- Select preferred language (Arabic/French/English)

### Step 3: Launch
- Application starts automatically
- Backend runs on `http://localhost:3001`
- Frontend runs on `http://localhost:3000`
- Browser window opens with the CRM interface

## Distribution

Once built, you can:
- Share the `.exe` file via USB drive, network share, or download link
- Users can install on any Windows machine
- Each installation is independent with its own configuration

## Important Notes

### MySQL Requirement
- **MySQL must be installed separately** on each target machine
- The app doesn't bundle MySQL (for licensing and size reasons)
- Users need to know their MySQL root password during setup

### Port Requirements
The application uses:
- Port `3001` for backend API
- Port `3000` for frontend UI
- Ensure these ports are available

### Data Storage
- Database credentials are stored encrypted in: `%APPDATA%/retail-crm-desktop/config.enc`
- MySQL data is stored in the MySQL data directory
- Application logs are in: `%APPDATA%/retail-crm-desktop/logs/`

## Troubleshooting Build Issues

### "npm install" fails
```bash
# Clear npm cache
npm cache clean --force
# Try again
npm install
```

### Backend build fails
```bash
cd backend
# Regenerate Prisma client
npx prisma generate
# Try build again
npm run build
```

### Frontend build fails
```bash
cd frontend
# Remove build cache
rm -rf .next
# Try again
npm run build
```

### Installer too large
The default configuration includes all dependencies. To reduce size:
- Build with production dependencies only
- Consider using ASAR archive (already enabled by electron-builder)

### Missing icon error
If you get an icon error, the build will still work. To fix:
- Create a 256x256 PNG icon
- Convert to ICO format using online tools
- Save as `desktop-app/icon.ico`

## Advanced Configuration

### Customizing the Installer

Edit `desktop-app/package.json` under the `"build"` section:

```json
{
  "build": {
    "appId": "com.yourcompany.retailcrm",
    "productName": "Retail CRM",
    "win": {
      "target": "nsis",
      "icon": "icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### Building for Portable Version

To create a portable version (no installer):

```bash
npm run pack
```

This creates a folder in `dist/` that can be zipped and run without installation.

## Support

After distribution, users may need:
- MySQL installation guide
- Firewall configuration for ports 3000/3001
- Instructions for accessing the app after installation

The application can be accessed at `http://localhost:3000` after launch.
