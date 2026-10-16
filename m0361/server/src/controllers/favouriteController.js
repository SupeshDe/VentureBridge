import Favourite from '../models/Favourite.js'
import InvestorFavourite from '../models/InvestorFavourite.js'
import InvestorProfile from '../models/InvestorProfile.js'
import Startup from '../models/Startup.js'

/**
 * Add startup to favourites
 */
export async function addFavourite(req, res, next) {
  try {
    if (req.user.role === 'entrepreneur') {
      const { investorProfileId } = req.body
      if (!investorProfileId) {
        return res.status(400).json({ success: false, message: 'Investor profile ID is required' })
      }

      const profile = await InvestorProfile.findById(investorProfileId)
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Investor profile not found' })
      }

      const existing = await InvestorFavourite.findOne({
        entrepreneur: req.user._id,
        investorProfile: investorProfileId,
      })
      if (existing) {
        return res.status(409).json({ success: false, message: 'Investor is already in your favourites' })
      }

      const favourite = await InvestorFavourite.create({
        entrepreneur: req.user._id,
        investorProfile: investorProfileId,
      })
      return res.status(201).json({
        success: true,
        message: 'Investor added to favourites',
        data: favourite,
      })
    }

    const { startupId } = req.body

    if (!startupId) {
      return res.status(400).json({ success: false, message: 'Startup ID is required' })
    }

    // Check if startup exists
    const startup = await Startup.findById(startupId)
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }

    // Check if already in favourites
    const existing = await Favourite.findOne({
      investor: req.user._id,
      startup: startupId
    })

    if (existing) {
      return res.status(409).json({ success: false, message: 'Startup is already in your favourites' })
    }

    const favourite = await Favourite.create({
      investor: req.user._id,
      startup: startupId
    })

    res.status(201).json({
      success: true,
      message: 'Startup added to favourites',
      data: favourite
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user's favourite startups
 */
export async function getFavourites(req, res, next) {
  try {
    const { page = 1, limit = 20 } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    if (req.user.role === 'entrepreneur') {
      const [favourites, total] = await Promise.all([
        InvestorFavourite.find({ entrepreneur: req.user._id })
          .populate({ path: 'investorProfile', populate: { path: 'user', select: 'name profileImage location' } })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        InvestorFavourite.countDocuments({ entrepreneur: req.user._id }),
      ])
      return res.json({
        success: true,
        data: favourites,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    }

    const [favourites, total] = await Promise.all([
      Favourite.find({ investor: req.user._id })
        .populate({
          path: 'startup',
          populate: { path: 'owner', select: 'name profileImage location' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Favourite.countDocuments({ investor: req.user._id })
    ])

    res.json({
      success: true,
      data: favourites,
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
 * Remove startup from favourites
 */
export async function removeFavourite(req, res, next) {
  try {
    const { startupId } = req.params

    const favourite = await Favourite.findOneAndDelete({
      investor: req.user._id,
      startup: startupId
    })

    if (!favourite) {
      return res.status(404).json({ success: false, message: 'Favourite not found' })
    }

    res.json({
      success: true,
      message: 'Startup removed from favourites'
    })
  } catch (error) {
    next(error)
  }
}

export async function removeInvestorFavourite(req, res, next) {
  try {
    const favourite = await InvestorFavourite.findOneAndDelete({
      entrepreneur: req.user._id,
      investorProfile: req.params.investorProfileId,
    })
    if (!favourite) {
      return res.status(404).json({ success: false, message: 'Favourite not found' })
    }
    res.json({ success: true, message: 'Investor removed from favourites' })
  } catch (error) {
    next(error)
  }
}

/**
 * Check if startup is in favourites
 */
export async function isFavourite(req, res, next) {
  try {
    if (req.user.role === 'entrepreneur') {
      const favourite = await InvestorFavourite.findOne({
        entrepreneur: req.user._id,
        investorProfile: req.params.startupId,
      })
      return res.json({ success: true, data: { isFavourite: !!favourite } })
    }

    const { startupId } = req.params

    const favourite = await Favourite.findOne({
      investor: req.user._id,
      startup: startupId
    })

    res.json({
      success: true,
      data: { isFavourite: !!favourite }
    })
  } catch (error) {
    next(error)
  }
}
