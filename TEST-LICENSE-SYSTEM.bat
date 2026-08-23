@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM  END-TO-END LICENSE SYSTEM TEST
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════════════════╗
echo ║  License System - Complete Integration Test                            ║
echo ╚════════════════════════════════════════════════════════════════════════╝
echo.

echo [Step 1] Verifying License API is running...
curl -s http://localhost:4000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] License API not running on port 4000
    echo Please run: cd retail-crm-license-dashboard ^&^& RUN-LICENSE-DASHBOARD.bat
    pause
    exit /b 1
)
echo ✓ License API is running

echo.
echo [Step 2] Verifying Dashboard is running...
curl -s http://localhost:4100 >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Dashboard not running on port 4100
    echo Please run: cd retail-crm-license-dashboard ^&^& RUN-LICENSE-DASHBOARD.bat
    pause
    exit /b 1
)
echo ✓ Dashboard is running

echo.
echo [Step 3] Starting Desktop App with Neon License UI...
echo.
cd desktop-app
start "Retail CRM Desktop" cmd /k "npm start"

echo.
echo ════════════════════════════════════════════════════════════════════════
echo   TEST STEPS:
echo.
echo   1. Dashboard: http://localhost:4100
echo      - Log in
echo      - Products → Add "Retail CRM Desktop" (slug: retail-crm-desktop)
echo      - Customers → Add a test customer
echo      - Licenses → Generate License
echo      - COPY THE LICENSE KEY (shown only once!)
echo.
echo   2. Desktop App (just opened):
echo      - Setup wizard will appear
echo      - Paste the license key
echo      - Click "Activate License"
echo      - Should activate successfully with neon UI
echo.
echo   3. Verification:
echo      - Close and restart the desktop app
echo      - Should launch without setup wizard
echo      - License validated in background
echo.
echo ════════════════════════════════════════════════════════════════════════
echo.
pause
