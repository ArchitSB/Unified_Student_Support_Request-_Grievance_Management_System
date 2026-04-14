import { useCallback, useRef, useState } from 'react'

const DEFAULT_DURATION = 3000

export function useToast() {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef(new Map())

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))

    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const pushToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = DEFAULT_DURATION }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`

      setToasts((prev) => [...prev, { id, type, title, message }])

      const timeoutId = setTimeout(() => {
        removeToast(id)
      }, duration)

      timeoutsRef.current.set(id, timeoutId)
    },
    [removeToast],
  )

  return {
    toasts,
    removeToast,
    pushToast,
  }
}
