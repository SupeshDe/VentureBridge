import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  getConnections,
  getConnection,
  updateConnectionActivity,
  archiveConnection
} from '../controllers/connectionController.js'

const router = Router()

// All routes require authentication
router.use(protect)

router.get('/', getConnections)
router.get('/:id', getConnection)
router.put('/:id/activity', updateConnectionActivity)
router.put('/:id/archive', archiveConnection)

export default router
