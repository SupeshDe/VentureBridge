import { Router } from 'express'
import { register, verifyEmail, resendVerificationCode, login, logout, me } from '../controllers/authController.js'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, verifyEmailSchema, resendVerificationCodeSchema, loginSchema } from '../validators/schemas.js'
const router = Router()
router.post('/register', validate(registerSchema), register)
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)
router.post('/resend-verification-code', validate(resendVerificationCodeSchema), resendVerificationCode)
router.post('/login', validate(loginSchema), login)
router.post('/logout', logout)
// optionalProtect: returns 200 for guests instead of 401 to avoid console noise on landing
router.get('/me', optionalProtect, me)
router.get('/session', optionalProtect, me)
export default router
