import CollaborationRequest from '../models/CollaborationRequest.js'
import Connection from '../models/Connection.js'
import Conversation from '../models/Conversation.js'
import Startup from '../models/Startup.js'
import { createNotification } from '../services/notificationService.js'
import { notifyUser, templates } from '../services/emailService.js'
import { isDuplicateKeyError } from '../utils/mongoErrors.js'

/**
 * Get the number of pending requests received by the current user.
 */
export async function getPendingRequestCount(req, res, next) {
  try {
    const pendingCount = await CollaborationRequest.countDocuments({
      receiver: req.user._id,
      status: 'pending',
    })

    res.json({ success: true, data: { pendingCount } })
  } catch (error) {
    next(error)
  }
}

/**
 * Send collaboration request
 */
export async function sendRequest(req, res, next) {
  try {
    const { receiver, startup, message } = req.body

    if (!receiver || !startup) {
      return res.status(400).json({ success: false, message: 'Receiver and startup are required' })
    }

    // Prevent self-requests
    if (receiver === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a request to yourself' })
    }

    const request = await CollaborationRequest.create({
      sender: req.user._id,
      receiver,
      senderRole: req.user.role,
      receiverRole: req.user.role === 'entrepreneur' ? 'investor' : 'entrepreneur',
      startup,
      message
    })

    // Create notification
    await createNotification({
      recipient: receiver,
      type: 'collaboration_request',
      title: 'New collaboration request',
      message: `${req.user.name} sent you a collaboration request`,
      relatedId: request._id,
      relatedModel: 'CollaborationRequest'
    })

    // Alert email to the receiver (fire-and-forget)
    Startup.findById(startup).select('name').lean()
      .then(s => notifyUser(receiver, { build: u => templates.requestReceived(u.name, req.user.name, s?.name || '') }))
      .catch(() => {})

    res.status(201).json({
      success: true,
      message: 'Collaboration request sent successfully',
      data: request
    })
  } catch (error) {
    if (error.statusCode === 409 || isDuplicateKeyError(error)) {
      return res.status(409).json({
        success: false,
        message: 'An active request already exists for this connection',
      })
    }
    next(error)
  }
}

/**
 * Get sent requests
 */
export async function getSentRequests(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { sender: req.user._id }
    if (status) query.status = status

    const skip = (Number(page) - 1) * Number(limit)

    const [requests, total] = await Promise.all([
      CollaborationRequest.find(query)
        .populate('receiver', 'name profileImage location')
        .populate('startup', 'name industry startupStage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CollaborationRequest.countDocuments(query)
    ])

    res.json({
      success: true,
      data: requests,
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
 * Get received requests
 */
export async function getReceivedRequests(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { receiver: req.user._id }
    if (status) query.status = status

    const skip = (Number(page) - 1) * Number(limit)

    const [requests, total] = await Promise.all([
      CollaborationRequest.find(query)
        .populate('sender', 'name profileImage location')
        .populate('startup', 'name industry startupStage fundingRequired')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CollaborationRequest.countDocuments(query)
    ])

    res.json({
      success: true,
      data: requests,
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
 * Accept collaboration request
 */
export async function acceptRequest(req, res, next) {
  try {
    const request = await CollaborationRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to accept this request' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` })
    }

    // Update request status
    request.status = 'accepted'
    await request.save()

    // Create connection
    const connectionData = {
      entrepreneur: request.senderRole === 'entrepreneur' ? request.sender : request.receiver,
      investor: request.senderRole === 'investor' ? request.sender : request.receiver,
      startup: request.startup,
      request: request._id
    }

    const connection = await Connection.create(connectionData)

    // Create conversation
    await Conversation.create({
      connection: connection._id,
      participants: [request.sender, request.receiver]
    })

    // Notify sender
    await createNotification({
      recipient: request.sender,
      type: 'request_accepted',
      title: 'Request accepted!',
      message: 'Your collaboration request has been accepted',
      relatedId: connection._id,
      relatedModel: 'Connection'
    })

    // Alert email to the sender (fire-and-forget)
    notifyUser(request.sender, { build: u => templates.requestAccepted(u.name, req.user.name) }).catch(() => {})

    res.json({
      success: true,
      message: 'Request accepted and connection created',
      data: { request, connection }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Reject collaboration request
 */
export async function rejectRequest(req, res, next) {
  try {
    const request = await CollaborationRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }

    if (request.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to reject this request' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` })
    }

    request.status = 'rejected'
    await request.save()

    // Notify sender
    await createNotification({
      recipient: request.sender,
      type: 'request_rejected',
      title: 'Request declined',
      message: 'Your collaboration request was declined',
      relatedId: request._id,
      relatedModel: 'CollaborationRequest'
    })

    // Alert email to the sender (fire-and-forget)
    notifyUser(request.sender, { build: u => templates.requestDeclined(u.name) }).catch(() => {})

    res.json({
      success: true,
      message: 'Request rejected',
      data: request
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel sent request
 */
export async function cancelRequest(req, res, next) {
  try {
    const request = await CollaborationRequest.findById(req.params.id)

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }

    if (request.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to cancel this request' })
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${request.status} request` })
    }

    request.status = 'cancelled'
    await request.save()

    res.json({
      success: true,
      message: 'Request cancelled',
      data: request
    })
  } catch (error) {
    next(error)
  }
}
