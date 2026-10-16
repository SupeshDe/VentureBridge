import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import {
  uploadDocument,
  getMyDocuments,
  getStartupDocuments,
  getConnectionDocuments,
  downloadDocument,
  deleteDocument,
} from '../controllers/documentController.js'

const router = Router()

router.use(protect)

router.post('/', uploadDocument)
router.get('/me', getMyDocuments)
router.get('/startup/:startupId', getStartupDocuments)
router.get('/connection/:connectionId', getConnectionDocuments)
router.get('/:id/file', downloadDocument)
router.delete('/:id', deleteDocument)

export default router
