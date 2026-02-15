import { api } from "@/lib/api";

export const getSummary = (filters) =>
  api.get("/reports/summary", { params: filters });

export const getWorkforce = (filters) =>
  api.get("/reports/workforce", { params: filters });

export const getAttendance = (filters) =>
  api.get("/reports/attendance", { params: filters });
