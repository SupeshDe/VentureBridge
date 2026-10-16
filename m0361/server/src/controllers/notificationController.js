import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../services/notificationService.js'

/**
 * Get user's notifications
 */
export async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query

    const result = await getUserNotifications(req.user._id, {
      page: Number(page),
      limit: Number(limit),
      unreadOnly: unreadOnly === 'true'
    })

    res.json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get unread count
 */
export async function getUnreadCount(req, res, next) {
  try {
    const result = await getUserNotifications(req.user._id, { limit: 1 })

    res.json({
      success: true,
      data: { unreadCount: result.unreadCount }
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(req, res, next) {
  try {
    const notification = await markAsRead(req.params.id, req.user._id)

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(req, res, next) {
  try {
    await markAllAsRead(req.user._id)

    res.json({
      success: true,
      message: 'All notifications marked as read'
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationById(req, res, next) {
  try {
    const notification = await deleteNotification(req.params.id, req.user._id)

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    })
  } catch (error) {
    next(error)
  }
}
