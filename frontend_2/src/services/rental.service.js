import axiosClient from './axiosClient'

const rentalService = {
  // Create new rental
  createRental: async (rentalData) => {
    return await axiosClient.post('/rentals', rentalData)
  },
  
  // Get user's rentals
  getRentals: async (params = {}) => {
    const { data } = await axiosClient.get('/rentals', { params })
  return data
  },
  
  // Get rental by ID
  getRentalById: async (id) => {
    return await axiosClient.get(`/rentals/${id}`)
  },
  
  // Cancel rental
  cancelRental: async (id) => {
    return await axiosClient.put(`/rentals/${id}/cancel`)
  },
  
  // Update rental
  updateRental: async (id, rentalData) => {
    return await axiosClient.put(`/rentals/${id}/extend`, rentalData)
  },
  
  // Get rental history
  getRentalHistory: async (params = {}) => {
    return await axiosClient.get('/rentals/history', { params })
  }
}

export default rentalService