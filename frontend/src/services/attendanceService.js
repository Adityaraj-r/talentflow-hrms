import apiClient from "./apiClient";

const attendanceService = {
  getMyAttendance: async () => {
    return await apiClient.get("/attendance/my");
  },

  clockIn: async (data = {}) => {
    return await apiClient.post("/attendance/clock-in", data);
  },

  clockOut: async () => {
    return await apiClient.post("/attendance/clock-out");
  },

  startBreak: async () => {
    return await apiClient.post("/attendance/start-break");
  },

  endBreak: async () => {
    return await apiClient.post("/attendance/end-break");
  },

  getAllAttendance: async (date = "", userId = "") => {
    const params = {};
    if (date) params.date = date;
    if (userId) params.userId = userId;
    return await apiClient.get("/attendance/all", { params });
  },

  markManualAttendance: async (data) => {
    return await apiClient.post("/attendance/manual", data);
  },

  markBulkAttendance: async (data) => {
    return await apiClient.post("/attendance/bulk", data);
  },

  approveAttendance: async (id) => {
    return await apiClient.patch(`/attendance/${id}/approve`);
  },

  checkLockStatus: async (startDate, endDate) => {
    return await apiClient.get("/attendance/lock-status", {
      params: { startDate, endDate },
    });
  },

  lockAttendance: async (startDate, endDate) => {
    return await apiClient.post("/attendance/lock", { startDate, endDate });
  },

  unlockAttendance: async (startDate, endDate) => {
    return await apiClient.post("/attendance/unlock", { startDate, endDate });
  },

  correctAttendance: async (id, data) => {
    return await apiClient.patch(`/attendance/${id}/correct`, data);
  },

  submitCorrectionRequest: async (data) => {
    return await apiClient.post("/attendance/correction-requests", data);
  },

  getCorrectionRequests: async (status = "") => {
    const params = {};
    if (status) params.status = status;
    return await apiClient.get("/attendance/correction-requests", { params });
  },

  reviewCorrectionRequest: async (id, action, rejectionReason = "") => {
    return await apiClient.patch(
      `/attendance/correction-requests/${id}/review`,
      { action, rejectionReason }
    );
  },

  getMyCorrectionRequests: async () => {
    return await apiClient.get("/attendance/my-correction-requests");
  },

  getOvertimePending: async (startDate = "", endDate = "") => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return await apiClient.get("/attendance/overtime-pending", { params });
  },

  approveOvertime: async (id) => {
    return await apiClient.patch(`/attendance/${id}/approve-ot`);
  },
};

export default attendanceService;