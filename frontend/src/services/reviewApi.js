import api from './apiClient';

export const reviewApi = {

  assignReview: (data) => api.post('/performance/reviews/assign', data),

  getAllReviews: (params) => api.get('/performance/reviews/all', { params }),
  getPendingReviews: () => api.get('/performance/reviews/pending'),
  getEmployeeReviews: (employeeId) => api.get(`/performance/reviews/employee/${employeeId}`),

  submitReview: (reviewId, data) => api.put(`/performance/reviews/${reviewId}/submit`, data),

  getAnalyticsSummary: () => api.get('/performance/analytics/summary'),

};

export default reviewApi;
