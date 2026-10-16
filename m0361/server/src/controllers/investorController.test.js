import { beforeEach, describe, expect, it, vi } from 'vitest'

const { InvestorProfile } = vi.hoisted(() => ({
  InvestorProfile: {
    findOneAndUpdate: vi.fn(),
  },
}))

vi.mock('../models/InvestorProfile.js', () => ({ default: InvestorProfile }))
vi.mock('../models/Startup.js', () => ({ default: {} }))
vi.mock('../services/matchingService.js', () => ({
  scorePool: vi.fn(),
  MATCH_POOL_CAP: 100,
}))
vi.mock('./reviewController.js', () => ({ ratingSummaryFor: vi.fn() }))

const { getMyInvestorProfile, updateInvestorProfile } = await import('./investorController.js')

describe('getMyInvestorProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('repairs a missing investor profile and returns the persisted profile', async () => {
    const profile = { _id: 'profile-1', organization: 'Mira Capital' }
    const populate = vi.fn().mockResolvedValue(profile)
    InvestorProfile.findOneAndUpdate.mockReturnValue({ populate })
    const req = { user: { _id: 'user-1', name: 'Mira Capital' } }
    const res = { json: vi.fn() }
    const next = vi.fn()

    await getMyInvestorProfile(req, res, next)

    expect(InvestorProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, organization: req.user.name } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )
    expect(populate).toHaveBeenCalledWith('user', 'name email profileImage location')
    expect(res.json).toHaveBeenCalledWith({ success: true, data: profile, exists: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('passes database errors to the error handler', async () => {
    const error = new Error('database unavailable')
    InvestorProfile.findOneAndUpdate.mockImplementation(() => { throw error })
    const next = vi.fn()

    await getMyInvestorProfile(
      { user: { _id: 'user-1', name: 'Mira Capital' } },
      { json: vi.fn() },
      next
    )

    expect(next).toHaveBeenCalledWith(error)
  })

  it('persists submitted profile data with an upsert and resets verification', async () => {
    const profile = { _id: 'profile-1', organization: 'Mira Capital' }
    InvestorProfile.findOneAndUpdate.mockResolvedValue(profile)
    const req = {
      user: { _id: 'user-1' },
      body: {
        organization: 'Mira Capital',
        bio: 'Early-stage investor',
        isVerified: true,
        user: 'someone-else',
      },
    }
    const res = { json: vi.fn() }
    const next = vi.fn()

    await updateInvestorProfile(req, res, next)

    expect(InvestorProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { user: req.user._id },
      {
        $set: { organization: 'Mira Capital', bio: 'Early-stage investor', isVerified: false },
        $setOnInsert: { user: req.user._id },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    )
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: profile,
    }))
    expect(next).not.toHaveBeenCalled()
  })
})
