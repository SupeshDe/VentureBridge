# Direct MongoDB Installation for Windows

## Step 1: Download MongoDB Community Server

1. **Go to the MongoDB download page:**
   https://www.mongodb.com/try/download/community

2. **Select the following options:**
   - Version: 7.0.14 (current)
   - Platform: Windows
   - Package: msi

3. **Click "Download"** (about 100-200MB file)

## Step 2: Install MongoDB

1. **Run the downloaded .msi file** as Administrator
2. **Choose "Complete" installation type**
3. **Service Configuration:**
   - ✅ Install MongoDB as a Service
   - ✅ Run service as Network Service user
   - Service Name: MongoDB
4. **MongoDB Compass:** You can uncheck this if you don't want the GUI
5. **Click "Install"**

## Step 3: Verify Installation

Open Command Prompt as Administrator and run:
```cmd
mongod --version
```

You should see version information.

## Step 4: Start MongoDB Service

The service should start automatically, but if not:
```cmd
net start MongoDB
```

## Step 5: Test Connection

```cmd
mongo --version
```

## Step 6: Update Your .env File

Once MongoDB is running, update your `.env` file to use local connection:
```
MONGO_URI=mongodb://127.0.0.1:27017/venturebridge
```

## Troubleshooting

### If MongoDB service won't start:

1. **Create data directory:**
   ```cmd
   mkdir C:\data\db
   ```

2. **Set permissions:**
   - Right-click on `C:\data` folder
   - Properties → Security → Edit
   - Give "Full Control" to your user account

3. **Start manually if needed:**
   ```cmd
   mongod --dbpath C:\data\db
   ```

### If port 27017 is in use:
```cmd
netstat -ano | findstr 27017
taskkill /PID [PID_NUMBER] /F
```

## Alternative: Portable MongoDB

If you have issues with the service installation:

1. Download the ZIP version instead of MSI
2. Extract to `C:\mongodb`
3. Create `C:\data\db` folder
4. Run manually:
   ```cmd
   C:\mongodb\bin\mongod.exe --dbpath C:\data\db
   ```

## Success Indicators

✅ Service shows "Running" in Windows Services (services.msc)
✅ Command `mongod --version` shows version info
✅ Port 27017 is listening (netstat -an | findstr 27017)
✅ Your VentureBridge server connects without errors