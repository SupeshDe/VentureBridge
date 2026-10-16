import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import {
  expressInterest,
  getMyInterests,
  getReceivedInterests,
  withdrawInterest,
} from '../controllers/interestController.js'

const router = Router()

router.use(protect)

router.post('/', allowRoles('investor'), expressInterest)
router.get('/me', allowRoles('investor'), getMyInterests)
router.get('/received', allowRoles('entrepreneur'), getReceivedInterests)
router.delete('/:id', allowRoles('investor'), withdrawInterest)

export default router
