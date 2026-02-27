import api from "@/services/apiClient";

/* ===============================
   SUMMARY
================================ */
export const getSummary = (filters) =>
  api.get("/reports/summary", { params: filters });

/* ===============================
   WORKFORCE
================================ */
export const getWorkforce = (filters) =>
  api.get("/reports/workforce", { params: filters });

/* ===============================
   ATTENDANCE
================================ */
export const getAttendance = (filters) =>
  api.get("/reports/attendance", { params: filters });

/* ===============================
   DEPARTMENTS
================================ */
export const getDepartments = (filters) =>
  api.get("/reports/departments", { params: filters });

/* ===============================
   LEAVES
================================ */
export const getLeaves = (filters) =>
  api.get("/reports/leaves", { params: filters });

/* ===============================
   EMPLOYEE PERFORMANCE
================================ */
export const getEmployeePerformance = (filters) =>
  api.get("/reports/performance", {
    params: filters,
  });