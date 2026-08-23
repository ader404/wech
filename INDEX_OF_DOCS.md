# Retail CRM Desktop - All Documentation

This document lists all guides and scripts available.

## 🚀 Getting Started

1. **RUN-DESKTOP.bat** - Start all services (License API, Backend, Frontend, Desktop App)
2. **COMPLETE_LOGIN_FIX.md** - Step-by-step guide to fix login issues
3. **FINAL_STATUS_REPORT.md** - Complete project status and architecture

## 🔧 Troubleshooting

1. **LOGIN_TROUBLESHOOTING.md** - Common login issues and solutions
2. **DIAGNOSE-LOGIN.bat** - Automated diagnostic tool
3. **BACKEND_RESTART_GUIDE.md** - How to restart backend properly
4. **QUICK_LOGIN_TEST.md** - Test backend API directly

## 🔄 Maintenance

1. **RESET-USERS.bat** - Clear all users and config (start fresh)
2. **BATCH_SCRIPTS_README.md** - Documentation for all .bat files

## 📊 Project Documentation

1. **FINAL_STATUS_REPORT.md** - Build status, what's complete, what remains
2. **PHASE7_PROGRESS_REPORT.md** - Detailed implementation log
3. **PHASE7_STATUS.md** - Phase 7 status summary

## 🗄️ Database

1. **backend/scripts/migrate-to-single-shop.sql** - Database migration (already executed)
2. **backend/prisma/schema.prisma** - Current single-shop schema

## 📝 Quick Reference

### Start Everything
```bash
RUN-DESKTOP.bat
```

### Reset and Start Fresh
```bash
RESET-USERS.bat
RUN-DESKTOP.bat
```

### Test Backend Login
```bash
DIAGNOSE-LOGIN.bat
```

### Your Current User
- Email: mmm@gmail.com
- Role: SUPER_ADMIN

### Service URLs
- Backend API: http://localhost:3001/api
- Frontend: http://localhost:3000
- License API: http://localhost:3002
- License Dashboard: http://localhost:3002/dashboard.html

---

**Having Issues?**
Start with `COMPLETE_LOGIN_FIX.md` - it has the complete solution!
