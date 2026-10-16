import mongoose from 'mongoose'

export function calculateStartupCompletion(startup) {
  const checks = [
    !!startup.name,
    !!startup.description?.trim(),
    !!startup.industry,
    !!startup.startupStage,
    !!startup.location,
    !!startup.businessModel?.trim(),
    !!startup.targetMarket?.trim(),
    startup.fundingRequired?.amount > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

const moneySub = {
  amount: { type: Number, min: 0 },
  currency: { type: String, default: 'INR', trim: true },
}

const startupSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true, maxlength: 160 },
    description: String,
    logoUrl: { type: String, trim: true },
    website: { type: String, trim: true },
    industry: { type: String, index: true },
    startupStage: { type: String, index: true },
    location: { type: String, index: true },
    riskPreference: String,
    businessModel: { type: String, trim: true, maxlength: 2000 },
    targetMarket: { type: String, trim: true, maxlength: 2000 },
    revenue: { ...moneySub },
    fundingRequired: { ...moneySub, amount: { type: Number, min: 0 } },
    valuation: { ...moneySub },
    equityOffered: { type: Number, min: 0, max: 100 },
    teamSize: { type: Number, min: 1, max: 100000 },
    foundedYear: { type: Number, min: 1980, max: 2100 },
    tags: [{ type: String, trim: true }],
    pitchDeckUrl: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    visibility: { type: String, default: 'public' },
  },
  { timestamps: true }
)

startupSchema.index({ industry: 1, startupStage: 1, location: 1 })

/**
 * Profile completion (0-100) over the fields investors actually screen on.
 */
startupSchema.methods.completionScore = function () {
  return calculateStartupCompletion(this)
}

export default mongoose.model('Startup', startupSchema)
