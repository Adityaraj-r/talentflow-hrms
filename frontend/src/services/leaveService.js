import apiClient from "./apiClient";

const leaveService = {
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

  updateLeaveStatus: async (id, status, adminComment = "") => {
    return await apiClient.patch(`/leaves/${id}/status`, { status, adminComment });
  }
};

export default leaveService;