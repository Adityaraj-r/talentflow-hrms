import apiClient from "./apiClient";

const attendanceService = {
  getMyAttendance: async () => {
    return await apiClient.get("/attendance/my");
  },

  clockIn: async () => {
    return await apiClient.post("/attendance/clock-in");
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

  // YAHAN CHANGE KIYA GAYA HAI: multipart/form-data header add kiya gaya hai
  markBulkAttendance: async (data) => {
    return await apiClient.post("/attendance/bulk", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
};

export default attendanceService;