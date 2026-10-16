import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  sendRequest,
  getPendingRequestCount,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest
} from '../controllers/requestController.js'

const router = Router()

// All routes require authentication
router.use(protect)

router.post('/', sendRequest)
router.get('/pending/count', getPendingRequestCount)
router.get('/sent', getSentRequests)
router.get('/received', getReceivedRequests)
router.put('/:id/accept', acceptRequest)
router.put('/:id/reject', rejectRequest)
router.put('/:id/cancel', cancelRequest)

export default router
