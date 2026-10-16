import Industry from '../models/Industry.js'
import { isDuplicateKeyError } from '../utils/mongoErrors.js'

const DEFAULTS = [
  { name: 'Fintech', description: 'Financial services, payments, lending and insurance technology' },
  { name: 'Healthtech', description: 'Healthcare delivery, diagnostics, pharma and wellness' },
  { name: 'Edtech', description: 'Learning platforms, upskilling and education services' },
  { name: 'SaaS', description: 'Software-as-a-service across verticals' },
  { name: 'E-commerce', description: 'Online retail, D2C brands and marketplaces' },
  { name: 'AI/ML', description: 'Artificial intelligence and machine-learning products' },
  { name: 'Climate', description: 'Clean energy, sustainability and climate adaptation' },
  { name: 'Marketplace', description: 'Two-sided platforms connecting supply and demand' },
  { name: 'DeepTech', description: 'Semiconductors, robotics, biotech and frontier research' },
  { name: 'Consumer', description: 'Consumer apps, media and lifestyle products' },
  { name: 'Logistics', description: 'Supply chain, warehousing and mobility' },
  { name: 'Other', description: 'Anything that does not fit the categories above' },
]

/**
 * List all industries (admin, including inactive)
 */
export async function adminListIndustries(_req, res, next) {
  try {
    const [industries, counts] = await Promise.all([
      Industry.find().sort({ name: 1 }).lean(),
      (await import('../models/Startup.js')).default.aggregate([
        { $group: { _id: '$industry', count: { $sum: 1 } } },
      ]),
    ])
    const usage = new Map(counts.map(c => [c._id, c.count]))
    res.json({ success: true, data: industries.map(i => ({ ...i, startupCount: usage.get(i.name) || 0 })) })
  } catch (error) {
    next(error)
  }
}

/**
 * Create an industry (admin)
 */
export async function adminCreateIndustry(req, res, next) {
  try {
    const { name, description } = req.body
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Industry name is required' })
    }
    const industry = await Industry.create({ name: String(name).trim(), description: String(description || '').slice(0, 500) })
    res.status(201).json({ success: true, message: 'Industry created', data: industry })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: 'An industry with this name already exists' })
    }
    next(error)
  }
}

/**
 * Update an industry (admin) — rename or activate/deactivate
 */
export async function adminUpdateIndustry(req, res, next) {
  try {
    const { name, description, isActive } = req.body
    const industry = await Industry.findById(req.params.id)
    if (!industry) {
      return res.status(404).json({ success: false, message: 'Industry not found' })
    }
    if (name !== undefined) industry.name = String(name).trim()
    if (description !== undefined) industry.description = String(description).slice(0, 500)
    if (isActive !== undefined) industry.isActive = Boolean(isActive)
    await industry.save()
    res.json({ success: true, message: 'Industry updated', data: industry })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: 'An industry with this name already exists' })
    }
    next(error)
  }
}

/**
 * Delete an industry (admin) — blocked while startups use it
 */
export async function adminDeleteIndustry(req, res, next) {
  try {
    const industry = await Industry.findById(req.params.id)
    if (!industry) {
      return res.status(404).json({ success: false, message: 'Industry not found' })
    }
    const { default: Startup } = await import('../models/Startup.js')
    const inUse = await Startup.countDocuments({ industry: industry.name })
    if (inUse > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete: ${inUse} startup${inUse === 1 ? '' : 's'} still use${inUse === 1 ? 's' : ''} this industry. Deactivate it instead.`,
      })
    }
    await industry.deleteOne()
    res.json({ success: true, message: 'Industry deleted' })
  } catch (error) {
    next(error)
  }
}

export { DEFAULTS }
