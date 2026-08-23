# Pre-Build Checklist

Before building your installer, verify these items:

## ✅ Prerequisites

### On Your Development Machine
- [ ] Node.js is installed (v18 or higher)
  - Check: `node --version`
- [ ] npm is available
  - Check: `npm --version`
- [ ] MySQL is installed and running
  - Check: Open MySQL Workbench or run `mysql --version`
- [ ] Git is installed (optional but recommended)
  - Check: `git --version`

### Project Files
- [ ] Backend folder exists with all files
- [ ] Frontend folder exists with all files
- [ ] Desktop-app folder has:
  - [ ] main.js
  - [ ] preload.js
  - [ ] setup.html
  - [ ] package.json

## 🧪 Test First (Recommended)

Before building the installer, test the app:

1. [ ] Run `TEST.bat`
2. [ ] Setup wizard opens
3. [ ] Can connect to MySQL (test with your root password)
4. [ ] Migrations run successfully
5. [ ] Admin account creates successfully
6. [ ] App launches in browser
7. [ ] Can login with admin credentials

**If all tests pass, you're ready to build!**

## 📦 Build Process

Run the build:
- [ ] Double-click `BUILD.bat` OR
- [ ] Run `cd desktop-app && npm run dist:win`

Wait 10-15 minutes for:
- [ ] Dependencies installation
- [ ] Backend build
- [ ] Frontend build
- [ ] Installer creation

## ✨ After Build

Check the output:
- [ ] File exists: `desktop-app/dist/Retail CRM Setup 1.0.0.exe`
- [ ] File size is reasonable (200-400 MB)
- [ ] No critical errors in console

## 🎯 Test the Installer

**Important:** Test on a clean system if possible!

1. [ ] Copy the .exe to another location (or another PC)
2. [ ] Run the installer
3. [ ] Complete installation
4. [ ] Launch the app
5. [ ] Go through setup wizard
6. [ ] Verify everything works

## 📤 Distribution Checklist

Before sharing with users:
- [ ] Create a user guide (already done: `USER_GUIDE.md`)
- [ ] Document system requirements
- [ ] Test on Windows 10 and Windows 11
- [ ] Verify MySQL prerequisite is clear
- [ ] Create support contact method

## 📋 What to Tell Users

Your users need to know:

### Before Installation
- [ ] "You must have MySQL installed first"
- [ ] "You need to know your MySQL root password"
- [ ] "Requires Windows 10/11 (64-bit)"
- [ ] "Needs 500MB disk space"

### During Installation
- [ ] "Follow the setup wizard"
- [ ] "Enter your MySQL root password when asked"
- [ ] "Create your admin account"

### After Installation
- [ ] "Launch from desktop shortcut"
- [ ] "Wait for browser to open automatically"
- [ ] "Login with your admin email and password"

## 🐛 Common Issues & Solutions

### Build fails at "npm install"
```bash
# Solution:
npm cache clean --force
npm install
```

### Build fails at backend build
```bash
# Solution:
cd backend
npx prisma generate
npm run build
```

### Build fails at frontend build
```bash
# Solution:
cd frontend
rm -rf .next
npm run build
```

### "Icon not found" warning
```
# This is OK! The build will work without a custom icon.
# To add icon: Place icon.ico in desktop-app/build/
```

### Installer too large
```
# This is normal (200-400 MB). It includes:
# - Electron runtime
# - Node.js
# - All dependencies
# - Backend and frontend code
```

## 🎉 Success Criteria

Your build is successful when:
- [x] No critical errors during build
- [x] .exe file is created in dist folder
- [x] Installer runs without errors
- [x] Setup wizard appears on first run
- [x] Can connect to MySQL
- [x] Admin account can be created
- [x] Application launches successfully
- [x] Can login and use the CRM

## 📞 Need Help?

Check these files:
- `QUICK_START.md` - Quick overview
- `BUILD_INSTALLER.md` - Detailed build instructions
- `README_DESKTOP.md` - Complete setup documentation
- `USER_GUIDE.md` - End-user instructions

---

## 🚀 Ready to Build?

If all items above are checked, run:

```
BUILD.bat
```

**Estimated time:** 10-15 minutes

**Output:** `desktop-app/dist/Retail CRM Setup 1.0.0.exe`

Good luck! 🎯
