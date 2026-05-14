import { Notification } from '../models/Notification.js'
import { emitToUser } from './realtime.service.js'

export const createNotification = async ({ userId, requestId = null, type, title, message, metadata = {} }) => {
  if (!userId) return null

  const notification = await Notification.create({
    userId,
    requestId,
    type,
    title,
    message,
    metadata,
  })

  const populatedNotification = await Notification.findById(notification._id).lean()
  emitToUser(userId, 'notification:new', populatedNotification)

  return populatedNotification
}

export const createNotifications = async (notifications = []) => {
  const filteredNotifications = notifications.filter((item) => item?.userId)
  if (filteredNotifications.length === 0) return []

  const created = await Notification.insertMany(filteredNotifications)
  created.forEach((notification) => {
    emitToUser(notification.userId, 'notification:new', notification.toObject())
  })

  return created
}

export const listNotificationsForUser = async (userId, { limit = 12 } = {}) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
  ])

  return {
    items,
    unreadCount,
  }
}

export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  ).lean()

  return notification
}
