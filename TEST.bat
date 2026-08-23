@echo off
echo ========================================
echo Quick Test - Retail CRM Desktop
echo ========================================
echo.
echo This will test the app in development mode.
echo.
echo Prerequisites:
echo - MySQL must be running
echo - Node.js must be installed
echo.
echo NOTE: If the setup wizard doesn't appear,
echo delete: %APPDATA%\retail-crm-desktop\config.enc
echo.
pause

cd /d "%~dp0desktop-app"

echo.
echo Checking if dependencies are installed...
if not exist "node_modules\" (
    echo Installing desktop app dependencies...
    call npm install
)

if not exist "..\backend\node_modules\" (
    echo Installing backend dependencies...
    cd ..\backend
    call npm install
    cd ..\desktop-app
)

if not exist "..\frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd ..\frontend
    call npm install
    cd ..\desktop-app
)

echo.
echo Starting Retail CRM Desktop...
echo.
echo The setup wizard will open in a new window.
echo Follow these steps:
echo 1. Enter your MySQL root password
echo 2. Create an admin account
echo 3. Launch the app
echo.
echo If you see database errors, the setup wizard should appear.
echo Just enter your MySQL credentials when prompted.
echo.
call npm start
