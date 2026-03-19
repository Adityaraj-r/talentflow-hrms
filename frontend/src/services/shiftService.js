import apiClient from "./apiClient";

const shiftService = {
  getAllShifts: async () => {
    return await apiClient.get("/shifts/all");
  },
  createShift: async (shiftData) => {
    return await apiClient.post("/shifts/add", shiftData);
  },
  deleteShift: async (id) => {
    return await apiClient.delete(`/shifts/${id}`);
  },
  assignShift: async (shiftId, employeeIds) => {
    return await apiClient.put("/shifts/assign", { shiftId, employeeIds });
  }
};

export default shiftService;