import apiClient from "./apiClient";

const attendanceService = {
  // Get my attendance history
  getMyAttendance: async () => {
    return await apiClient.get("/attendance/my");
  },

  // Clock in
  clockIn: async () => {
    return await apiClient.post("/attendance/clock-in");
  },

  // Clock out
  clockOut: async () => {
    return await apiClient.post("/attendance/clock-out");
  },

  // Admin/HR: Get all records (with optional filters)
  getAllAttendance: async (date = "", userId = "") => {
    // Build query string
    const params = {};
    if (date) params.date = date;
    if (userId) params.userId = userId;
    
    return await apiClient.get("/attendance/all", { params });
  }
};

export default attendanceService;
