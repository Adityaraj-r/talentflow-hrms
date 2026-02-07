import apiClient from "./apiClient";


const shiftService = {
  // ... existing functions ...
  getAllShifts: async () => {
    return await apiClient.get("/shifts/all");
  },
  createShift: async (shiftData) => {
    return await apiClient.post("/shifts/add", shiftData);
  },
  deleteShift: async (id) => {
    return await apiClient.delete(`/shifts/${id}`);
  },

  // ✅ ADD THIS NEW FUNCTION
  assignShift: async (shiftId, employeeIds) => {
    return await apiClient.put("/shifts/assign", { shiftId, employeeIds });
  }
};

export default shiftService;