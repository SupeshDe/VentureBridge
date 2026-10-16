# MongoDB Atlas Quick Setup (Free Cloud Database)

## Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/atlas/database
2. Click "Try Free"
3. Sign up with email or Google account

## Step 2: Create a New Project

1. Create a new project called "VentureBridge"
2. Click "Create Project"

## Step 3: Create a Free Cluster

1. Click "Build a Database"
2. Choose "FREE" shared cluster
3. Select a region close to you
4. Name your cluster (e.g., "VentureBridge-Cluster")
5. Click "Create Cluster"

## Step 4: Set up Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a user:
   - Username: `venturebridge-user`
   - Password: Generate a secure password (save it!)
   - Database User Privileges: "Read and write to any database"
4. Click "Add User"

## Step 5: Set up Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (for development)
   - Or add your current IP address
4. Click "Confirm"

## Step 6: Get Connection String

1. Go to "Databases" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string (looks like):
   ```
   mongodb+srv://venturebridge-user:<password>@venturebridge-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 7: Update Your .env File

Replace the MONGO_URI in your `.env` file:
```
MONGO_URI=mongodb+srv://venturebridge-user:YOUR_PASSWORD@venturebridge-cluster.xxxxx.mongodb.net/venturebridge?retryWrites=true&w=majority
```

**Important:** Replace:
- `YOUR_PASSWORD` with the actual password you created
- `xxxxx` with your actual cluster identifier
- Add `/venturebridge` before the `?` to specify the database name

## Step 8: Test Connection

Run your server:
```bash
npm run server:dev
```

You should see: "MongoDB connected" in the console.

## Benefits of MongoDB Atlas:
- ✅ No local installation required
- ✅ Always available
- ✅ Automatic backups
- ✅ Free tier with 512MB storage
- ✅ Built-in monitoring
- ✅ Secure by default