import apiClient from "./apiClient";

const leaveService = {
  // Employee: Apply for leave
  applyLeave: async (leaveData) => {
    return await apiClient.post("/leaves/apply", leaveData);
  },

  // Employee: Get my leave history
  getMyLeaves: async () => {
    return await apiClient.get("/leaves/my");
  },

  // Admin: Get all leaves (with optional status filter)
  getAllLeaves: async (status = "") => {
    const params = status ? { status } : {};
    return await apiClient.get("/leaves/all", { params });
  },

  // Admin: Approve/Reject leave
  updateLeaveStatus: async (id, status, adminComment = "") => {
    return await apiClient.patch(`/leaves/${id}/status`, { status, adminComment });
  }
};

export default leaveService;