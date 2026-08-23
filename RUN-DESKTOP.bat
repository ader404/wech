@echo off
REM ============================================================================
REM Retail CRM Desktop - Development Startup Script
REM ============================================================================
REM This script starts all required services for the desktop CRM:
REM 1. License API (port 3002)
REM 2. Backend API (port 3001)
REM 3. Frontend React App (port 3000)
REM 4. Desktop Electron App
REM ============================================================================

echo.
echo ============================================================================
echo   Retail CRM Desktop - Starting Development Environment
echo ============================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MySQL is running
echo [1/7] Checking MySQL...
netstat -an | find "3306" | find "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MySQL does not appear to be running on port 3306
    echo Please start MySQL before continuing
    pause
)
echo [OK] MySQL is running

REM Start License API
echo.
echo [2/7] Starting License API (port 3002)...
cd /d "%~dp0license-api"
if not exist "node_modules" (
    echo [INFO] Installing License API dependencies...
    call npm install
)
start "License API" cmd /k "node dist/main.js"
timeout /t 3 /nobreak >nul
echo [OK] License API started

REM Start Backend API
echo.
echo [3/7] Starting Backend API (port 3001)...
cd /d "%~dp0backend"
if not exist "node_modules" (
    echo [INFO] Installing Backend dependencies...
    call npm install
)
if not exist "dist" (
    echo [INFO] Building Backend...
    call npx nest build
)
start "Backend API" cmd /k "set PORT=3001 && node dist/main.js"
timeout /t 5 /nobreak >nul
echo [OK] Backend API started

REM Start Frontend React App
echo.
echo [4/7] Starting Frontend React App (port 3000)...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [INFO] Installing Frontend dependencies...
    call npm install
)
start "Frontend App" cmd /k "npm run dev"
timeout /t 8 /nobreak >nul
echo [OK] Frontend App starting (will be ready in ~10 seconds)

REM Start Desktop App
echo.
echo [5/7] Starting Desktop Electron App...
cd /d "%~dp0desktop-app"
if not exist "node_modules" (
    echo [INFO] Installing Desktop App dependencies...
    call npm install
)
start "Desktop App" cmd /k "npm start"
timeout /t 2 /nobreak >nul
echo [OK] Desktop App started

echo.
echo ============================================================================
echo   All services started successfully!
echo ============================================================================
echo.
echo   License API:        http://localhost:3002
echo   License Dashboard:  http://localhost:3002/dashboard.html
echo   Backend API:        http://localhost:3001
echo   Frontend App:       http://localhost:3000
echo   Desktop App:        Electron window will open
echo.
echo   IMPORTANT: Wait ~10-15 seconds for Frontend to finish starting
echo              before the Desktop app will work properly!
echo.
echo   Press Ctrl+C in each window to stop the services
echo   Or close this window to continue in background
echo ============================================================================
echo.
pause
