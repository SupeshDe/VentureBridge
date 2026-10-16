import 'dotenv/config'
import connectDB from '../config/db.js'
import User from '../models/User.js'
import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'

const industries = ['Healthcare', 'FinTech', 'EdTech', 'E-Commerce', 'AI/ML', 'SaaS', 'CleanTech', 'FoodTech']
const stages = ['Idea', 'Pre-Seed', 'Seed', 'Early Stage', 'Growth', 'Series A']
const locations = ['Bengaluru', 'Mumbai', 'Delhi', 'Pune', 'Hyderabad', 'Chennai']
const riskLevels = ['Low', 'Medium', 'High']

async function seedDatabase() {
  try {
    await connectDB()

    console.log('🗑️  Clearing existing data...')
    await User.deleteMany({ role: { $ne: 'admin' } })
    await Startup.deleteMany({})
    await InvestorProfile.deleteMany({})

    console.log('👨‍💼 Creating entrepreneurs...')
    const entrepreneurs = []
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Entrepreneur ${i}`,
        email: `entrepreneur${i}@example.com`,
        password: 'password123',
        role: 'entrepreneur',
        location: locations[Math.floor(Math.random() * locations.length)],
        isVerified: true,
        isActive: true
      })
      entrepreneurs.push(user)
    }

    console.log('🚀 Creating startups...')
    for (const entrepreneur of entrepreneurs) {
      const industry = industries[Math.floor(Math.random() * industries.length)]
      const stage = stages[Math.floor(Math.random() * stages.length)]
      const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)]
      const funding = [500000, 1000000, 2000000, 5000000, 10000000][Math.floor(Math.random() * 5)]

      await Startup.create({
        owner: entrepreneur._id,
        name: `${industry} Startup ${entrepreneur.name.split(' ')[1]}`,
        description: `Innovative ${industry.toLowerCase()} solution revolutionizing the industry with cutting-edge technology.`,
        industry,
        startupStage: stage,
        location: entrepreneur.location,
        riskPreference: risk,
        fundingRequired: {
          amount: funding,
          currency: 'INR'
        },
        equityOffered: Math.floor(Math.random() * 20) + 5,
        isVerified: true,
        visibility: 'public'
      })
    }

    console.log('💼 Creating investors...')
    const investors = []
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Investor ${i}`,
        email: `investor${i}@example.com`,
        password: 'password123',
        role: 'investor',
        location: locations[Math.floor(Math.random() * locations.length)],
        isVerified: true,
        isActive: true
      })
      investors.push(user)
    }

    console.log('💰 Creating investor profiles...')
    const investmentTypes = ['Angel Investor', 'Venture Capital', 'Corporate Investor', 'Family Office']
    
    for (const investor of investors) {
      const preferredIndustries = industries
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 2)
      
      const preferredStages = stages
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1)

      await InvestorProfile.create({
        user: investor._id,
        organization: `${investor.name} Ventures`,
        bio: `Experienced investor focusing on innovative startups in ${preferredIndustries.join(', ')}.`,
        location: investor.location,
        preferredIndustries,
        preferredStages,
        preferredLocations: [investor.location, locations[Math.floor(Math.random() * locations.length)]],
        riskPreference: riskLevels[Math.floor(Math.random() * riskLevels.length)],
        investmentType: investmentTypes[Math.floor(Math.random() * investmentTypes.length)],
        investmentRange: {
          minimum: 500000,
          maximum: 5000000,
          currency: 'INR'
        },
        equityMin: 5,
        equityMax: 25,
        isVerified: true
      })
    }

    console.log('\n✅ Database seeded successfully!')
    console.log('📊 Created:')
    console.log(`   - ${entrepreneurs.length} entrepreneurs`)
    console.log(`   - ${entrepreneurs.length} startups`)
    console.log(`   - ${investors.length} investors`)
    console.log(`   - ${investors.length} investor profiles`)
    console.log('\n🔐 Test Credentials:')
    console.log('   Entrepreneur: entrepreneur1@example.com / password123')
    console.log('   Investor: investor1@example.com / password123')
    
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seedDatabase()
