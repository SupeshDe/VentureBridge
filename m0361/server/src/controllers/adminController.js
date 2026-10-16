import User from '../models/User.js'
import mongoose from 'mongoose'
import Startup from '../models/Startup.js'
import InvestorProfile from '../models/InvestorProfile.js'
import CollaborationRequest from '../models/CollaborationRequest.js'
import Connection from '../models/Connection.js'
import Conversation from '../models/Conversation.js'
import Document from '../models/Document.js'
import Favourite from '../models/Favourite.js'
import Interest from '../models/Interest.js'
import Message from '../models/Message.js'
import Review from '../models/Review.js'
import Notification from '../models/Notification.js'
import Report from '../models/Report.js'
import { createNotification } from '../services/notificationService.js'
import { notifyUser, templates, isEmailEnabled } from '../services/emailService.js'
import { notifyMatchingInvestors, notifyMatchingStartups } from '../services/discoveryNotify.js'

/**
 * Get platform statistics
 */
export async function getPlatformStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalEntrepreneurs,
      totalInvestors,
      totalStartups,
      verifiedStartups,
      totalRequests,
      acceptedRequests,
      totalConnections,
      totalMessages,
      pendingReports,
      pendingUsers,
      pendingStartups,
      pendingInvestors,
      pendingRequests,
      rejectedRequests,
      recentSignups,
      recentDocs,
      weekSignups
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'entrepreneur' }),
      User.countDocuments({ role: 'investor' }),
      Startup.countDocuments(),
      Startup.countDocuments({ isVerified: true }),
      CollaborationRequest.countDocuments(),
      CollaborationRequest.countDocuments({ status: 'accepted' }),
      Connection.countDocuments({ status: 'active' }),
      Message.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: { $ne: 'admin' }, isVerified: false }),
      Startup.countDocuments({ isVerified: false }),
      InvestorProfile.countDocuments({ isVerified: false }),
      CollaborationRequest.countDocuments({ status: 'pending' }),
      CollaborationRequest.countDocuments({ status: { $in: ['rejected', 'cancelled'] } }),
      User.find({ role: { $ne: 'admin' } }).select('name email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Document.countDocuments(),
      // New users per day for the last 7 days (excluding admins)
      User.find({
        createdAt: { $gte: (() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d })() },
        role: { $ne: 'admin' },
      }).select('createdAt').lean(),
    ])

    // Bucket signups by local weekday, oldest → newest
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets = new Map()
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      buckets.set(d.toDateString(), { name: dayNames[d.getDay()], users: 0 })
    }
    for (const u of weekSignups) {
      const key = new Date(u.createdAt).toDateString()
      if (buckets.has(key)) buckets.get(key).users += 1
    }
    const growth = [...buckets.values()]

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEntrepreneurs,
        totalInvestors,
        totalStartups,
        verifiedStartups,
        pendingVerification: totalStartups - verifiedStartups,
        totalRequests,
        acceptedRequests,
        pendingRequests,
        rejectedRequests,
        totalConnections,
        totalMessages,
        pendingReports,
        pendingUsers,
        pendingStartups,
        pendingInvestors,
        totalDocuments: recentDocs,
        recentSignups,
        system: {
          db: mongoose.connection.readyState === 1 ? 'connected' : 'unavailable',
          email: isEmailEnabled() ? 'configured' : 'off',
          uptimeSec: Math.floor(process.uptime()),
          env: process.env.NODE_ENV || 'development',
        },
        growth
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all users with pagination
 */
export async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, role, isActive, isVerified, search } = req.query

    const query = {}
    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === 'true'
    if (isVerified !== undefined) query.isVerified = isVerified === 'true'
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query)
    ])

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get user details
 */
