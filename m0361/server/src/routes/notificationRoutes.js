import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotificationById
} from '../controllers/notificationController.js'

const router = Router()

// All routes require authentication
router.use(protect)

router.get('/', getNotifications)
router.get('/unread/count', getUnreadCount)
router.put('/:id/read', markNotificationRead)
router.put('/read-all', markAllNotificationsRead)
router.delete('/:id', deleteNotificationById)

export default router
