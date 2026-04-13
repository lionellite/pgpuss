import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authAPI.me()
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const { data: me } = await authAPI.me()
    setUser(me)
    return me
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const isAgent = user && [
    'AGENT_RECEPTION', 'GESTIONNAIRE_SERVICE', 'MEDIATEUR',
    'DIRECTEUR', 'RESPONSABLE_QUALITE', 'ADMIN_NATIONAL', 'AUDITEUR'
  ].includes(user.role)

  const isAdmin = user?.role === 'ADMIN_NATIONAL'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAgent, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
