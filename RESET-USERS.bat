@echo off
REM ============================================================================
REM Retail CRM Desktop - Reset/Clear Users Script
REM ============================================================================
REM This script clears all users and config so you can start fresh with setup
REM ============================================================================

echo.
echo ============================================================================
echo   Retail CRM Desktop - Reset Users and Configuration
echo ============================================================================
echo.
echo [WARNING] This will DELETE:
echo   - All users from the database
echo   - All sessions and audit logs
echo   - Desktop app configuration files
echo.
echo You will need to run the setup wizard again after this.
echo.
pause
echo.

REM Check if MySQL is running
netstat -an | find "3306" | find "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL is not running on port 3306
    echo Please start MySQL first
    pause
    exit /b 1
)

echo [1/3] Clearing database users and sessions...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p136083153Aderdour retail_crm -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE password_history; TRUNCATE TABLE sessions; TRUNCATE TABLE audit_logs; TRUNCATE TABLE users; SET FOREIGN_KEY_CHECKS=1; SELECT 'Database cleared' as status;"

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to clear database
    pause
    exit /b 1
)
echo [OK] Database users cleared

echo.
echo [2/3] Clearing desktop app config...
if exist "%APPDATA%\retail-crm-desktop" (
    rmdir /s /q "%APPDATA%\retail-crm-desktop"
    echo [OK] AppData config cleared
) else (
    echo [INFO] AppData config does not exist
)

if exist "%LOCALAPPDATA%\retail-crm-desktop" (
    rmdir /s /q "%LOCALAPPDATA%\retail-crm-desktop"
    echo [OK] LocalAppData config cleared
) else (
    echo [INFO] LocalAppData config does not exist
)

echo.
echo [3/3] Verifying...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p136083153Aderdour retail_crm -e "SELECT COUNT(*) as remaining_users FROM users;"

echo.
echo ============================================================================
echo   Reset Complete!
echo ============================================================================
echo.
echo   All users and configuration have been cleared.
echo   You can now run the desktop app and go through setup again.
echo.
echo   To start: cd desktop-app ^&^& npm start
echo   Or run: RUN-DESKTOP.bat
echo.
echo ============================================================================
echo.
pause
