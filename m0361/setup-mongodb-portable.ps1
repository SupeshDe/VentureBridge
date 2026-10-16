# MongoDB Portable Setup Script for Windows
# Run this in PowerShell as Administrator

Write-Host "🔧 Setting up MongoDB Portable..." -ForegroundColor Green

# Create directories
$mongoPath = "C:\mongodb-portable"
$dataPath = "$mongoPath\data"
$binPath = "$mongoPath\bin"

Write-Host "📁 Creating directories..."
New-Item -ItemType Directory -Force -Path $mongoPath | Out-Null
New-Item -ItemType Directory -Force -Path $dataPath | Out-Null
New-Item -ItemType Directory -Force -Path $binPath | Out-Null

# Download MongoDB (this is a large file, so we'll show the download link)
$downloadUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.14.zip"

Write-Host "📥 MongoDB Download Required:"
Write-Host "1. Download from: $downloadUrl"
Write-Host "2. Extract the contents to: $mongoPath"
Write-Host "3. The mongod.exe should be in: $mongoPath\mongodb-windows-x86_64-7.0.14\bin\"
Write-Host ""

# Create start script
$startScript = @"
@echo off
echo Starting MongoDB...
echo Data directory: $dataPath
echo Press Ctrl+C to stop MongoDB
cd /d "$mongoPath\mongodb-windows-x86_64-7.0.14\bin"
mongod.exe --dbpath "$dataPath" --port 27017
pause
"@

$startScript | Out-File -FilePath "$mongoPath\start-mongodb.bat" -Encoding ASCII

# Create stop script  
$stopScript = @"
@echo off
echo Stopping MongoDB...
taskkill /IM mongod.exe /F
echo MongoDB stopped.
pause
"@

$stopScript | Out-File -FilePath "$mongoPath\stop-mongodb.bat" -Encoding ASCII

Write-Host "✅ Setup completed!"
Write-Host ""
Write-Host "📋 Next Steps:"
Write-Host "1. Download MongoDB from the URL above"
Write-Host "2. Extract to C:\mongodb-portable\"
Write-Host "3. Run: C:\mongodb-portable\start-mongodb.bat"
Write-Host ""
Write-Host "🚀 Quick Start Commands:"
Write-Host "   Start: C:\mongodb-portable\start-mongodb.bat"
Write-Host "   Stop:  C:\mongodb-portable\stop-mongodb.bat"