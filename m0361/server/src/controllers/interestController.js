import Interest from '../models/Interest.js'
import Startup from '../models/Startup.js'
import { createNotification } from '../services/notificationService.js'
import { notifyUser, templates } from '../services/emailService.js'
import { isDuplicateKeyError } from '../utils/mongoErrors.js'

/**
 * Investor expresses interest in a startup (lightweight, pre-request signal)
 */
export async function expressInterest(req, res, next) {
  try {
    const { startupId, message = '' } = req.body
    if (!startupId) {
      return res.status(400).json({ success: false, message: 'startupId is required' })
    }

    const startup = await Startup.findById(startupId).populate('owner', 'name').lean()
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Startup not found' })
    }
    if (startup.owner._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot express interest in your own startup' })
    }

    const interest = await Interest.create({
      investor: req.user._id,
      startup: startup._id,
      message: String(message).slice(0, 500),
    })

    await createNotification({
      recipient: startup.owner._id,
      type: 'interest_received',
      title: 'New investor interest',
      message: `${req.user.name} is interested in ${startup.name}`,
      relatedId: interest._id,
      relatedModel: 'Interest',
    })
    notifyUser(startup.owner._id, {
      build: u => templates.interestReceived(u.name, req.user.name, startup.name),
    }).catch(() => {})

    res.status(201).json({ success: true, message: 'Interest recorded — the founder has been notified', data: interest })
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: 'You already expressed interest in this startup' })
    }
    next(error)
  }
}

/**
 * My expressed interests (investor)
 */
export async function getMyInterests(req, res, next) {
  try {
    const interests = await Interest.find({ investor: req.user._id, status: { $ne: 'withdrawn' } })
      .populate('startup', 'name industry startupStage location fundingRequired isVerified')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: interests })
  } catch (error) {
    next(error)
  }
}

/**
 * Interests received on my startup (entrepreneur)
 */
export async function getReceivedInterests(req, res, next) {
  try {
    const startup = await Startup.findOne({ owner: req.user._id }).select('_id')
    if (!startup) {
      return res.status(404).json({ success: false, message: 'Create a startup profile first' })
    }
    const interests = await Interest.find({ startup: startup._id, status: { $ne: 'withdrawn' } })
      .populate('investor', 'name')
      .sort({ createdAt: -1 })
      .lean()
    res.json({ success: true, data: interests })
  } catch (error) {
    next(error)
  }
}

/**
 * Withdraw my interest (investor)
 */
export async function withdrawInterest(req, res, next) {
  try {
    const interest = await Interest.findOne({ _id: req.params.id, investor: req.user._id })
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Interest not found' })
    }
    interest.status = 'withdrawn'
    await interest.save()
    res.json({ success: true, message: 'Interest withdrawn' })
  } catch (error) {
    next(error)
  }
}
