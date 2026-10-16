import { createHmac } from 'crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '../config/env.js'

const { User, Startup, InvestorProfile, notifyUser, sendVerificationCode } = vi.hoisted(() => ({
  User: {
    exists: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
  },
  Startup: {
    updateOne: vi.fn(),
  },
  InvestorProfile: {
    updateOne: vi.fn(),
  },
  notifyUser: vi.fn(),
  sendVerificationCode: vi.fn(),
}))

vi.mock('../models/User.js', () => ({ default: User }))
vi.mock('../models/Startup.js', () => ({ default: Startup }))
vi.mock('../models/InvestorProfile.js', () => ({ default: InvestorProfile }))
vi.mock('../services/emailService.js', () => ({
  notifyUser,
  sendVerificationCode,
  templates: { welcome: vi.fn() },
}))

const { register, verifyEmail, resendVerificationCode } = await import('./authController.js')

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.exists.mockResolvedValue(false)
    Startup.updateOne.mockResolvedValue({})
    InvestorProfile.updateOne.mockResolvedValue({})
    notifyUser.mockResolvedValue(undefined)
    sendVerificationCode.mockResolvedValue({ messageId: 'mail-1' })
  })

  it('creates a startup profile for an entrepreneur', async () => {
    const user = { _id: 'user-1', name: 'Aarav Sharma', email: 'aarav@example.com', role: 'entrepreneur', save: vi.fn().mockResolvedValue(undefined) }
    User.create.mockResolvedValue(user)
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next = vi.fn()

    await register({ body: { name: user.name, email: 'aarav@example.com', password: 'password123' } }, res, next)

    expect(Startup.updateOne).toHaveBeenCalledWith(
      { owner: user._id },
      { $setOnInsert: { owner: user._id, name: user.name } },
      { upsert: true }
    )
    expect(InvestorProfile.updateOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(sendVerificationCode).toHaveBeenCalledWith('aarav@example.com', expect.stringMatching(/^\d{6}$/))
    expect(next).not.toHaveBeenCalled()
  })

  it('creates an investor profile for an investor', async () => {
    const user = { _id: 'user-2', name: 'Mira Capital', email: 'mira@example.com', role: 'investor', save: vi.fn().mockResolvedValue(undefined) }
    User.create.mockResolvedValue(user)
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next = vi.fn()

    await register({ body: { name: user.name, email: 'mira@example.com', password: 'password123', role: 'investor' } }, res, next)

    expect(InvestorProfile.updateOne).toHaveBeenCalledWith(
      { user: user._id },
      { $setOnInsert: { user: user._id, organization: user.name } },
      { upsert: true }
    )
    expect(Startup.updateOne).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
    expect(next).not.toHaveBeenCalled()
  })

  it('sends a new code when a registration is retried for an unverified account', async () => {
    const user = { _id: 'user-3', name: 'Aarav', email: 'aarav@example.com', role: 'entrepreneur', isVerified: false, save: vi.fn().mockResolvedValue(undefined) }
    User.exists.mockResolvedValue(true)
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(user) })
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

    await register({ body: { name: 'Aarav', email: 'aarav@example.com', password: 'password123' } }, res, vi.fn())

    expect(sendVerificationCode).toHaveBeenCalledWith('aarav@example.com', expect.stringMatching(/^\d{6}$/))
    expect(res.status).toHaveBeenCalledWith(200)
  })
})

describe('verifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('verifies the email, clears the code, and issues a session', async () => {
    const code = '012345'
    const user = {
      _id: 'user-4',
      name: 'Aarav',
      email: 'aarav@example.com',
      role: 'entrepreneur',
      isVerified: false,
      verificationCodeHash: createHmac('sha256', env.jwtSecret).update(code).digest('hex'),
      verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      verificationCodeAttempts: 0,
      save: vi.fn().mockResolvedValue(undefined),
    }
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(user) })
    const res = { cookie: vi.fn(), json: vi.fn() }

    await verifyEmail({ body: { email: 'AARAV@example.com', code } }, res, vi.fn())

    expect(user.isVerified).toBe(true)
    expect(user.verificationCodeHash).toBeUndefined()
    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object))
    expect(notifyUser).toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }))
  })

  it('increments attempts when the code is incorrect', async () => {
    const user = {
      isVerified: false,
      verificationCodeHash: createHmac('sha256', env.jwtSecret).update('012345').digest('hex'),
      verificationCodeExpiresAt: new Date(Date.now() + 60_000),
      verificationCodeAttempts: 0,
      save: vi.fn().mockResolvedValue(undefined),
    }
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(user) })
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

    await verifyEmail({ body: { email: 'aarav@example.com', code: '543210' } }, res, vi.fn())

    expect(user.verificationCodeAttempts).toBe(1)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.cookie).toBeUndefined()
  })
})

describe('resendVerificationCode', () => {
  it('does not send another code during the resend cooldown', async () => {
    const user = {
      isVerified: false,
      verificationCodeSentAt: new Date(),
    }
    User.findOne.mockReturnValue({ select: vi.fn().mockResolvedValue(user) })
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() }

    await resendVerificationCode({ body: { email: 'aarav@example.com' } }, res, vi.fn())

    expect(res.status).toHaveBeenCalledWith(429)
    expect(sendVerificationCode).not.toHaveBeenCalled()
  })
})
