import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { env } from '../config/env.js'
export async function protect(req, res, next) { try { const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', ''); if (!token) return res.status(401).json({ success: false, message: 'Authentication required' }); const decoded = jwt.verify(token, env.jwtSecret); req.user = await User.findById(decoded.id); if (!req.user?.isActive) return res.status(401).json({ success: false, message: 'Account is inactive' }); if (req.user.role !== 'admin' && !req.user.isVerified) return res.status(403).json({ success: false, message: 'Verify your email address before using this account.' }); next() } catch { res.status(401).json({ success: false, message: 'Invalid or expired session' }) } }
export async function optionalProtect(req, _res, next) {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '')
    if (!token) { req.user = null; return next() }
    const decoded = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(decoded.id)
    if (!user?.isActive) { req.user = null; return next() }
    if (user.role !== 'admin' && !user.isVerified) { req.user = null; return next() }
    req.user = user
    return next()
  } catch { req.user = null; return next() }
}
export const allowRoles = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({ success: false, message: 'You do not have permission for this resource' })
