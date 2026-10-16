import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  proposeMeeting,
  getConnectionMeetings,
  respondMeeting,
} from '../controllers/meetingController.js'

const router = Router()

router.use(protect)

router.post('/', proposeMeeting)
router.get('/connection/:connectionId', getConnectionMeetings)
router.put('/:id', respondMeeting)

export default router
