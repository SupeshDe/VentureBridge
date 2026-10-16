# MongoDB Setup for Windows

## Method 1: MongoDB Community Server (Recommended)

1. **Download MongoDB Community Server:**
   - Go to https://www.mongodb.com/try/download/community
   - Select "Windows" and "msi" package
   - Download and run the installer

2. **Install MongoDB:**
   - Run the `.msi` installer
   - Choose "Complete" installation
   - Install as Windows Service (recommended)
   - Install MongoDB Compass (optional GUI)

3. **Verify Installation:**
   ```cmd
   mongod --version
   ```

4. **Start MongoDB Service:**
   ```cmd
   net start MongoDB
   ```

## Method 2: Using Chocolatey (Package Manager)

1. **Install Chocolatey** (if not already installed):
   - Open PowerShell as Administrator
   - Run:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```

2. **Install MongoDB:**
   ```cmd
   choco install mongodb
   ```

3. **Start MongoDB:**
   ```cmd
   mongod --dbpath C:\data\db
   ```

## Method 3: Using Docker (If you have Docker)

```cmd
docker run --name venturebridge-mongo -p 27017:27017 -d mongo:latest
```

## After MongoDB is Running

Update your `.env` file:
```
MONGO_URI=mongodb://127.0.0.1:27017/venturebridge
```

## Troubleshooting

1. **Service not starting:**
   - Check Windows Services (`services.msc`)
   - Look for "MongoDB Server"
   - Right-click and select "Start"

2. **Port already in use:**
   ```cmd
   netstat -ano | findstr 27017
   ```

3. **Permission issues:**
   - Run command prompt as Administrator
   - Ensure MongoDB data directory exists: `C:\data\db`

4. **Create data directory if missing:**
   ```cmd
   mkdir C:\data\db
   ```