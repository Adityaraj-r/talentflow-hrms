import apiClient from "./apiClient";

const leaveService = {
  getAllPolicies: async () => {
    return await apiClient.get("/leaves/policies");
  },

  createPolicy: async (data) => {
    return await apiClient.post("/leaves/policies", data);
  },

  updatePolicy: async (id, data) => {
    return await apiClient.put(`/leaves/policies/${id}`, data);
  },

  deletePolicy: async (id) => {
    return await apiClient.delete(`/leaves/policies/${id}`);
  },

  
  getMyLeaveBalance: async () => {
    return await apiClient.get("/leaves/balance/my");
  },

  getAllLeaveBalances: async (year = "") => {
    const params = {};
    if (year) params.year = year;
    return await apiClient.get("/leaves/balance/all", { params });
  },

  initializeBalances: async (year = "") => {
    const params = {};
    if (year) params.year = year;
    return await apiClient.post("/leaves/balance/initialize", {}, { params });
  },

  // ── Leave Requests ────────────────────────────────────────────────────────
  applyLeave: async (leaveData) => {
    return await apiClient.post("/leaves/apply", leaveData);
  },

  getMyLeaves: async () => {
    return await apiClient.get("/leaves/my");
  },

  getAllLeaves: async (status = "") => {
    const params = status ? { status } : {};
    return await apiClient.get("/leaves/all", { params });
  },

  updateLeaveStatus: async (id, status, rejectionReason = "") => {
    return await apiClient.patch(`/leaves/${id}/status`, {
      status,
      rejectionReason,
    });
  },

  cancelLeave: async (id) => {
    return await apiClient.patch(`/leaves/${id}/cancel`);
  },
};

export default leaveService;