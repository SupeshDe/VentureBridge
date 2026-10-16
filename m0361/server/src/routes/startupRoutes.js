import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { startupSchema } from '../validators/schemas.js'
import {
  createStartup,
  getStartups,
  getStartup,
  getMyStartup,
  updateStartup,
  deleteStartup
} from '../controllers/startupController.js'

const router = Router()

// Authenticated self routes must be before :id
router.get('/me/profile', protect, allowRoles('entrepreneur'), getMyStartup)
router.put('/me/profile', protect, allowRoles('entrepreneur'), validate(startupSchema.partial ? startupSchema.partial() : startupSchema), updateStartup)
router.delete('/me/profile', protect, allowRoles('entrepreneur'), deleteStartup)

// Discovery — protected to enforce rate-limit but allow all authenticated
router.get('/', protect, getStartups)
router.get('/:id', protect, getStartup)

router.post('/', protect, allowRoles('entrepreneur'), validate(startupSchema), createStartup)

export default router
