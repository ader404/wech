@echo off
REM Complete restart with rebuild

echo Stopping all services...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM Electron.exe >nul 2>&1

echo.
echo Rebuilding backend...
cd /d "%~dp0backend"
call npx prisma generate --force
call npx nest build

echo.
echo Starting services...
cd /d "%~dp0"
call RUN-DESKTOP.bat
