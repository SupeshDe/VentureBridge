import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'
import { calculateStartupInvestorMatch, explainMatch } from '../services/matchingService.js'

const router = Router()

// Entrepreneur: Get recommended investors for their startup
router.get('/investors', protect, allowRoles('entrepreneur'), async (req, res, next) => {
  try {
    const { minScore = 0, limit = 50 } = req.query
    
    const startup = await Startup.findOne({ owner: req.user._id })
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Create a startup profile to see matches' })
    }
    
    const investors = await InvestorProfile.find({ isVerified: true })
      .populate('user', 'name profileImage location')
    
    const data = investors
      .map(investor => {
        const scored = calculateStartupInvestorMatch(startup, investor)
        return { investor, ...scored, explanation: explainMatch(scored) }
      })
      .filter(match => match.matchScore >= Number(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, Number(limit))
    
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// Investor: Get recommended startups based on preferences
router.get('/startups', protect, allowRoles('investor'), async (req, res, next) => {
  try {
    const { minScore = 0, limit = 50 } = req.query
    
    const investorProfile = await InvestorProfile.findOne({ user: req.user._id })
    if (!investorProfile) {
      return res.status(404).json({ success: false, message: 'Create an investor profile to see matches' })
    }
    
    const startups = await Startup.find({ isVerified: true, visibility: 'public' })
      .populate('owner', 'name profileImage location')
    
    const data = startups
      .map(startup => {
        const scored = calculateStartupInvestorMatch(startup, investorProfile)
        return { startup, ...scored, explanation: explainMatch(scored) }
      })
      .filter(match => match.matchScore >= Number(minScore))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, Number(limit))
    
    res.json({ success: true, data })
  } catch (error) {
    next(error)
  }
})

// Get match score for specific startup-investor pair
router.get('/startup/:startupId/investor/:investorId', protect, async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.startupId)
    const investor = await InvestorProfile.findById(req.params.investorId)
    
    if (!startup || !investor) {
      return res.status(404).json({ success: false, message: 'Startup or investor not found' })
    }
    
    const matchData = calculateStartupInvestorMatch(startup, investor)
    
    res.json({ success: true, data: { ...matchData, explanation: explainMatch(matchData) } })
  } catch (error) {
    next(error)
  }
})

export default router
