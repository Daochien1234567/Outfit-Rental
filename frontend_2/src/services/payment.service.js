import axiosClient from './axiosClient'

const paymentService = {
  // Create payment
  createPayment: async (paymentData) => {
    return await axiosClient.post('/payments', paymentData)
  },
  
  // Get payments
  getPayments: async (params = {}) => {
    return await axiosClient.get('/payments', { params })
  },
  
  // Process deposit payment
  processDeposit: async (rentalId, paymentData) => {
    return await axiosClient.post(`/payments/${rentalId}/deposit`, paymentData)
  },
  
  // Process refund
  processRefund: async (rentalId, refundData) => {
    return await axiosClient.post(`/payments/${rentalId}/refund`, refundData)
  },
  
  // Get payment methods
  getPaymentMethods: async () => {
    return await axiosClient.get('/payments/methods')
  },
  
  // Verify payment
  verifyPayment: async (paymentId) => {
    return await axiosClient.get(`/payments/${paymentId}/verify`)
  }
}

export default paymentService