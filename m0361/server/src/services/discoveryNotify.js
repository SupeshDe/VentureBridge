import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'
import { calculateStartupInvestorMatch } from './matchingService.js'
import { createNotification } from './notificationService.js'
import { notifyUser, templates } from './emailService.js'
import logger from '../utils/logger.js'

const MIN_SCORE = 60
const MAX_RECIPIENTS = 5

/**
 * Score a pool and return top matches above MIN_SCORE.
 */
function topMatches(pool, scoreOne, limit) {
  return pool
    .map(item => ({ item, ...scoreOne(item) }))
    .filter(m => m.matchScore >= MIN_SCORE)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)
}

/**
 * Called when a startup is verified: alert the best-fit verified investors.
 */
export async function notifyMatchingInvestors(startupId, { limit = 3 } = {}) {
  try {
    const startup = await Startup.findById(startupId).populate('owner', 'name')
    if (!startup || !startup.isVerified) return 0

    const investors = await InvestorProfile.find({ isVerified: true }).populate('user', 'name').lean()
    const matches = topMatches(investors, inv => calculateStartupInvestorMatch(startup, inv), limit)

    for (const { item, matchScore } of matches) {
      if (!item.user?._id) continue
      await createNotification({
        recipient: item.user._id,
        type: 'new_match',
        title: `New ${matchScore}% match: ${startup.name}`,
        message: `${startup.name} (${startup.industry || 'Startup'}, ${startup.startupStage || 'early stage'}) matches your thesis at ${matchScore}%`,
        relatedId: startup._id,
        relatedModel: 'Startup',
      })
      notifyUser(item.user._id, {
        build: u => templates.newMatchForInvestor(u.name, startup.name, matchScore),
      }).catch(() => {})
    }
    return matches.length
  } catch (error) {
    logger.warn('notifyMatchingInvestors failed', { error: error.message })
    return 0
  }
}

/**
 * Called when an investor profile is verified: alert owners of best-fit startups.
 */
export async function notifyMatchingStartups(investorProfileId, { limit = 5 } = {}) {
  try {
    const investor = await InvestorProfile.findById(investorProfileId).lean()
    if (!investor || !investor.isVerified) return 0

    const startups = await Startup.find({ isVerified: true, visibility: 'public' })
      .populate('owner', 'name')
      .lean()
    const matches = topMatches(startups, s => calculateStartupInvestorMatch(s, investor), limit)

    for (const { item, matchScore } of matches) {
      if (!item.owner?._id) continue
      await createNotification({
        recipient: item.owner._id,
        type: 'new_match',
        title: `New investor fit: ${investor.organization} (${matchScore}%)`,
        message: `${investor.organization} matches ${item.name} at ${matchScore}% — consider sending a request`,
        relatedId: investor._id,
        relatedModel: 'InvestorProfile',
      })
      notifyUser(item.owner._id, {
        build: u => templates.newMatchForEntrepreneur(u.name, investor.organization, matchScore),
      }).catch(() => {})
    }
    return matches.length
  } catch (error) {
    logger.warn('notifyMatchingStartups failed', { error: error.message })
    return 0
  }
}
