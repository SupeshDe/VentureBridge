import Notification from '../models/Notification.js'

/**
 * Create a notification
 */
export async function createNotification({ recipient, type, title, message, relatedId, relatedModel }) {
  try {
    return await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId,
      relatedModel
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * Get user notifications with pagination
 */
export async function getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const query = { recipient: userId }
  if (unreadOnly) query.isRead = false

  const skip = (page - 1) * limit

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ])

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    unreadCount
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, userId) {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  )
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId) {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  )
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId, userId) {
  return await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId
  })
}
