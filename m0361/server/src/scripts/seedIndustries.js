import 'dotenv/config'
import connectDB from '../config/db.js'
import Industry from '../models/Industry.js'
import { DEFAULTS } from '../controllers/industryController.js'

async function seedIndustries() {
  try {
    await connectDB()
    let created = 0
    for (const item of DEFAULTS) {
      const res = await Industry.updateOne(
        { name: item.name },
        { $setOnInsert: { name: item.name, description: item.description, isActive: true } },
        { upsert: true }
      )
      if (res.upsertedCount > 0) created += 1
    }
    const total = await Industry.countDocuments()
    console.log(`Industries seeded: ${created} new, ${total} total`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to seed industries:', error)
    process.exit(1)
  }
}

seedIndustries()
