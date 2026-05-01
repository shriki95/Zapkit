@echo off
title ZapKit - Quick Start
color 0A

echo.
echo  ========================================
echo     ZapKit - Starting All Services
echo  ========================================
echo.

cd tinylink-pro\backend
start "Backend" cmd /k "venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"
cd ..\..

timeout /t 2 /nobreak >nul

cd tinylink-pro\frontend
start "TinyLink" cmd /k "npm run dev"
cd ..\..

cd qr-generator-pro\frontend
start "QR Generator" cmd /k "npm run dev"
cd ..\..

cd home
start "Home Page" cmd /k "python -m http.server 8080"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo  ========================================
echo     All Services Running!
echo  ========================================
echo.
echo  Home Page:  http://localhost:8080
echo  TinyLink:   http://localhost:5173
echo  QR Gen:     http://localhost:5175
echo  Backend:    http://localhost:8000
echo.
echo  Opening browser...
echo  ========================================
echo.

start http://localhost:8080

echo.
echo  Press any key to stop all services...
pause >nul

taskkill /FI "WindowTitle eq Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq TinyLink*" /F >nul 2>&1
taskkill /FI "WindowTitle eq QR Generator*" /F >nul 2>&1
taskkill /FI "WindowTitle eq Home Page*" /F >nul 2>&1

echo.
echo  All services stopped.
echo.
timeout /t 2 /nobreak >nul
