# Desktop CRM Login Troubleshooting

## Issue: Can't login after setup completes

### Common Causes:

1. **Frontend not fully loaded**
   - The desktop app opens immediately but the React frontend (localhost:3000) takes 10-15 seconds to build
   - **Solution:** Wait 10-15 seconds after the Electron window opens, then refresh the page

2. **Wrong credentials**
   - Setup creates admin user, but credentials might not match
   - **Solution:** Check the database to see what user was created

3. **Backend not responding**
   - Backend API might not be ready when frontend loads
   - **Solution:** Check if Backend API is running on localhost:3001

---

## How to Fix

### Option 1: Wait and Refresh
1. After setup completes, the Electron window opens but shows "Loading..." or blank
2. **Wait 10-15 seconds** for the React app to build
3. Press `Ctrl+R` or `F5` to refresh the page
4. Login form should now appear

### Option 2: Check What User Was Created
Run this command to see users in database:
```bash
mysql -u root -p136083153Aderdour retail_crm -e "SELECT email, role FROM users;"
```

### Option 3: Check All Services Are Running
Make sure all 4 services are running:
- ✅ License API (port 3002)
- ✅ Backend API (port 3001)  
- ✅ Frontend App (port 3000) ← **This is critical!**
- ✅ Desktop Electron App

Use the updated `RUN-DESKTOP.bat` which now starts all 4 services.

---

## Testing Login Directly

Instead of using the Desktop app, test login in a regular browser:

1. Open browser: http://localhost:3000
2. Wait for page to load
3. Try logging in with the credentials you created during setup
4. If it works in browser but not in Electron, it's a timing issue

---

## Reset and Try Again

If still not working:

1. Run `RESET-USERS.bat` to clear everything
2. Run `RUN-DESKTOP.bat` to start all services
3. Complete setup wizard
4. **Wait 15 seconds** after setup completes
5. Press `Ctrl+R` in the Electron window to refresh
6. Try logging in

---

## Still Having Issues?

Check the browser console in Electron:
1. In the Electron window, press `Ctrl+Shift+I` to open DevTools
2. Go to Console tab
3. Look for errors (red messages)
4. Common errors:
   - `net::ERR_CONNECTION_REFUSED` = Backend not running
   - `404 Not Found` = Frontend not ready yet
   - `401 Unauthorized` = Wrong password

---

## Default Credentials

If you can't remember what you entered during setup, reset with `RESET-USERS.bat` and use:
- **Email:** admin@shop.com
- **Password:** (whatever you choose - minimum 8 characters)
