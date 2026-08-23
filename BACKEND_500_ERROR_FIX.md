# Backend 500 Error - Manual Fix Guide

The backend is returning 500 errors. Here's how to fix it:

## Quick Fix Steps:

### 1. Stop Everything
```bash
taskkill /F /IM node.exe
taskkill /F /IM Electron.exe
```

### 2. Check Backend Window for Errors
When you run RUN-DESKTOP.bat, a window opens titled "Backend API"
- Look for RED error messages
- Common errors:
  - Database connection failed
  - Missing tables
  - Prisma client not generated
  - Module not found

### 3. Rebuild Backend
```bash
cd backend
npm install
npx prisma generate --force
npx nest build
```

### 4. Start Again
```bash
RUN-DESKTOP.bat
```

## If Rebuild Fails:

### Option A: Fresh Node Modules
```bash
cd backend
rmdir /s /q node_modules
npm install
npx prisma generate
npx nest build
```

### Option B: Check Database
Make sure MySQL is running and accessible:
```bash
mysql -u root -p136083153Aderdour retail_crm -e "SELECT COUNT(*) FROM users;"
```

### Option C: Check .env File
Make sure `backend/.env` has:
```
DATABASE_URL="mysql://root:136083153Aderdour@localhost:3306/retail_crm"
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Test Credentials:
- **Email:** test@shop.com
- **Password:** Test123456

Once backend starts without errors, login should work!
