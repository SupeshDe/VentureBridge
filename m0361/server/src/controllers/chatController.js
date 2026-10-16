import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import Connection from '../models/Connection.js'
import { emitConversationMessage } from '../socket/socketHandler.js'

/**
 * Get user's conversations
 */
export async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'name profileImage')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .lean()

    res.json({ success: true, data: conversations })
  } catch (error) {
    next(error)
  }
}

/**
 * Get single conversation with messages
 */
export async function getConversation(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query
    const conversationId = req.params.id

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name profileImage')
      .populate('connection')

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p._id.toString() === req.user._id.toString()
    )

    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: 'You do not have access to this conversation' })
    }

    // Get messages with pagination
    const skip = (Number(page) - 1) * Number(limit)

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'name profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Message.countDocuments({ conversation: conversationId }),
    ])

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    )

    // Update unread count
    if (conversation.unreadCount) {
      conversation.unreadCount.set(req.user._id.toString(), 0)
      await conversation.save()
    }

    res.json({
      success: true,
      data: {
        conversation,
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Send message (will be primarily handled by Socket.IO)
 */
export async function sendMessage(req, res, next) {
  try {
    const { conversationId, message, attachment, attachmentType } = req.body

    if (!conversationId || (!message && !attachment)) {
      return res
        .status(400)
        .json({ success: false, message: 'Conversation ID and message/attachment are required' })
    }

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user._id.toString()
    )

    if (!isParticipant) {
      return res
        .status(403)
        .json({ success: false, message: 'You do not have access to this conversation' })
    }

    // Find receiver
    const receiver = conversation.participants.find(p => p.toString() !== req.user._id.toString())

    // Create message
    const newMessage = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      receiver,
      message,
      attachment,
      attachmentType,
    })

    // Update conversation
    conversation.lastMessage = newMessage._id
    conversation.lastMessageAt = new Date()

    // Increment unread count for receiver
    const receiverUnread = conversation.unreadCount.get(receiver.toString()) || 0
    conversation.unreadCount.set(receiver.toString(), receiverUnread + 1)

    await conversation.save()

    // Update connection activity
    await Connection.findByIdAndUpdate(conversation.connection, {
      lastActivity: new Date(),
    })

    const populatedMessage = await Message.findById(newMessage._id).populate(
      'sender',
      'name profileImage'
    )

    emitConversationMessage(conversationId, populatedMessage)

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: populatedMessage,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Mark messages as read
 */
export async function markAsRead(req, res, next) {
  try {
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' })
    }

    // Mark messages as read
    await Message.updateMany(
      { conversation: conversationId, receiver: req.user._id, isRead: false },
      { isRead: true }
    )

    // Reset unread count
    conversation.unreadCount.set(req.user._id.toString(), 0)
    await conversation.save()

    res.json({ success: true, message: 'Messages marked as read' })
  } catch (error) {
    next(error)
  }
}
