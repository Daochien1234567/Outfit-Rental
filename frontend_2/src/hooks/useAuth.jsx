// @refresh reset
import { useState, useEffect, createContext, useContext } from 'react'
import authService from '../services/auth.service'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser && storedUser !== 'undefined') {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    }

    setLoading(false)
  }, [])

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials)

      if (!data?.token || !data?.user) {
        throw new Error('Invalid login response')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const register = async (userData) => {
    try {
      const data = await authService.register(userData)

      if (!data?.token || !data?.user) {
        throw new Error('Invalid register response')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (userData) => {
    if (!user) return
    const updatedUser = { ...user, ...userData }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateUser
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}
