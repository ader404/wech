@echo off
echo Starting Retail CRM in Development Mode...
echo.

echo [1/2] Starting Backend (NestJS on port 3001)...
start "Backend" cmd /k "cd backend && pnpm start:dev"
timeout /t 5 /nobreak >nul

echo [2/2] Starting Frontend (Next.js on port 3000)...
start "Frontend" cmd /k "cd frontend && pnpm dev --turbo"

echo.
echo ========================================
echo Services starting in separate windows:
echo - Backend:  http://localhost:3001/api/docs
echo - Frontend: http://localhost:3000
echo ========================================
echo.
echo Backend takes ~10s, Frontend takes ~15-30s on first load
echo Wait for "compiled successfully" message before opening browser
echo.
echo Press any key to close this window (services will keep running)...
pause >nul
