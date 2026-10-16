@echo off
echo ========================================
echo   MongoDB with Docker (Alternative)
echo ========================================
echo.

echo Checking for Docker...
docker --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found
    echo Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo ✅ Docker found
echo.
echo Starting MongoDB container...
echo Container name: venturebridge-mongodb
echo Port: 27017

docker run -d --name venturebridge-mongodb -p 27017:27017 mongo:7.0

if %errorlevel% equ 0 (
    echo ✅ MongoDB container started successfully!
    echo.
    echo 📋 Container Commands:
    echo    Start:  docker start venturebridge-mongodb
    echo    Stop:   docker stop venturebridge-mongodb
    echo    Remove: docker rm venturebridge-mongodb
    echo.
    echo 🚀 Ready! Restart your VentureBridge server:
    echo    npm run server:dev
) else (
    echo ❌ Failed to start container
    echo Try: docker ps -a (to see existing containers)
)

pause