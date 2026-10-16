import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead
} from '../controllers/chatController.js'

const router = Router()

// All routes require authentication
router.use(protect)

router.get('/conversations', getConversations)
router.get('/conversations/:id', getConversation)
router.post('/messages', sendMessage)
router.put('/conversations/:conversationId/read', markAsRead)

export default router
