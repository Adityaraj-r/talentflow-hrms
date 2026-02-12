import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const getSummary = (filters) =>
  API.get("/reports/summary", { params: filters });

export const getWorkforce = (filters) =>
  API.get("/reports/workforce", { params: filters });

export const getAttendance = (filters) =>
  API.get("/reports/attendance", { params: filters });
