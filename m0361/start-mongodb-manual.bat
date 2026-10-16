@echo off
echo Manual MongoDB Start
echo ====================
echo.

echo Creating data directory if it doesn't exist...
if not exist "C:\data\db" mkdir C:\data\db

echo.
echo Starting MongoDB manually...
echo Press Ctrl+C to stop MongoDB when you're done.
echo.

cd "C:\Program Files\MongoDB\Server\7.0\bin"
mongod.exe --dbpath C:\data\db --port 27017

pause