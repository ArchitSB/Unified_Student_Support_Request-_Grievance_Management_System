import { useCallback, useEffect, useState } from 'react'
import { createAppSocket } from '../lib/socket'

function useRealtimeNotifications({ api, token }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!api) return
    try {
      const response = await api.listNotifications({ limit: 12 })
      setNotifications(response?.data || [])
      setUnreadCount(response?.meta?.unreadCount || 0)
    } catch {
      // Keep layout resilient if notifications fail.
    }
  }, [api])

  useEffect(() => {
    if (!token || !api) return undefined

    let isActive = true

    const nextSocket = createAppSocket(token)

    const bootstrapNotifications = async () => {
      try {
        const response = await api.listNotifications({ limit: 12 })
        if (!isActive) return

        setNotifications(response?.data || [])
        setUnreadCount(response?.meta?.unreadCount || 0)
      } catch {
        // Keep layout resilient if notifications fail.
      }
    }

    const handleNotification = (payload) => {
      setNotifications((prev) => [payload, ...prev].slice(0, 12))
      setUnreadCount((prev) => prev + 1)
    }

    bootstrapNotifications()

    nextSocket.on('notification:new', handleNotification)

    return () => {
      isActive = false
      nextSocket.off('notification:new', handleNotification)
      nextSocket.disconnect()
    }
  }, [api, token])

  const markAsRead = useCallback(async (notificationId) => {
    if (!api) return
    try {
      await api.markNotificationRead(notificationId)
      setNotifications((prev) =>
        prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      // Keep UI optimistic.
    }
  }, [api])

  return {
    notifications,
    unreadCount,
    isNotificationCenterOpen: isOpen,
    setIsNotificationCenterOpen: setIsOpen,
    loadNotifications,
    markAsRead,
  }
}

export default useRealtimeNotifications
