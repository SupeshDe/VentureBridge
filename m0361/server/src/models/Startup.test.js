import { describe, expect, it } from 'vitest'
import { calculateStartupCompletion } from './Startup.js'

describe('calculateStartupCompletion', () => {
  it('reports a complete core profile as 100 percent without optional fields', () => {
    expect(calculateStartupCompletion({
      name: 'AeroPay',
      description: 'AeroPay speeds up payments for logistics fleets.',
      industry: 'Fintech',
      startupStage: 'Seed',
      location: 'Bengaluru',
      businessModel: 'Subscription and transaction fees.',
      targetMarket: 'Mid-sized logistics fleets in India.',
      fundingRequired: { amount: 5000000 },
    })).toBe(100)
  })

  it('counts a required profile field as incomplete when it is missing', () => {
    expect(calculateStartupCompletion({
      name: 'AeroPay',
      description: 'AeroPay speeds up payments for logistics fleets.',
      industry: 'Fintech',
      startupStage: 'Seed',
      location: 'Bengaluru',
      businessModel: 'Subscription and transaction fees.',
      targetMarket: 'Mid-sized logistics fleets in India.',
      fundingRequired: { amount: 0 },
    })).toBe(88)
  })

  it('does not count optional pitch deck, revenue, website, team, or equity as missing', () => {
    const profile = {
      name: 'AeroPay',
      description: 'AeroPay speeds up payments for logistics fleets.',
      industry: 'Fintech',
      startupStage: 'Seed',
      location: 'Bengaluru',
      businessModel: 'Subscription and transaction fees.',
      targetMarket: 'Mid-sized logistics fleets in India.',
      fundingRequired: { amount: 5000000 },
    }

    expect(calculateStartupCompletion(profile)).toBe(100)
    expect(calculateStartupCompletion({
      ...profile,
      pitchDeckUrl: '',
      revenue: { amount: 0 },
      website: '',
      teamSize: undefined,
      equityOffered: undefined,
    })).toBe(100)
  })
})
