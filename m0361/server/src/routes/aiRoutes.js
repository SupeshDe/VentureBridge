import { Router } from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { getStartupAnalysis, askAssistant } from '../controllers/aiController.js'

const router = Router()

router.use(protect)

router.get('/startups/:id/analysis', getStartupAnalysis)
router.post('/chat', askAssistant)

export default router
