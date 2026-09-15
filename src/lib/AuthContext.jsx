import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearTokens, extractErrorMessage, getTokens, setTokens } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const { data } = await api.get('/accounts/me/')
    setUser(data)
    return data
  }, [])

  useEffect(() => {
    const { access } = getTokens()
    if (!access) {
      setIsLoading(false)
      return
    }
    fetchMe()
      .catch(() => {
        clearTokens()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [fetchMe])

  const login = useCallback(
    async (username, password) => {
      const { data } = await api.post('/auth/token/', { username, password })
      setTokens(data)
      await fetchMe()
    },
    [fetchMe],
  )

  const register = useCallback(async (payload) => {
    await api.post('/accounts/register/', payload)
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const value = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refreshMe: fetchMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { extractErrorMessage }
