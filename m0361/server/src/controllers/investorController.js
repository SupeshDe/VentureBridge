import InvestorProfile from '../models/InvestorProfile.js'
import Startup from '../models/Startup.js'
import { scorePool, MATCH_POOL_CAP } from '../services/matchingService.js'
import { ratingSummaryFor } from './reviewController.js'

function attachRatings(items, keyOf) {
  const ids = items.map(keyOf).filter(Boolean)
  return ratingSummaryFor(ids).then(summaries =>
    items.map(item => ({
      ...item,
      rating: summaries.get(String(keyOf(item))) || { avg: 0, count: 0 },
    }))
  )
}

const investorUserId = inv => inv.user?._id || inv.user

/**
 * Create investor profile
 */
export async function createInvestorProfile(req, res, next) {
  try {
    // Check if user already has an investor profile
    const existing = await InvestorProfile.findOne({ user: req.user._id })
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have an investor profile' })
    }

    const { isVerified, user, _id, createdAt, updatedAt, ...safeBody } = req.body || {}
    const profile = await InvestorProfile.create({
      ...safeBody,
      user: req.user._id
    })

    res.status(201).json({
      success: true,
      message: 'Investor profile created successfully',
      data: profile
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all investors with search and filters
 */
export async function getInvestors(req, res, next) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      industry, 
      stage, 
      location, 
      minInvestment, 
      maxInvestment,
      investmentType,
      riskPreference,
      search,
      minScore = 0,
      minRating = 0,
      sort = '-createdAt'
    } = req.query

    const query = {}

    // Apply filters
    if (industry) query.preferredIndustries = industry
    if (stage) query.preferredStages = stage
    if (location) query.preferredLocations = location
    if (investmentType) query.investmentType = investmentType
    if (riskPreference) query.riskPreference = riskPreference
    if (minInvestment) query['investmentRange.minimum'] = { $lte: Number(minInvestment) }
    if (maxInvestment) query['investmentRange.maximum'] = { $gte: Number(maxInvestment) }

    // Search by organization or bio
    if (search) {
      query.$or = [
        { organization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const wantsScoring = Number(minScore) > 0 || sort === 'matchScore' || sort === '-matchScore'
    const wantsRating = Number(minRating) > 0 || sort === 'rating' || sort === '-rating'

    // Rating path: attach investor ratings, optionally filter/sort by them
    // (composes with minScore when both are requested)
    if (wantsRating) {
      let pool = await InvestorProfile.find(query)
        .populate('user', 'name profileImage location')
        .limit(MATCH_POOL_CAP)
        .lean()
      if (Number(minScore) > 0) {
        const startup = await Startup.findOne({ owner: req.user._id }).lean()
        if (!startup) {
          return res.status(400).json({ success: false, message: 'Create a startup profile to filter by match score' })
        }
        pool = scorePool(pool, startup, { minScore: Number(minScore), desc: true, isStartupPool: false })
      }
      let data = await attachRatings(pool, investorUserId)
      if (Number(minRating) > 0) data = data.filter(i => (i.rating.avg || 0) >= Number(minRating))
      data.sort((a, b) => (sort === 'rating' ? a.rating.avg - b.rating.avg : b.rating.avg - a.rating.avg))
      const total = data.length
      return res.json({
        success: true,
        data: data.slice(skip, skip + Number(limit)),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      })
    }

    // Match-score path: score the filtered pool against the viewer's startup
    if (wantsScoring) {
      const startup = await Startup.findOne({ owner: req.user._id }).lean()
      if (!startup) {
        return res.status(400).json({ success: false, message: 'Create a startup profile to filter by match score' })
      }
      const pool = await InvestorProfile.find(query)
        .populate('user', 'name profileImage location')
        .limit(MATCH_POOL_CAP)
        .lean()
      const scored = scorePool(pool, startup, {
        minScore: Number(minScore),
        desc: sort !== 'matchScore',
        isStartupPool: false,
      })
      const withRatings = await attachRatings(scored, investorUserId)
      const total = withRatings.length
      return res.json({
        success: true,
        data: withRatings.slice(skip, skip + Number(limit)),
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
      })
    }

    const [investors, total] = await Promise.all([
      InvestorProfile.find(query)
        .populate('user', 'name profileImage location')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InvestorProfile.countDocuments(query)
    ])

    res.json({
      success: true,
      data: await attachRatings(investors, investorUserId),
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
 * Get single investor by ID
 */
export async function getInvestor(req, res, next) {
  try {
    const investor = await InvestorProfile.findById(req.params.id)
      .populate('user', 'name email profileImage location isVerified')

    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' })
    }

    res.json({ success: true, data: investor })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current user's investor profile — 200 with data:null when none (avoids 404 console noise)
 */
export async function getMyInvestorProfile(req, res, next) {
  try {
    const profile = await InvestorProfile.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, organization: req.user.name } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )
      .populate('user', 'name email profileImage location')

    res.json({ success: true, data: profile, exists: true })
  } catch (error) {
    next(error)
  }
}

/**
 * Update investor profile
 */
export async function updateInvestorProfile(req, res, next) {
  try {
    // Update fields (never trust client for ownership/verification flags)
    const { isVerified, user, _id, createdAt, updatedAt, ...safeBody } = req.body || {}
    const profile = await InvestorProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: { ...safeBody, isVerified: false },
        $setOnInsert: { user: req.user._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Investor profile updated successfully. It will re-appear in discovery after admin verification.',
      data: profile
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete investor profile
 */
export async function deleteInvestorProfile(req, res, next) {
  try {
    const profile = await InvestorProfile.findOneAndDelete({ user: req.user._id })

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' })
    }

    res.json({
      success: true,
      message: 'Investor profile deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
