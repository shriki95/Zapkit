@echo off
echo ========================================
echo    ZapKit - Local Development
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.11+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 20+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Installing Backend Dependencies...
cd tinylink-pro\backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1
cd ..\..

echo [2/5] Installing TinyLink Frontend Dependencies...
cd tinylink-pro\frontend
if not exist node_modules (
    npm install >nul 2>&1
)
cd ..\..

echo [3/5] Installing QR Generator Frontend Dependencies...
cd qr-generator-pro\frontend
if not exist node_modules (
    npm install >nul 2>&1
)
cd ..\..

echo.
echo ========================================
echo    Starting All Services...
echo ========================================
echo.
echo [Backend]  http://localhost:8000
echo [Home]     http://localhost:8080
echo [TinyLink] http://localhost:5173
echo [QR Gen]   http://localhost:5175
echo.
echo Press Ctrl+C to stop all services
echo ========================================
echo.

REM Start Backend
start "ZapKit Backend" cmd /k "cd tinylink-pro\backend && venv\Scripts\activate && python -m uvicorn main:app --reload --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start TinyLink Frontend
start "TinyLink Pro" cmd /k "cd tinylink-pro\frontend && npm run dev"

REM Start QR Generator Frontend
start "QR Generator Pro" cmd /k "cd qr-generator-pro\frontend && npm run dev"

REM Start Home Page (simple HTTP server)
start "ZapKit Home" cmd /k "cd home && python -m http.server 8080"

echo.
echo All services started!
echo Open http://localhost:8080 in your browser
echo.
pause
