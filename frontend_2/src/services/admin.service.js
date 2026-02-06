import axiosClient from './axiosClient'

const adminService = {
  //QUẢN LÝ TRANG PHỤC 
  getAllCostumes: async (params = {}) => {
    const response = await axiosClient.get('/admin/costumes', { params })
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages
    }
  },
  
  getCostumeDetail: async (id) => {
    return await axiosClient.get(`/admin/costumes/${id}`)
  },
  
  createCostume: async (costumeData) => {
    return await axiosClient.post('/admin/costumes', costumeData)
  },
  
  updateCostume: async (id, costumeData) => {
    return await axiosClient.put(`/admin/costumes/${id}`, costumeData)
  },
  
  deleteCostume: async (id) => {
    return await axiosClient.delete(`/admin/costumes/${id}`)
  },
  
  //  QUẢN LÝ ĐƠN THUÊ 
  getAllRentals: async (params = {}) => {
    const response = await axiosClient.get('/admin/rentals', { params })
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages
    }
  },
  
  getRentalDetail: async (id) => {
    return await axiosClient.get(`/admin/rentals/${id}`)
  },
  
  confirmRentalDelivery: async (id) => {
    return await axiosClient.put(`/admin/rentals/${id}/confirm`)
  },
  
  confirmDelivery: async (id) => {
    return await axiosClient.put(`/admin/rentals/${id}/renting`)
  },
  
  completeReturn: async (id) => {
    return await axiosClient.put(`/admin/rentals/${id}/overdue`)
  },
  
  completeRental: async (id) => {
    return await axiosClient.put(`/admin/rentals/${id}/completed`)
  },
  
  processReturn: async (id, data) => {
    return await axiosClient.put(`/admin/rentals/${id}/checkout`, data)
  },
  
  applyPenalty: async (id, penaltyData) => {
    return await axiosClient.post(`/admin/rentals/${id}/penalty`, penaltyData)
  },
  
  // QUẢN LÝ PHẠT & CỌC 
  getPenaltyConfig: async () => {
    return await axiosClient.get('/admin/penalties/config')
  },
  
  updatePenaltyConfig: async (id, configData) => {
    return await axiosClient.put(`/admin/penalties/config/${id}`, configData)
  },
  
  getDepositHistory: async (params = {}) => {
    const response = await axiosClient.get('/admin/deposits', { params })
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages
    }
  },
  
  processDepositRefund: async (data) => {
    return await axiosClient.post('/admin/deposits/refund', data)
  },
  
  //BÁO CÁO 
  getOverviewReport: async (params = {}) => {
    return await axiosClient.get('/admin/reports/overview', { params })
  },
  
  getRevenueReport: async (params = {}) => {
    return await axiosClient.get('/admin/reports/revenue', { params })
  },
  
  getTopCostumes: async (params = {}) => {
    return await axiosClient.get('/admin/reports/top-costumes', { params })
  },
  
  getTopCustomers: async (params = {}) => {
    return await axiosClient.get('/admin/reports/customers', { params })
  },
  
  // QUẢN LÝ NGƯỜI DÙNG 
  getAllUsers: async (params = {}) => {
    const response = await axiosClient.get('/admin/users', { params })
    return {
      data: response.data,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages
    }
  },
  
  updateUserStatus: async (id, status) => {
  return await axiosClient.put(`/admin/users/${id}/status`, {
    status // active | inactive | banned
  })
}

}

export default adminService