export async function getUserDetails(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Get related data
    let profileData = null
    if (user.role === 'entrepreneur') {
      profileData = await Startup.findOne({ owner: user._id })
    } else if (user.role === 'investor') {
      profileData = await InvestorProfile.findOne({ user: user._id })
    }

    res.json({
      success: true,
      data: {
        user,
        profile: profileData
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(req, res, next) {
  try {
    const { isActive, isVerified } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (isActive !== undefined) user.isActive = isActive
    if (isVerified !== undefined) user.isVerified = isVerified

    await user.save()

    // Send notification
    if (isVerified === true) {
      await createNotification({
        recipient: user._id,
        type: 'profile_verified',
        title: 'Profile verified',
        message: 'Your profile has been verified by our team'
      })
      notifyUser(user._id, templates.accountVerified(user.name, true)).catch(() => {})
    } else if (isVerified === false) {
      await createNotification({
        recipient: user._id,
        type: 'profile_rejected',
        title: 'Profile verification failed',
        message: 'Your profile verification was unsuccessful. Please update your information.'
      })
      notifyUser(user._id, templates.accountVerified(user.name, false)).catch(() => {})
    }

    res.json({
      success: true,
      message: 'User status updated',
      data: user
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all startups for admin review
 */
export async function getAllStartups(req, res, next) {
  try {
    const { page = 1, limit = 20, isVerified, search } = req.query

    const query = {}
    if (isVerified !== undefined) query.isVerified = isVerified === 'true'
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [startups, total] = await Promise.all([
      Startup.find(query)
        .populate('owner', 'name email isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Startup.countDocuments(query)
    ])

    res.json({
      success: true,
      data: startups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update startup verification status
 */
export async function updateStartupVerification(req, res, next) {
  try {
    const { isVerified } = req.body

    const startup = await Startup.findById(req.params.id)

    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }

    startup.isVerified = isVerified
    await startup.save()

    // Notify owner
    await createNotification({
      recipient: startup.owner,
      type: isVerified ? 'profile_verified' : 'profile_rejected',
      title: isVerified ? 'Startup verified' : 'Startup verification failed',
      message: isVerified 
        ? 'Your startup profile has been verified' 
        : 'Your startup profile verification was unsuccessful',
      relatedId: startup._id,
      relatedModel: 'Startup'
    })
    notifyUser(startup.owner, {
      build: u => templates.profileVerified(u.name, 'Startup', startup.name, Boolean(isVerified)),
    }).catch(() => {})
    if (isVerified) {
      // Alert best-fit investors about the newly verified startup (fire-and-forget)
      notifyMatchingInvestors(startup._id).catch(() => {})
    }

    res.json({
      success: true,
      message: 'Startup verification status updated',
      data: startup
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all investor profiles for admin review
 */
export async function getAllInvestors(req, res, next) {
  try {
    const { page = 1, limit = 20, isVerified, search } = req.query

    const query = {}
    if (isVerified !== undefined) query.isVerified = isVerified === 'true'
    if (search) {
      query.$or = [
        { organization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [investors, total] = await Promise.all([
      InvestorProfile.find(query)
        .populate('user', 'name email isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InvestorProfile.countDocuments(query)
    ])

    res.json({
      success: true,
      data: investors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update investor profile verification status
 */
export async function updateInvestorVerification(req, res, next) {
  try {
    const { isVerified } = req.body

    const investor = await InvestorProfile.findById(req.params.id)

    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor profile not found' })
    }

    investor.isVerified = isVerified
    await investor.save()

    // Notify owner
    await createNotification({
      recipient: investor.user,
      type: isVerified ? 'profile_verified' : 'profile_rejected',
      title: isVerified ? 'Investor profile verified' : 'Investor profile verification failed',
      message: isVerified
        ? 'Your investor profile has been verified'
        : 'Your investor profile verification was unsuccessful',
      relatedId: investor._id,
      relatedModel: 'InvestorProfile'
    })
    notifyUser(investor.user, {
      build: u => templates.profileVerified(u.name, 'Investor', investor.organization || 'your investor profile', Boolean(isVerified)),
    }).catch(() => {})
    if (isVerified) {
      // Alert owners of best-fit startups about the newly verified investor (fire-and-forget)
      notifyMatchingStartups(investor._id).catch(() => {})
    }

    res.json({
      success: true,
      message: 'Investor verification status updated',
      data: investor
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get all reports
 */
export async function getReports(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query

    const query = {}
    if (status) query.status = status

    const skip = (Number(page) - 1) * Number(limit)

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reporter', 'name email')
        .populate('reportedUser', 'name email')
        .populate('reportedStartup', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(query)
    ])

    res.json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update report status
 */
export async function updateReportStatus(req, res, next) {
  try {
    const { status, adminNotes } = req.body

    const report = await Report.findById(req.params.id)

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' })
    }

    report.status = status || report.status
    report.adminNotes = adminNotes || report.adminNotes
    report.reviewedBy = req.user._id
    report.reviewedAt = new Date()

    await report.save()

    res.json({
      success: true,
      message: 'Report updated',
      data: report
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(req, res, next) {
  try {
    // Safety guards: nobody can delete their own account or another admin
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' })
    }

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted' })
    }

    const userId = user._id

    // Startups owned by this user (needed to cascade interests)
    const ownedStartups = await Startup.find({ owner: userId }).select('_id').lean()
    const ownedStartupIds = ownedStartups.map(s => s._id)

    // Clean up related data (order matters: messages before conversations)
    if (user.role === 'entrepreneur') {
      await Startup.deleteMany({ owner: userId })
    } else if (user.role === 'investor') {
      await InvestorProfile.deleteMany({ user: userId })
      await Favourite.deleteMany({ investor: userId })
    }

    await Interest.deleteMany({ $or: [{ investor: userId }, { startup: { $in: ownedStartupIds } }] })

    // Documents owned by this user (record + stored file)
    const { default: path } = await import('path')
    const { default: fs } = await import('fs')
    const { UPLOAD_ROOT } = await import('../config/upload.js')
    const userDocs = await Document.find({ owner: userId }).select('_id fileName').lean()
    for (const d of userDocs) {
      fs.unlink(path.join(UPLOAD_ROOT, `${d._id}${path.extname(d.fileName).toLowerCase()}`), () => {})
    }
    await Document.deleteMany({ owner: userId })

    await CollaborationRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] })

    const connections = await Connection.find({ $or: [{ entrepreneur: userId }, { investor: userId }] }).select('_id').lean()
    const connectionIds = connections.map(c => c._id)
    if (connectionIds.length > 0) {
      const convos = await Conversation.find({ connection: { $in: connectionIds } }).select('_id').lean()
      const convoIds = convos.map(c => c._id)
      if (convoIds.length > 0) {
        await Message.deleteMany({ conversation: { $in: convoIds } })
      }
      await Conversation.deleteMany({ connection: { $in: connectionIds } })
      await Connection.deleteMany({ _id: { $in: connectionIds } })
    }
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] })
    await Review.deleteMany({ $or: [{ reviewer: userId }, { reviewee: userId }] })
    await Notification.deleteMany({ recipient: userId })

    await User.deleteOne({ _id: userId })

    res.json({
      success: true,
      message: 'User and related data deleted'
    })
  } catch (error) {
    next(error)
  }
}
