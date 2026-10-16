import connectDB from '../config/db.js'
import { env } from '../config/env.js'
import User from '../models/User.js'

async function createAdminUser() {
  try {
    await connectDB()

    const adminEmail = env.adminEmail
    const adminPassword = env.adminPassword

    // Reset existing admin to .env credentials (or create fresh)
    const existing = await User.findOne({ email: adminEmail })
    if (existing) {
      existing.password = adminPassword
      existing.role = 'admin'
      existing.isActive = true
      existing.isVerified = true
      await existing.save()
      console.log('Admin user already exists — password reset to .env value')
      console.log('Email:', adminEmail)
      process.exit(0)
    }

    // Create admin user
    const admin = await User.create({
      name: 'VentureBridge Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
    })

    console.log('✅ Admin user created successfully')
    console.log('Email:', admin.email)
    console.log('\n⚠️  Please change the admin password after first login!')

    process.exit(0)
  } catch (error) {
    console.error('Failed to create admin user:', error)
    process.exit(1)
  }
}

createAdminUser()
