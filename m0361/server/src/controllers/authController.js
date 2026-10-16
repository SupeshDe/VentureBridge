import { createHmac, randomInt, timingSafeEqual } from 'crypto'
import { Buffer } from 'buffer'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'
import { notifyUser, sendVerificationCode, templates } from '../services/emailService.js'
import { env } from '../config/env.js'

const signToken = id => jwt.sign({ id }, env.jwtSecret, { expiresIn: '7d' })
const publicUser = user => ({ id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified })
const OTP_LIFETIME_MS = 10 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 60 * 1000
const OTP_MAX_ATTEMPTS = 5
const OTP_FIELDS = '+verificationCodeHash +verificationCodeExpiresAt +verificationCodeAttempts +verificationCodeSentAt'
const hashVerificationCode = code => createHmac('sha256', env.jwtSecret).update(code).digest('hex')

async function issueVerificationCode(user) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  user.verificationCodeHash = hashVerificationCode(code)
  user.verificationCodeExpiresAt = new Date(Date.now() + OTP_LIFETIME_MS)
  user.verificationCodeAttempts = 0
  await user.save()
  await sendVerificationCode(user.email, code)
  user.verificationCodeSentAt = new Date()
  await user.save()
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role = 'entrepreneur' } = req.body
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' })
    if (!['entrepreneur', 'investor'].includes(role)) return res.status(400).json({ success: false, message: 'Choose entrepreneur or investor' })
    const normalizedEmail = String(email).trim().toLowerCase()
    if (await User.exists({ email: normalizedEmail })) {
      const existingUser = await User.findOne({ email: normalizedEmail }).select(OTP_FIELDS)
      if (existingUser?.isVerified) return res.status(409).json({ success: false, message: 'An account already exists for this email' })
      if (!existingUser) return res.status(409).json({ success: false, message: 'An account already exists for this email' })
      if (existingUser.verificationCodeSentAt && Date.now() - existingUser.verificationCodeSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
        return res.status(200).json({ success: true, message: 'A verification code was recently sent. Check your email.', pendingVerification: true, data: publicUser(existingUser) })
      }
      await issueVerificationCode(existingUser)
      return res.status(200).json({ success: true, message: 'A new verification code has been sent to your email.', pendingVerification: true, data: publicUser(existingUser) })
    }
    const user = await User.create({ name, email: normalizedEmail, password, role })
    if (role === 'investor') {
      await InvestorProfile.updateOne(
        { user: user._id },
        { $setOnInsert: { user: user._id, organization: user.name } },
        { upsert: true }
      )
    } else {
      await Startup.updateOne(
        { owner: user._id },
        { $setOnInsert: { owner: user._id, name: user.name } },
        { upsert: true }
      )
    }
    await issueVerificationCode(user)
    res.status(201).json({ success: true, message: 'A verification code has been sent to your email.', pendingVerification: true, data: publicUser(user) })
  } catch (error) { next(error) }
}
export async function verifyEmail(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase()
    const user = await User.findOne({ email }).select(OTP_FIELDS)
    if (!user || user.isVerified || !user.verificationCodeHash) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or has expired.' })
    }
    if (user.verificationCodeExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'The verification code is invalid or has expired.' })
    }
    if (user.verificationCodeAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ success: false, message: 'Too many incorrect codes. Request a new verification code.' })
    }
    const expectedHash = Buffer.from(user.verificationCodeHash, 'hex')
    const submittedHash = Buffer.from(hashVerificationCode(req.body.code), 'hex')
    if (!timingSafeEqual(expectedHash, submittedHash)) {
      user.verificationCodeAttempts += 1
      await user.save()
      return res.status(400).json({ success: false, message: 'The verification code is incorrect.' })
    }
    user.isVerified = true
    user.verificationCodeHash = undefined
    user.verificationCodeExpiresAt = undefined
    user.verificationCodeAttempts = 0
    user.verificationCodeSentAt = undefined
    await user.save()
    res.cookie('token', signToken(user._id), { httpOnly: true, sameSite: 'lax', secure: env.isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 })
    notifyUser(user._id, templates.welcome(user.name, user.role)).catch(() => {})
    res.json({ success: true, message: 'Email verified. Welcome to VentureBridge!', data: publicUser(user) })
  } catch (error) { next(error) }
}

export async function resendVerificationCode(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase()
    const user = await User.findOne({ email }).select(OTP_FIELDS)
    if (user && !user.isVerified) {
      const elapsedSinceSend = user.verificationCodeSentAt ? Date.now() - user.verificationCodeSentAt.getTime() : Infinity
      const cooldownRemaining = OTP_RESEND_COOLDOWN_MS - elapsedSinceSend
      if (cooldownRemaining > 0) {
        return res.status(429).json({ success: false, message: `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before requesting another code.` })
      }
      await issueVerificationCode(user)
    }
    res.json({ success: true, message: 'If an unverified account exists for that email, a new code has been sent.' })
  } catch (error) { next(error) }
}

export async function login(req, res, next) { try { const { email, password } = req.body; const user = await User.findOne({ email }).select('+password'); if (!user || !(await user.comparePassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' }); if (!user.isActive) return res.status(401).json({ success: false, message: 'This account has been deactivated. Contact support.' }); if (user.role !== 'admin' && !user.isVerified) return res.status(403).json({ success: false, message: 'Verify your email address before signing in.' }); res.cookie('token', signToken(user._id), { httpOnly: true, sameSite: 'lax', secure: env.isProduction, maxAge: 7 * 24 * 60 * 60 * 1000 }); res.json({ success: true, message: 'Welcome back', data: publicUser(user) }) } catch (error) { next(error) } }
export function logout(_req, res) { res.clearCookie('token'); res.json({ success: true, message: 'Signed out' }) }
export function me(req, res) {
  if (!req.user) {
    return res.json({ success: true, authenticated: false, data: null })
  }
  res.json({ success: true, authenticated: true, data: publicUser(req.user) })
}
