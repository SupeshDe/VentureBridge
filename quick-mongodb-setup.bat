@echo off
echo ========================================
echo   VentureBridge - MongoDB Quick Setup
echo ========================================
echo.

echo 1. Checking if MongoDB is already installed...
sc query MongoDB > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✅ MongoDB service found, starting it...
    net start MongoDB
    goto :test_connection
)

echo    ❌ MongoDB not installed

echo.
echo 2. Download Options:
echo    Option A: Direct Download
echo       Go to: https://www.mongodb.com/try/download/community
echo       Select: Windows, MSI package, Download and run as Admin
echo.
echo    Option B: Quick Download Link
echo       https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14-signed.msi
echo.
echo 3. Installation:
echo    - Run the .msi as Administrator
echo    - Choose 'Complete' installation
echo    - Install as Windows Service: YES
echo    - MongoDB Compass (optional): Your choice
echo.

pause
echo.
echo Checking for MongoDB installation again...
sc query MongoDB > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB service found!
    net start MongoDB
) else (
    echo ❌ MongoDB still not found. Please install it first.
    echo After installation, run this script again.
    pause
    exit /b 1
)

:test_connection
echo.
echo 4. Testing connection...
timeout /t 3 /nobreak > nul

echo Testing if port 27017 is listening...
netstat -an | findstr 27017 > nul
if %errorlevel% equ 0 (
    echo ✅ MongoDB is running on port 27017
    echo.
    echo 🚀 Ready to use! Restart your VentureBridge server:
    echo    npm run server:dev
    echo.
) else (
    echo ❌ Port 27017 not available
    echo    Try: net start MongoDB
)

pause