export const MATCH_WEIGHTS = Object.freeze({ industry: 30, range: 25, stage: 15, risk: 10, location: 10, equity: 10 })
export const MATCH_POOL_CAP = 500
const includes = (list = [], value) => list.some(item => item?.toLowerCase() === value?.toLowerCase())
export function calculateStartupInvestorMatch(startup, investor) {
  const amount = startup.fundingRequired?.amount || 0
  const rangeMatch = amount >= (investor.investmentRange?.minimum || 0) && amount <= (investor.investmentRange?.maximum || Infinity)
  const factors = [['Industry Match', includes(investor.preferredIndustries, startup.industry), MATCH_WEIGHTS.industry], ['Investment Range Match', rangeMatch, MATCH_WEIGHTS.range], ['Startup Stage Match', includes(investor.preferredStages, startup.startupStage), MATCH_WEIGHTS.stage], ['Risk Preference Match', investor.riskPreference?.toLowerCase() === startup.riskPreference?.toLowerCase(), MATCH_WEIGHTS.risk], ['Location Match', includes(investor.preferredLocations, startup.location) || investor.location?.toLowerCase() === startup.location?.toLowerCase(), MATCH_WEIGHTS.location], ['Equity Compatibility', startup.equityOffered == null || (startup.equityOffered >= (investor.equityMin || 0) && startup.equityOffered <= (investor.equityMax || 100)), MATCH_WEIGHTS.equity]].map(([name, matched, score]) => ({ name, matched, score: matched ? score : 0 }))
  return { matchScore: factors.reduce((total, factor) => total + factor.score, 0), factors }
}

/**
 * Human-readable one-line explanation of a match result.
 */
export function explainMatch({ matchScore, factors }) {
  const hits = factors.filter(f => f.matched).map(f => f.name.replace(' Match', '').replace(' Compatibility', ''))
  const misses = factors.filter(f => !f.matched).map(f => f.name.replace(' Match', '').replace(' Compatibility', ''))
  const verdict = matchScore >= 75 ? 'Strong fit' : matchScore >= 50 ? 'Worth a conversation' : 'Weak fit'
  let text = `${verdict} at ${matchScore}%.`
  if (hits.length) text += ` Aligned on ${hits.join(', ')}.`
  if (misses.length) text += ` Misaligned on ${misses.join(', ')}.`
  return text
}

/**
 * Score + filter + sort a candidate pool against one counterpart profile.
 * Returns scored items (each with matchScore, factors, explanation).
 */
export function scorePool(items, counterpart, { minScore = 0, desc = true, isStartupPool = true } = {}) {
  return items
    .map(item => {
      const scored = isStartupPool
        ? calculateStartupInvestorMatch(item, counterpart)
        : calculateStartupInvestorMatch(counterpart, item)
      return { ...item, ...scored, explanation: explainMatch(scored) }
    })
    .filter(m => m.matchScore >= minScore)
    .sort((a, b) => (desc ? b.matchScore - a.matchScore : a.matchScore - b.matchScore))
}
