import apiClient from "./apiClient";

export const reviewApi = {
  assignReview: (data) =>
    apiClient.post("/performance/reviews/assign", data),

  getAllReviews: (params) =>
    apiClient.get("/performance/reviews/all", { params }),

  getPendingReviews: () =>
    apiClient.get("/performance/reviews/pending"),

  getEmployeeReviews: (employeeId) =>
    apiClient.get(`/performance/reviews/employee/${employeeId}`),

  getReviewById: (reviewId) =>
    apiClient.get(`/performance/reviews/${reviewId}`),

  getGoalsForReview: (reviewId) =>
    apiClient.get(`/performance/reviews/${reviewId}/goals`),

  submitReview: (reviewId, data) =>
    apiClient.put(`/performance/reviews/${reviewId}/submit`, data),

  approveReview: (reviewId, data) =>
    apiClient.put(`/performance/reviews/${reviewId}/approve`, data),

  hrReview: (id, data) =>
    apiClient.patch(`/performance/hr-review/${id}`, data),

  finalizeReview: (id) =>
    apiClient.patch(`/performance/finalize/${id}`),

  confirmGoals: (reviewId) =>
    apiClient.post(`/performance/reviews/${reviewId}/confirm-goals`),

  ceoReview: (id, data) =>
    apiClient.patch(`/performance/ceo-review/${id}`, data),

  calibrate: (id, data) =>
    apiClient.patch(`/performance/calibrate/${id}`, data),

  releaseFeedback: (id) =>
    apiClient.patch(`/performance/release-feedback/${id}`),
};

export default reviewApi;
