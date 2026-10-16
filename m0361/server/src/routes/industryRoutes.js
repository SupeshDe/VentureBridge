import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import Industry from '../models/Industry.js'

const router = Router()

// Public (authenticated) list of active industries for filters/forms
router.get('/', protect, async (_req, res, next) => {
  try {
    const industries = await Industry.find({ isActive: true }).sort({ name: 1 }).lean()
    res.json({ success: true, data: industries })
  } catch (error) {
    next(error)
  }
})

export default router
