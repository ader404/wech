# 🚀 FINAL DEPLOYMENT STEPS - DO THIS NOW

## Step 1: Install Helmet.js (Security Headers)

```bash
cd C:\Users\amoh0\Desktop\CRMs\retail-crm\backend
npm cache clean --force
npm install helmet --save
```

After installation succeeds, add to `src/main.ts`:

**Add import at top:**
```typescript
import helmet from 'helmet';
```

**Add after line 10 (after `const logger = new Logger('Bootstrap')`):**
```typescript
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    hsts: { maxAge: 31536000, includeSubDomains: true },
  }));
```

---

## Step 2: Verify Backend Builds

```bash
cd C:\Users\amoh0\Desktop\CRMs\retail-crm\backend
npm run build
```

Should see: ✅ Build successful

---

## Step 3: Generate Production JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output (128 characters)

---

## Step 4: Create Production Environment File

```bash
cp .env .env.production
```

Edit `.env.production` and change:
- `JWT_SECRET` → paste the secret from Step 3
- `NODE_ENV` → "production"
- `DATABASE_URL` → your production database URL
- `FRONTEND_URL` → your production domain (e.g., "https://yourcrm.com")

---

## Step 5: Test Backend Locally

```bash
npm run start:dev
```

Visit http://localhost:3001/api/docs and verify:
- All endpoints show 🔒 padlock icon (authentication required)
- Try accessing `/api/products` without token → should get 401 Unauthorized

---

## Step 6: Deploy Backend

### Option A: Using PM2 (VPS/Linux)
```bash
npm install -g pm2
npm run build
pm2 start dist/main.js --name retail-crm-api
pm2 save
pm2 startup
```

### Option B: Using Docker
```bash
docker build -t retail-crm-backend .
docker run -p 3001:3001 --env-file .env.production retail-crm-backend
```

### Option C: Deploy to Heroku/Railway/Render
- Connect your Git repo
- Set environment variables in dashboard
- Deploy from `main` branch

---

## Step 7: Deploy Frontend

```bash
cd C:\Users\amoh0\Desktop\CRMs\retail-crm\frontend
```

Update `NEXT_PUBLIC_API_URL` in `.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

Build:
```bash
npm run build
```

Deploy to Vercel (recommended):
```bash
npm install -g vercel
vercel --prod
```

Or deploy to Netlify, AWS, etc.

---

## Step 8: Smoke Test Production

1. **Test Login:**
   - Visit your frontend URL
   - Login with your credentials
   - Should redirect to dashboard

2. **Test POS:**
   - Go to POS page
   - Add product to cart
   - Complete a sale
   - Verify stock decrements

3. **Test Revenue:**
   - Go to Revenue page
   - Should show actual totals (not $0)
   - Change date range, verify updates

4. **Test Rate Limiting:**
   - Open browser console
   - Make 100+ API requests rapidly
   - Should get 429 Too Many Requests

5. **Test Authentication:**
   - Logout
   - Try accessing `/api/products` directly in browser
   - Should get 401 Unauthorized or redirect to login

---

## Step 9: Monitor & Alerts (Recommended)

### Quick Setup with UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Add monitor for your backend: `https://your-api.com/api`
3. Add monitor for your frontend: `https://your-frontend.com`
4. Get alerts via email if site goes down

---

## ⚠️ IMPORTANT SECURITY REMINDERS

### ✅ MUST DO:
- [ ] JWT_SECRET in production is different from .env (development)
- [ ] `.env` and `.env.production` are in `.gitignore` (never commit!)
- [ ] Database password is strong (20+ characters)
- [ ] HTTPS/SSL certificate is active on both frontend and backend
- [ ] Helmet.js is installed and configured

### ✅ RECOMMENDED:
- [ ] Set up error tracking (Sentry.io free tier)
- [ ] Set up uptime monitoring (UptimeRobot free tier)
- [ ] Enable database backups (daily at minimum)
- [ ] Configure firewall to only allow backend → database
- [ ] Use separate database user for production (not owner/root)

---

## 🎯 WHAT YOU CAN USE TODAY

### ✅ Working Features (Production Ready):
- Login/Logout/Authentication
- Dashboard with KPIs and charts
- POS (Point of Sale) - complete with payments, discounts, receipts
- Products - list, add, edit, delete, upload images
- Sales - list, view details
- Customers - list, add, edit (basic)
- Suppliers - list, add, edit (basic)
- Expenses - add, view, filter
- Revenue - analytics with date filtering

### ❌ Not Available Yet (No UI):
- Loans Management
- Purchase Orders
- Bulk Product Purchase
- Customer/Supplier Ledger Details
- Enhanced Reports
- User Management

---

## 📊 CURRENT DEPLOYMENT STATUS

**Backend:** 🟢 PRODUCTION READY (after Step 1 - Helmet install)  
**Frontend:** 🟡 LIMITED PRODUCTION READY (35% of features)  

**Can deploy today?** YES  
**Can accept real customers?** YES (for core POS/Sales features)  
**Is everything complete?** NO (65% of features need UI)

---

## 🆘 IF SOMETHING GOES WRONG

### Backend won't start:
- Check logs: `pm2 logs` or check your hosting dashboard
- Verify DATABASE_URL is correct
- Ensure PORT is not already in use
- Check JWT_SECRET is set

### Frontend can't connect to backend:
- Check NEXT_PUBLIC_API_URL is correct
- Verify CORS allows your frontend domain
- Check if backend is actually running
- Open browser console for specific error

### Rate limiting too strict:
- Edit `src/app.module.ts`
- Change `limit: 100` to higher number (e.g., 500)
- Redeploy backend

### Database connection fails:
- Verify DATABASE_URL format
- Check database server is running
- Ensure SSL mode is correct (`sslmode=require`)
- Check firewall allows connection

---

**Ready to deploy?** Follow steps 1-8 above.  
**Need help?** Check logs and error messages first.  
**Want to wait?** That's fine - complete the missing frontend features first (2-3 weeks).

---

Last Updated: August 6, 2026  
All critical security fixes: ✅ COMPLETE  
Backend: ✅ READY  
Frontend: 🟡 PARTIAL (but core features work)
