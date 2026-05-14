import { useMemo } from 'react'
import { Button } from '../ui'

const formatDate = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  isOpen = false,
  onToggle,
  onMarkRead,
  onSelectNotification,
}) {
  const grouped = useMemo(() => {
    return notifications.reduce((acc, item) => {
      const dateKey = new Date(item.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })
      acc[dateKey] = acc[dateKey] || []
      acc[dateKey].push(item)
      return acc
    }, {})
  }, [notifications])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Open notifications"
      >
        🔔
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-[75] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Notification Center</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread notifications</p>
              </div>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
            ) : (
              Object.entries(grouped).map(([label, items]) => (
                <div key={label}>
                  <div className="sticky top-0 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {label}
                  </div>
                  {items.map((item) => (
                    <button
                      type="button"
                      key={item._id}
                      onClick={() => onSelectNotification(item)}
                      className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                        item.isRead ? '' : 'bg-sky-50/60 dark:bg-sky-900/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.message}</p>
                          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{formatDate(item.createdAt)}</p>
                        </div>
                        {!item.isRead ? (
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-[11px]"
                            onClick={(event) => {
                              event.stopPropagation()
                              onMarkRead(item._id)
                            }}
                          >
                            Read
                          </Button>
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default NotificationCenter
