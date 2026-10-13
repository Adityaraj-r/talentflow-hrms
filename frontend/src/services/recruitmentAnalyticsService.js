import apiClient from "@/services/apiClient";

const cleanParams = (filters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== "" && value !== "All")
  );

const recruitmentAnalyticsService = {
  getOverview: (filters) => apiClient.get("/recruitment/analytics/overview", { params: cleanParams(filters) }),
  getFunnel: (filters) => apiClient.get("/recruitment/analytics/funnel", { params: cleanParams(filters) }),
  getRecruiters: (filters) => apiClient.get("/recruitment/analytics/recruiters", { params: cleanParams(filters) }),
  getSources: (filters) => apiClient.get("/recruitment/analytics/sources", { params: cleanParams(filters) }),
  getVelocity: (filters) => apiClient.get("/recruitment/analytics/velocity", { params: cleanParams(filters) }),
  getInsights: (filters) => apiClient.get("/recruitment/analytics/insights", { params: cleanParams(filters) }),
};

export default recruitmentAnalyticsService;
