import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import {
  addFavourite,
  getFavourites,
  removeFavourite,
  removeInvestorFavourite,
  isFavourite
} from '../controllers/favouriteController.js'

const router = Router()

// Startup favourites are investor-only; investor-profile favourites are entrepreneur-only.
router.use(protect, allowRoles('investor', 'entrepreneur'))

router.post('/', addFavourite)
router.get('/', getFavourites)
router.delete('/investors/:investorProfileId', allowRoles('entrepreneur'), removeInvestorFavourite)
router.get('/investors/:startupId/check', allowRoles('entrepreneur'), isFavourite)
router.delete('/:startupId', allowRoles('investor'), removeFavourite)
router.get('/:startupId/check', allowRoles('investor'), isFavourite)

export default router
