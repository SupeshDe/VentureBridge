import { Router } from 'express'
import { protect, allowRoles } from '../middleware/authMiddleware.js'
import {
  getPlatformStats,
  getUsers,
  getUserDetails,
  updateUserStatus,
  getAllStartups,
  updateStartupVerification,
  getAllInvestors,
  updateInvestorVerification,
  getReports,
  updateReportStatus,
  deleteUser
} from '../controllers/adminController.js'
import {
  adminListIndustries,
  adminCreateIndustry,
  adminUpdateIndustry,
  adminDeleteIndustry,
} from '../controllers/industryController.js'
import { adminListDocuments, adminDeleteDocument } from '../controllers/documentController.js'

const router = Router()

// All routes require admin role
router.use(protect, allowRoles('admin'))

// Platform statistics
router.get('/stats', getPlatformStats)

// User management
router.get('/users', getUsers)
router.get('/users/:id', getUserDetails)
router.put('/users/:id/status', updateUserStatus)
router.delete('/users/:id', deleteUser)

// Startup management
router.get('/startups', getAllStartups)
router.put('/startups/:id/verification', updateStartupVerification)

// Investor management
router.get('/investors', getAllInvestors)
router.put('/investors/:id/verification', updateInvestorVerification)

// Reports
router.get('/reports', getReports)
router.put('/reports/:id', updateReportStatus)

// Industries / categories
router.get('/industries', adminListIndustries)
router.post('/industries', adminCreateIndustry)
router.put('/industries/:id', adminUpdateIndustry)
router.delete('/industries/:id', adminDeleteIndustry)

// Uploaded content
router.get('/documents', adminListDocuments)
router.delete('/documents/:id', adminDeleteDocument)

export default router
