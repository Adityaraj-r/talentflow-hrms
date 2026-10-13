import api from "@/services/apiClient";

const handleRequest = async (promise) => {
  try {
    const res = await promise;
    return res; // already response.data from interceptor
  } catch (error) {
    console.error("Reports API Error:", error);
    throw error;
  }
};

export const getSummary = (filters) =>
  handleRequest(api.get("/reports/summary", { params: filters }));

export const getWorkforce = (filters) =>
  handleRequest(api.get("/reports/workforce", { params: filters }));

export const getAttendance = (filters) =>
  handleRequest(api.get("/reports/attendance", { params: filters }));

export const getDepartments = (filters) =>
  handleRequest(api.get("/reports/departments", { params: filters }));

export const getLeaves = (filters) =>
  handleRequest(api.get("/reports/leaves", { params: filters }));

export const getEmployeePerformance = (filters) =>
  handleRequest(api.get("/reports/performance", { params: filters }));

export const getDepartmentWorkingHours = (filters) =>
  handleRequest(api.get("/reports/department-hours", { params: filters }));

export const getCEOInsights = (filters) =>
  handleRequest(api.get("/reports/ceo-insights", { params: filters }));