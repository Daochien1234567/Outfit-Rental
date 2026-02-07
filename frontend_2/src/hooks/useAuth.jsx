// @refresh reset
import { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/auth.service'

const AuthContext = createContext(null)

// ================= HOOK =================
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// ================= PROVIDER =================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // -------- Init auth from localStorage --------
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

  // ================= LOGIN =================
  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials)

      if (!res?.token || !res?.user) {
        throw new Error('Invalid login response')
      }

      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  // ================= REGISTER → AUTO LOGIN =================
  const register = async (userData) => {
    try {
      // 1. Đăng ký (backend chỉ tạo user)
      await authService.register(userData)

      // 2. Tự động đăng nhập
      const res = await authService.login({
        email: userData.email,
        password: userData.password
      })

      if (!res?.token || !res?.user) {
        throw new Error('Auto login failed')
      }

      // 3. Lưu auth
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      setUser(res.user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  // ================= UPDATE USER =================
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
