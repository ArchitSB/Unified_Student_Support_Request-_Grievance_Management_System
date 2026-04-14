/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

const readStoredUser = () => {
  const rawUser = localStorage.getItem('auth_user')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState(readStoredUser)
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(localStorage.getItem('auth_token')))

  const login = ({ token: nextToken, user: nextUser }) => {
    localStorage.setItem('auth_token', nextToken)
    localStorage.setItem('auth_user', JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
    setIsAuthLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    const syncProfile = async () => {
      if (!token) {
        if (isMounted) {
          setIsAuthLoading(false)
        }
        return
      }

      try {
        const response = await authApi.getMe()
        if (!isMounted) return

        const nextUser = response?.data?.user || null
        if (!nextUser) {
          logout()
          return
        }

        localStorage.setItem('auth_user', JSON.stringify(nextUser))
        setUser(nextUser)
      } catch {
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    syncProfile()

    return () => {
      isMounted = false
    }
  }, [token])

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isAuthLoading,
      login,
      logout,
    }),
    [token, user, isAuthLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
