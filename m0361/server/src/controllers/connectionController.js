import Connection from '../models/Connection.js'

/**
 * Get all connections for current user
 */
export async function getConnections(req, res, next) {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query

    const query = {
      $or: [
        { entrepreneur: req.user._id },
        { investor: req.user._id }
      ],
      status
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [connections, total] = await Promise.all([
      Connection.find(query)
        .populate('entrepreneur', 'name profileImage location')
        .populate('investor', 'name profileImage location')
        .populate('startup', 'name industry startupStage')
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Connection.countDocuments(query)
    ])

    res.json({
      success: true,
      data: connections,
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
 * Get single connection by ID
 */
export async function getConnection(req, res, next) {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate('entrepreneur', 'name email profileImage location')
      .populate('investor', 'name email profileImage location')
      .populate('startup', 'name description industry startupStage fundingRequired')
      .populate('request')

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' })
    }

    // Check if user is part of this connection
    const isParticipant = 
      connection.entrepreneur._id.toString() === req.user._id.toString() ||
      connection.investor._id.toString() === req.user._id.toString()

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this connection' })
    }

    res.json({ success: true, data: connection })
  } catch (error) {
    next(error)
  }
}

/**
 * Update connection activity timestamp
 */
export async function updateConnectionActivity(req, res, next) {
  try {
    const connection = await Connection.findById(req.params.id)

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' })
    }

    // Check if user is part of this connection
    const isParticipant = 
      connection.entrepreneur.toString() === req.user._id.toString() ||
      connection.investor.toString() === req.user._id.toString()

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this connection' })
    }

    connection.lastActivity = new Date()
    await connection.save()

    res.json({ success: true, data: connection })
  } catch (error) {
    next(error)
  }
}

/**
 * Archive connection
 */
export async function archiveConnection(req, res, next) {
  try {
    const connection = await Connection.findById(req.params.id)

    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection not found' })
    }

    // Check if user is part of this connection
    const isParticipant = 
      connection.entrepreneur.toString() === req.user._id.toString() ||
      connection.investor.toString() === req.user._id.toString()

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'You do not have access to this connection' })
    }

    connection.status = 'archived'
    await connection.save()

    res.json({
      success: true,
      message: 'Connection archived',
      data: connection
    })
  } catch (error) {
    next(error)
  }
}
