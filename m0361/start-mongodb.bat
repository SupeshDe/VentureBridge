@echo off
echo Starting MongoDB service...
echo.
echo This requires Administrator privileges.
echo Right-click this file and select "Run as administrator"
echo.

net start MongoDB

if %errorlevel% equ 0 (
    echo ✅ MongoDB started successfully!
    echo.
    echo Testing connection...
    timeout /t 2 /nobreak > nul
    netstat -an | findstr 27017
    if %errorlevel% equ 0 (
        echo ✅ MongoDB is running on port 27017
        echo.
        echo 🚀 Now restart your VentureBridge server:
        echo    npm run server:dev
    )
) else (
    echo ❌ Failed to start MongoDB
    echo.
    echo Common solutions:
    echo 1. Run this script as Administrator
    echo 2. Check Windows Services (services.msc)
    echo 3. Create data directory: mkdir C:\data\db
)

echo.
pause