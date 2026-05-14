/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  authApi,
  clearAuthSession,
  getAuthToken,
  getRefreshToken,
  getStoredUser,
  persistAuthSession,
} from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getAuthToken())
  const [user, setUser] = useState(getStoredUser)
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getAuthToken() || getRefreshToken()))

  const login = ({ accessToken, refreshToken, token: fallbackToken, user: nextUser }) => {
    persistAuthSession({
      accessToken: accessToken || fallbackToken,
      refreshToken,
      user: nextUser,
    })
    setToken(accessToken || fallbackToken || null)
    setUser(nextUser)
    setIsAuthLoading(false)
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()

    if (refreshToken) {
      try {
        await authApi.logout({ refreshToken })
      } catch {
        // Local cleanup remains authoritative for the client.
      }
    }

    clearAuthSession()
    setToken(null)
    setUser(null)
    setIsAuthLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    const syncProfile = async () => {
      if (!token && !getRefreshToken()) {
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

        persistAuthSession({
          accessToken: getAuthToken(),
          refreshToken: getRefreshToken(),
          user: nextUser,
        })
        setToken(getAuthToken())
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
      isAuthenticated: Boolean(token && user),
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
