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

  // ADDED: getReviewById — fetches a single review by ID
  // Previously ReviewDetailPage was fetching ALL reviews and filtering — O(n) disaster
  getReviewById: (reviewId) =>
    apiClient.get(`/performance/reviews/${reviewId}`),

  submitReview: (reviewId, data) =>
    apiClient.put(`/performance/reviews/${reviewId}/submit`, data),

  approveReview: (reviewId, data) =>
    apiClient.put(`/performance/reviews/${reviewId}/approve`, data),

  // REMOVED: getAnalyticsSummary — route does not exist in backend (would 404)
};

export default reviewApi;
