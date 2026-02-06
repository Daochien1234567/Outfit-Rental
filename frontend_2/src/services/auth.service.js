import axiosClient from './axiosClient'

const authService = {
  login: async (credentials) => {
    const response = await axiosClient.post('/auth/login', credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData)
    return response.data
  },

  getProfile: async () => {
    const response = await axiosClient.get('/auth/profile')
    return response.data
  },

  updateProfile: async (userData) => {
    const response = await axiosClient.put('/auth/profile', userData)
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await axiosClient.put('/auth/change-password', passwordData)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authService
