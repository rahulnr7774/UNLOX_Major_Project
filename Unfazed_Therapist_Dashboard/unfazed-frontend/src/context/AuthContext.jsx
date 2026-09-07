import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function readStoredUser() {
  const token = localStorage.getItem('unfazed_token')
  const storedUser = JSON.parse(localStorage.getItem('unfazed_user') || 'null')

  if (!token || !storedUser) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role !== storedUser.role) {
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
  const logout = () => { localStorage.removeItem('unfazed_user'); localStorage.removeItem('unfazed_token'); setUser(null) }
  return <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)