import Report from '../models/Report.js'
import { createNotification } from '../services/notificationService.js'

const REASONS = ['spam', 'fraud', 'inappropriate', 'fake-profile', 'harassment', 'other']

/**
 * File a report against a user or a startup (authenticated users)
 */
export async function createReport(req, res, next) {
  try {
    const { reportedUser, reportedStartup, reason, description } = req.body

    if (!reportedUser && !reportedStartup) {
      return res.status(400).json({ success: false, message: 'Report must target a user or a startup' })
    }
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Choose a valid reason' })
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ success: false, message: 'Describe what happened' })
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUser || undefined,
      reportedStartup: reportedStartup || undefined,
      reason,
      description: String(description).slice(0, 1000),
    })

    // Alert every admin via in-app notification
    const { default: User } = await import('../models/User.js')
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean()
    await Promise.all(
      admins.map(a =>
        createNotification({
          recipient: a._id,
          type: 'admin_announcement',
          title: `New ${reason} report`,
          message: `A ${reportedStartup ? 'startup' : 'user'} was reported — review the queue`,
          relatedId: report._id,
          relatedModel: undefined,
        }).catch(() => null)
      )
    )

    res.status(201).json({ success: true, message: 'Report submitted — our team will review it', data: { id: report._id } })
  } catch (error) {
    next(error)
  }
}
