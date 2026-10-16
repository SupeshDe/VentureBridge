import Startup, { calculateStartupCompletion } from '../models/Startup.js'
import Document from '../models/Document.js'

const STAGE_ORDER = ['Idea', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Growth', 'Pre-IPO']

function sentences(text, max = 2) {
  if (!text) return []
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, max)
}

function inr(amount) {
  if (amount == null) return null
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(amount % 10000000 === 0 ? 0 : 1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} L`
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

/**
 * Heuristic startup analysis — no external AI dependency, runs fully offline.
 * Produces the same shape every time: summary, strengths, gaps, risks.
 */
export async function analyzeStartup(startupId) {
  const startup = await Startup.findById(startupId).populate('owner', 'name').lean()
  if (!startup) return null

  const docCount = await Document.countDocuments({ startup: startup._id })
  const pitchDeck = await Document.exists({ startup: startup._id, category: 'pitch-deck' })
  const completeness = calculateStartupCompletion(startup)

  const ask = startup.fundingRequired?.amount
  const desc = sentences(startup.description)
  const summaryParts = [
    `${startup.name} is a ${startup.startupStage || 'early-stage'} ${startup.industry || 'startup'}${startup.location ? ` based in ${startup.location}` : ''}.`,
    ask ? `It is raising ${inr(ask)}${startup.equityOffered != null ? ` for ${startup.equityOffered}% equity` : ''}.` : null,
    desc[0] || null,
  ].filter(Boolean)

  const strengths = []
  if (startup.isVerified) strengths.push('Verified profile — identity and headline claims checked by reviewers.')
  if (pitchDeck) strengths.push('Pitch deck attached and visible to connections.')
  if ((startup.revenue?.amount ?? 0) > 0) strengths.push(`Revenue traction reported (${inr(startup.revenue.amount)}).`)
  if ((startup.description || '').length > 300) strengths.push('Detailed company description helps investors screen faster.')
  if ((startup.teamSize ?? 0) >= 3) strengths.push(`Team of ${startup.teamSize} signals execution capacity.`)
  if ((startup.tags || []).length > 0) strengths.push('Tagged profile improves discovery across sectors.')
  if (startup.website) strengths.push('Public website linked for diligence.')
  if (docCount >= 3) strengths.push(`${docCount} diligence documents available.`)

  const gaps = []
  if (!pitchDeck) gaps.push('No pitch deck attached — investors open decks before requesting intros.')
  if ((startup.description || '').length < 120) gaps.push('Description is thin — aim for problem, product, traction and ask.')
  if (!startup.businessModel) gaps.push('Business model not described.')
  if (!startup.targetMarket) gaps.push('Target market not defined.')
  if (!startup.revenue?.amount) gaps.push('No revenue reported yet.')
  if (!startup.teamSize) gaps.push('Team size missing — investors screen on team.')
  if (!startup.valuation?.amount && ask) gaps.push('No valuation stated for the raise.')

  const risks = []
  const stageIdx = STAGE_ORDER.indexOf(startup.startupStage)
  if (stageIdx >= 0 && stageIdx <= 1 && ask && ask > 10000000) {
    risks.push(`Early-stage (${startup.startupStage}) raise above ₹1 Cr — expect valuation scrutiny.`)
  }
  if ((startup.equityOffered ?? 0) > 25) {
    risks.push(`Equity offered (${startup.equityOffered}%) is high for a single round — dilution concern.`)
  }
  if (!startup.isVerified) risks.push('Unverified profile ranks lower and converts fewer intros.')
  if (startup.riskPreference === 'High' && stageIdx >= 4) {
    risks.push('Late-stage profile flagged high-risk — thesis mismatch likely for conservative funds.')
  }
  if (risks.length === 0) risks.push('No structural red flags detected in the profile data.')

  return {
    startup: startup._id,
    generatedAt: new Date().toISOString(),
    engine: 'heuristic-v1',
    disclaimer: 'Automated rule-based insights, not financial advice. Verify claims during diligence.',
    completeness,
    summary: summaryParts.join(' '),
    strengths,
    gaps,
    risks,
  }
}
