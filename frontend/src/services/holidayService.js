import apiClient from "./apiClient";

const holidayService = {
  getHolidays: async () => {
    return await apiClient.get("/holidays");
  },
  addHoliday: async (data) => {
    return await apiClient.post("/holidays/add", data);
  },
  deleteHoliday: async (id) => {
    return await apiClient.delete(`/holidays/${id}`);
  }
};

export default holidayService;
