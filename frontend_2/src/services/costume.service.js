import axiosClient from './axiosClient'

const costumeService = {
  getAllCostumes: (params = {}) => {
    return axiosClient.get('/costumes', { params })
  },

  // GET /costumes/search
  searchCostumes: (keyword, params = {}) => {
    return axiosClient.get('/costumes/search', {
      params: { q: keyword, ...params }
    })
  },

  // GET /costumes/:id
  getCostumeById: (id) => {
    return axiosClient.get(`/costumes/${id}`)
  },

  // GET /costumes/:id/related
  getRelatedCostumes: (id) => {
    return axiosClient.get(`/costumes/${id}/related`)
  },

  // GET /costumes/:id/reviews
  getReviews: (id, params = {}) => {
    return axiosClient.get(`/costumes/${id}/reviews`, { params })
  },

  // POST /costumes/:id/reviews (login required)
  createReview: (id, reviewData) => {
    return axiosClient.post(`/costumes/${id}/reviews`, reviewData)
  }
}

export default costumeService