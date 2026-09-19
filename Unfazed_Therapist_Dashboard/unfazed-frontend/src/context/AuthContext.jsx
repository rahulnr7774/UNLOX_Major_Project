import { createContext, useContext, useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

const AuthContext = createContext(null)

function readStoredUser() {
  const token = localStorage.getItem('unfazed_token')
  let storedUser

  try {
    storedUser = JSON.parse(localStorage.getItem('unfazed_user') || 'null')
  } catch {
    localStorage.removeItem('unfazed_token')
    localStorage.removeItem('unfazed_user')
    return null
  }

  if (!token || !storedUser) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if ((payload.exp && payload.exp * 1000 <= Date.now()) || payload.role !== storedUser.role) {
      localStorage.removeItem('unfazed_token')
      localStorage.removeItem('unfazed_user')
      return null
    }
  } catch {
    localStorage.removeItem('unfazed_token')
    localStorage.removeItem('unfazed_user')
    return null 
  }

  return storedUser
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const login = (nextUser) => { localStorage.setItem('unfazed_user', JSON.stringify(nextUser)); setUser(nextUser) }
  const updateUser = (nextUser) => { localStorage.setItem('unfazed_user', JSON.stringify(nextUser)); setUser(nextUser) }
  const logout = () => { localStorage.removeItem('unfazed_user'); localStorage.removeItem('unfazed_token'); setUser(null) }

  useEffect(() => {
    if (user?.role !== 'client' || !localStorage.getItem('unfazed_token')) return

    let active = true
    axiosInstance.get('/clients/approval-status')
      .then(({ data }) => {
        if (active && data.client) updateUser({ ...data.client, role: 'client' })
      })
      .catch(() => {})

    return () => { active = false }
  }, [])

  return <AuthContext.Provider value={{ user, login, updateUser, logout, isAuthenticated: Boolean(user) }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)