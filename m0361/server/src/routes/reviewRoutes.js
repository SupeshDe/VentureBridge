import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { upsertReview, getUserReviews, deleteReview } from '../controllers/reviewController.js'

const router = Router()

router.use(protect)

router.post('/', upsertReview)
router.get('/user/:userId', getUserReviews)
router.delete('/:id', deleteReview)

export default router
