import apiClient from "@/services/apiClient";

const offerOperationsService = {
  getDashboard: () => apiClient.get("/offers/dashboard"),
  getAnalytics: () => apiClient.get("/offers/analytics"),
  getApprovals: () => apiClient.get("/offers/approvals"),
  createOffer: (payload) => apiClient.post("/offers", payload),
  approveOffer: (id, payload = {}) => apiClient.patch(`/offers/${id}/approve`, payload),
  rejectOffer: (id, payload = {}) => apiClient.patch(`/offers/${id}/reject`, payload),
  negotiateOffer: (id, payload = {}) => apiClient.patch(`/offers/${id}/negotiate`, payload),
  sendOffer: (id, payload = {}) => apiClient.patch(`/offers/${id}/send`, payload),
};

export default offerOperationsService;
