import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import { validate } from '../middleware/validate.js'
import { investorSchema } from '../validators/schemas.js'
import {
  createInvestorProfile,
  getInvestors,
  getInvestor,
  getMyInvestorProfile,
  updateInvestorProfile,
  deleteInvestorProfile
} from '../controllers/investorController.js'

const router = Router()

router.get('/me/profile', protect, allowRoles('investor'), getMyInvestorProfile)
router.put('/me/profile', protect, allowRoles('investor'), validate(investorSchema.partial ? investorSchema.partial() : investorSchema), updateInvestorProfile)
router.delete('/me/profile', protect, allowRoles('investor'), deleteInvestorProfile)

router.get('/', protect, getInvestors)
router.get('/:id', protect, getInvestor)
router.post('/', protect, allowRoles('investor'), validate(investorSchema), createInvestorProfile)

export default router
