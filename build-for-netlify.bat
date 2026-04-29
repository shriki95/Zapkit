@echo off
echo ========================================
echo Building ZapKit for Netlify
echo ========================================

REM Create dist folder
if not exist dist mkdir dist

REM Copy home page
echo.
echo [1/3] Copying home page...
xcopy /E /I /Y home dist\home

REM Build TinyLink Pro
echo.
echo [2/3] Building TinyLink Pro...
cd tinylink-pro\frontend
call npm run build
cd ..\..
if not exist dist\tinylink mkdir dist\tinylink
xcopy /E /I /Y tinylink-pro\frontend\dist dist\tinylink

REM Build QR Generator Pro
echo.
echo [3/3] Building QR Generator Pro...
cd qr-generator-pro\frontend
call npm run build
cd ..\..
if not exist dist\qr mkdir dist\qr
xcopy /E /I /Y qr-generator-pro\frontend\dist dist\qr

REM Create _redirects file for Netlify routing
echo.
echo [4/4] Creating Netlify redirects...
echo # Netlify redirects > dist\_redirects
echo /tinylink/*  /tinylink/index.html  200 >> dist\_redirects
echo /qr/*  /qr/index.html  200 >> dist\_redirects
echo /*  /home/index.html  200 >> dist\_redirects

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Now upload the "dist" folder to Netlify:
echo 1. Go to https://app.netlify.com/drop
echo 2. Drag the "dist" folder
echo 3. Done!
echo.
pause
