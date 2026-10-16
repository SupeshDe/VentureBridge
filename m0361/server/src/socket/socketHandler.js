import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Conversation from '../models/Conversation.js'
import Message from '../models/Message.js'
import Connection from '../models/Connection.js'
import { createNotification } from '../services/notificationService.js'

const userSockets = new Map() // userId -> socketId
let socketServer = null

export function emitConversationMessage(conversationId, message) {
  socketServer?.to(`conversation:${conversationId}`).emit('message:new', message)
}

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  })
  socketServer = io

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.cookie?.split('token=')[1]?.split(';')[0]

      if (!token) {
        return next(new Error('Authentication required'))
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)

      if (!user || !user.isActive) {
        return next(new Error('Invalid or inactive user'))
      }

      socket.userId = user._id.toString()
      socket.user = user
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', socket => {
    console.log(`User connected: ${socket.userId}`)

    // Store socket connection
    userSockets.set(socket.userId, socket.id)

    // Emit online status
    socket.broadcast.emit('user:online', { userId: socket.userId })

    // Join user's personal room
    socket.join(`user:${socket.userId}`)

    // Join conversation
    socket.on('conversation:join', async conversationId => {
      try {
        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' })
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(p => p.toString() === socket.userId)

        if (!isParticipant) {
          return socket.emit('error', { message: 'Access denied' })
        }

        socket.join(`conversation:${conversationId}`)
        socket.currentConversation = conversationId
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' })
      }
    })

    // Leave conversation
    socket.on('conversation:leave', conversationId => {
      socket.leave(`conversation:${conversationId}`)
      if (socket.currentConversation === conversationId) {
        socket.currentConversation = null
      }
    })

    // Typing indicator
    socket.on('typing:start', conversationId => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
        userName: socket.user.name,
      })
    })

    socket.on('typing:stop', conversationId => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      })
    })

    // Send message
    socket.on('message:send', async (data, acknowledge) => {
      try {
        const { conversationId, message, attachment, attachmentType } = data

        const conversation = await Conversation.findById(conversationId)

        if (!conversation) {
          const result = { success: false, message: 'Conversation not found' }
          acknowledge?.(result)
          return socket.emit('error', result)
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(p => p.toString() === socket.userId)

        if (!isParticipant) {
          const result = { success: false, message: 'Access denied' }
          acknowledge?.(result)
          return socket.emit('error', result)
        }

        // Find receiver
        const receiver = conversation.participants.find(p => p.toString() !== socket.userId)

        // Create message
        const newMessage = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
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

        // Populate message
        const populatedMessage = await Message.findById(newMessage._id).populate(
          'sender',
          'name profileImage'
        )

        // Emit to conversation room
        emitConversationMessage(conversationId, populatedMessage)
        acknowledge?.({ success: true, data: populatedMessage })

        // Notify receiver if they're not in the conversation
        const receiverSocketId = userSockets.get(receiver.toString())
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', {
            type: 'new_message',
            conversationId,
            message: populatedMessage,
          })
        }

        // Create in-app notification
        await createNotification({
          recipient: receiver,
          type: 'new_message',
          title: 'New message',
          message: `${socket.user.name} sent you a message`,
          relatedId: conversationId,
          relatedModel: 'Conversation',
        })
      } catch (error) {
        console.error('Message send error:', error)
        const result = { success: false, message: 'Failed to send message' }
        acknowledge?.(result)
        socket.emit('error', result)
      }
    })

    // Mark messages as read
    socket.on('messages:read', async conversationId => {
      try {
        await Message.updateMany(
          { conversation: conversationId, receiver: socket.userId, isRead: false },
          { isRead: true }
        )

        const conversation = await Conversation.findById(conversationId)
        if (conversation) {
          conversation.unreadCount.set(socket.userId, 0)
          await conversation.save()
        }

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          userId: socket.userId,
        })
      } catch (error) {
        console.error('Mark read error:', error)
      }
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
      userSockets.delete(socket.userId)

      // Emit offline status
      socket.broadcast.emit('user:offline', { userId: socket.userId })
    })
  })

  return io
}
