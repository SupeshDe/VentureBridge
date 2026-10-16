import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'
import { scorePool, MATCH_POOL_CAP } from '../services/matchingService.js'
import { ratingSummaryFor } from './reviewController.js'

/**
 * Create startup profile
 */
export async function createStartup(req, res, next) {
  try {
    // Check if user already has a startup
    const existing = await Startup.findOne({ owner: req.user._id })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a startup profile' })
    }

    const startup = await Startup.create({
      ...req.body,
      owner: req.user._id
    })

    res.status(201).json({
      success: true,
      message: 'Startup profile created successfully',
      data: startup
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all startups with search and filters
 */
export async function getStartups(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      industry, 
      startupStage, 
      location, 
      minFunding, 
      maxFunding,
      riskPreference,
      search,
      minScore = 0,
      minRating = 0,
      sort = '-createdAt'
    } = req.query

    const query = { isVerified: true, visibility: 'public' }

    // Apply filters
    if (industry) query.industry = industry
    if (startupStage) query.startupStage = startupStage
    if (location) query.location = location
    if (riskPreference) query.riskPreference = riskPreference
    if (minFunding) query['fundingRequired.amount'] = { ...query['fundingRequired.amount'], $gte: Number(minFunding) }
    if (maxFunding) query['fundingRequired.amount'] = { ...query['fundingRequired.amount'], $lte: Number(maxFunding) }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const wantsRating = Number(minRating) > 0 || sort === 'rating' || sort === '-rating'

    // Rating path: attach owner ratings, optionally filter/sort by them
    if (wantsRating) {
      let pool = await Startup.find(query)
        .populate('owner', 'name profileImage location')
        .limit(MATCH_POOL_CAP)
        .lean()
      if (Number(minScore) > 0) {
        const profile = await InvestorProfile.findOne({ user: req.user._id }).lean()
        if (!profile) {
          return res.status(400).json({ success: false, message: 'Create an investor profile to filter by match score' })
        }
        pool = scorePool(pool, profile, { minScore: Number(minScore), desc: true, isStartupPool: true })
      }
      const summaries = await ratingSummaryFor(pool.map(s => s.owner?._id || s.owner).filter(Boolean))
      let data = pool.map(s => ({
        ...s,
        rating: summaries.get(String(s.owner?._id || s.owner)) || { avg: 0, count: 0 },
      }))
      if (Number(minRating) > 0) data = data.filter(s => (s.rating.avg || 0) >= Number(minRating))
      data.sort((a, b) => (sort === 'rating' ? a.rating.avg - b.rating.avg : b.rating.avg - a.rating.avg))
      const total = data.length
      return res.json({
        success: true,
        data: data.slice(skip, skip + Number(limit)),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      })
    }

    // Match-score path: score the filtered pool against the viewer's investor profile
    const wantsScoring = Number(minScore) > 0 || sort === 'matchScore' || sort === '-matchScore'
    if (wantsScoring) {
      const profile = await InvestorProfile.findOne({ user: req.user._id }).lean()
      if (!profile) {
        return res.status(400).json({ success: false, message: 'Create an investor profile to filter by match score' })
      }
      const pool = await Startup.find(query)
        .populate('owner', 'name profileImage location')
        .limit(MATCH_POOL_CAP)
        .lean()
      const scored = scorePool(pool, profile, {
        minScore: Number(minScore),
        desc: sort !== 'matchScore',
        isStartupPool: true,
      })
      const summaries = await ratingSummaryFor(scored.map(s => s.owner?._id || s.owner).filter(Boolean))
      const data = scored.map(s => ({
        ...s,
        rating: summaries.get(String(s.owner?._id || s.owner)) || { avg: 0, count: 0 },
      }))
      const total = data.length
      return res.json({
        success: true,
        data: data.slice(skip, skip + Number(limit)),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      })
    }

    const [startups, total] = await Promise.all([
      Startup.find(query)
        .populate('owner', 'name profileImage location')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Startup.countDocuments(query)
    ])

    const summaries = await ratingSummaryFor(startups.map(s => s.owner?._id || s.owner).filter(Boolean))
    const data = startups.map(s => ({
      ...s,
      rating: summaries.get(String(s.owner?._id || s.owner)) || { avg: 0, count: 0 },
    }))

    res.json({
      success: true,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get single startup by ID
 */
export async function getStartup(req, res, next) {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('owner', 'name email profileImage location isVerified')

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }

    res.json({ success: true, data: startup })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user's startup — 200 with data:null when none (avoids 404 console noise)
 */
export async function getMyStartup(req, res, next) {
  try {
    const startup = await Startup.findOne({ owner: req.user._id })
      .populate('owner', 'name email profileImage location')

    if (!startup) {
      return res.json({ success: true, data: null, exists: false, message: 'You have not created a startup profile yet' })
    }

    res.json({ success: true, data: startup, exists: true })
  } catch (error) {
    next(error)
  }
}

/**
 * Update startup profile
 */
export async function updateStartup(req, res, next) {
  try {
    const startup = await Startup.findOne({ owner: req.user._id })

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' })
    }

    // Update fields
    Object.assign(startup, req.body)
    await startup.save()

    res.json({
      success: true,
      message: 'Startup profile updated successfully',
      data: startup
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete startup profile
 */
export async function deleteStartup(req, res, next) {
  try {
    const startup = await Startup.findOneAndDelete({ owner: req.user._id })

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup profile not found' })
    }

    res.json({
      success: true,
      message: 'Startup profile deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
