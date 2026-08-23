## Quick Test - Check if Login Works

Run this command to test the backend login API directly:

### Windows PowerShell:
```powershell
$body = @{email='mmm@gmail.com';password='YOUR_PASSWORD_HERE'} | ConvertTo-Json
Invoke-RestMethod -Uri 'http://localhost:3001/auth/login' -Method POST -ContentType 'application/json' -Body $body
```

Replace `YOUR_PASSWORD_HERE` with your actual password.

### Expected Response if Working:
```json
{
  "access_token": "eyJhbGc...",
  "session_token": "abc123...",
  "user": {
    "id": "...",
    "email": "mmm@gmail.com",
    "role": "SUPER_ADMIN"
  }
}
```

### If you get an error:
- **401 Unauthorized** = Wrong password
- **Connection refused** = Backend not running
- **500 Internal Server Error** = Backend error (check backend console)

---

## Alternative: Run the Diagnostic Script

I've created `DIAGNOSE-LOGIN.bat` that will:
1. Check all services are running
2. Test the login API for you
3. Show you exactly what's failing

Run it:
```
DIAGNOSE-LOGIN.bat
```

It will ask for your password and test the backend login.

---

## Most Common Issues:

1. **Wrong Password** - Try resetting with `RESET-USERS.bat`
2. **Frontend CORS Issue** - The Electron app tries to connect from `file://` protocol
3. **Account Locked** - Too many failed login attempts

Let me know what error you see!
