import { beforeEach, describe, expect, it, vi } from 'vitest'

const { Favourite, InvestorFavourite, InvestorProfile, Startup } = vi.hoisted(() => ({
  Favourite: { find: vi.fn(), countDocuments: vi.fn() },
  InvestorFavourite: { find: vi.fn(), countDocuments: vi.fn(), findOne: vi.fn(), create: vi.fn() },
  InvestorProfile: { findById: vi.fn() },
  Startup: {},
}))

vi.mock('../models/Favourite.js', () => ({ default: Favourite }))
vi.mock('../models/InvestorFavourite.js', () => ({ default: InvestorFavourite }))
vi.mock('../models/InvestorProfile.js', () => ({ default: InvestorProfile }))
vi.mock('../models/Startup.js', () => ({ default: Startup }))

const { addFavourite, getFavourites } = await import('./favouriteController.js')

function response() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() }
}

describe('entrepreneur investor favourites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds an investor profile to the current entrepreneur favourites', async () => {
    const profile = { _id: 'investor-profile-1' }
    const favourite = { entrepreneur: 'founder-1', investorProfile: profile._id }
    InvestorProfile.findById.mockResolvedValue(profile)
    InvestorFavourite.findOne.mockResolvedValue(null)
    InvestorFavourite.create.mockResolvedValue(favourite)
    const res = response()

    await addFavourite({
      user: { _id: 'founder-1', role: 'entrepreneur' },
      body: { investorProfileId: profile._id },
    }, res, vi.fn())

    expect(InvestorFavourite.create).toHaveBeenCalledWith({
      entrepreneur: 'founder-1',
      investorProfile: profile._id,
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: favourite,
    }))
  })

  it('returns the current entrepreneur saved investor profiles', async () => {
    const favourites = [{ investorProfile: { _id: 'investor-profile-1' } }]
    const query = {
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue(favourites),
    }
    InvestorFavourite.find.mockReturnValue(query)
    InvestorFavourite.countDocuments.mockResolvedValue(1)
    const res = response()

    await getFavourites({
      user: { _id: 'founder-1', role: 'entrepreneur' },
      query: { page: '1', limit: '20' },
    }, res, vi.fn())

    expect(InvestorFavourite.find).toHaveBeenCalledWith({ entrepreneur: 'founder-1' })
    expect(query.populate).toHaveBeenCalledWith({
      path: 'investorProfile',
      populate: { path: 'user', select: 'name profileImage location' },
    })
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: favourites,
      pagination: expect.objectContaining({ total: 1 }),
    }))
  })
})
