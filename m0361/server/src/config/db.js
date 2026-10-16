import mongoose from 'mongoose'

export default async function connectDB() {
  if (!process.env.MONGO_URI) { 
    console.warn('⚠️  MONGO_URI is not set; API will start without a database connection.')
    return
  }
  
  try { 
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ MongoDB connected successfully')
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`)
  }
  catch (error) { 
    console.error('❌ MongoDB connection failed:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('')
      console.log('🔧 MongoDB Setup Required:')
      console.log('   Option 1 (Recommended): Use MongoDB Atlas (cloud)')
      console.log('   Option 2: Install MongoDB locally')
      console.log('   See the setup guide files for detailed instructions')
      console.log('')
    }
    
    throw error
  }
}
