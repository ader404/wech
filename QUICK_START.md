# Retail CRM Desktop - Quick Start

## 🚀 What You Have Now

Your desktop app is ready with:
- ✅ Setup wizard for MySQL configuration
- ✅ Admin account creation during first run
- ✅ Bundled backend and frontend
- ✅ Professional Windows installer

## 📦 Build the Installer (.exe)

### Option 1: One-Click Build (Easiest)
```
Double-click: BUILD.bat
```

### Option 2: Manual Command
```bash
cd desktop-app
npm install
npm run dist:win
```

**Output**: `desktop-app/dist/Retail CRM Setup 1.0.0.exe`

## 🧪 Test Before Building

```
Double-click: TEST.bat
```

This will:
1. Install dependencies automatically
2. Launch the setup wizard
3. Let you test the full flow

## 📋 Setup Wizard Flow

### When users run your .exe for the first time:

**Step 1: Database Configuration**
```
Host: localhost
Port: 3306
Database: retail_crm
Username: root
Password: [USER ENTERS THEIR MYSQL PASSWORD HERE] ← KEY REQUIREMENT
```
Click "Test & Continue" → App tests connection and runs migrations

**Step 2: Create Admin Account**
```
Full Name: [User's name]
Email: [Login email]
Password: [Min 8 characters]
Language: Arabic/French/English
```
Click "Create & Continue" → Admin account created in database

**Step 3: Launch**
```
Click "Launch Application" → App starts automatically
```

## 📁 What Gets Packaged

The installer includes:
- Electron runtime
- Setup wizard (setup.html)
- Backend code (NestJS)
- Frontend code (Next.js)
- All dependencies
- Configuration handler

**Does NOT include**:
- MySQL (users must install separately)
- Database data (created during setup)

## 🔧 System Requirements for Users

**Operating System**: Windows 10/11 (64-bit)
**MySQL**: 5.7 or higher (MUST be pre-installed)
**RAM**: 4GB minimum, 8GB recommended
**Disk**: 500MB for app + database storage
**Ports**: 3000 and 3001 must be available

## 📤 Distribution

After building, share the file:
```
desktop-app/dist/Retail CRM Setup 1.0.0.exe
```

Users can:
- Install on any Windows machine
- Each installation is independent
- No internet required after download

## ⚠️ Important Notes

### MySQL Password
- Users MUST have MySQL installed before running your app
- They MUST know their MySQL root password
- The password is entered during the setup wizard
- It's stored encrypted in `%APPDATA%/retail-crm-desktop/config.enc`

### One-Time Setup
- Setup wizard only shows on first run
- If user wants to reconfigure: Delete `%APPDATA%/retail-crm-desktop/config.enc`

### After Setup
- Desktop shortcut is created automatically
- App can be launched from Start Menu
- Opens browser automatically at http://localhost:3000

## 🐛 Common Build Issues

**"npm not found"**
→ Install Node.js from nodejs.org

**"Prisma client not generated"**
```bash
cd backend
npx prisma generate
```

**"Frontend build fails"**
```bash
cd frontend
rm -rf .next
npm run build
```

**"No icon" warning**
→ Build still works, just won't have a custom icon

## 📊 Build Size

Expected installer size: **200-400 MB**

This is normal because it includes:
- Electron (Chromium browser)
- Node.js runtime
- All npm dependencies
- Backend + Frontend code

## 🎯 Next Steps

1. **Test first**: Run `TEST.bat` to verify everything works
2. **Build installer**: Run `BUILD.bat` to create the .exe
3. **Test installer**: Install on a clean Windows machine
4. **Distribute**: Share the .exe file with your users

## 📞 Need Help?

Check these files for more details:
- `BUILD_INSTALLER.md` - Detailed build instructions
- `USER_GUIDE.md` - End-user instructions
- `desktop-app/package.json` - Build configuration

---

**Ready to build?** Just run `BUILD.bat` and wait 10-15 minutes! ⏱️
