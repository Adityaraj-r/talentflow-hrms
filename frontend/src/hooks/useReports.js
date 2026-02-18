import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_BASE = "http://localhost:5001/api/reports";

/* =========================
   HELPER: Stable Key Builder
========================= */
const buildQueryKey = (key, filters = {}) => [
  key,
  filters?.department || "all",
  filters?.startDate || "",
  filters?.endDate || "",
];

/* =========================
   SUMMARY
========================= */
export const useSummary = (filters = {}) => {
  return useQuery({
    queryKey: buildQueryKey("summary", filters),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/summary`, {
        params: filters,
      });
      return res.data.data;
    },
    staleTime: 0,              // Always refetch on filter change
    keepPreviousData: false,   // Prevent stale UI flash
  });
};

/* =========================
   WORKFORCE
========================= */
export const useWorkforce = (filters = {}) => {
  return useQuery({
    queryKey: buildQueryKey("workforce", filters),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/workforce`, {
        params: filters,
      });
      return res.data.data;
    },
    keepPreviousData: false,
  });
};

/* =========================
   ATTENDANCE
========================= */
export const useAttendance = (filters = {}) => {
  return useQuery({
    queryKey: buildQueryKey("attendance", filters),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/attendance`, {
        params: filters,
      });
      return res.data.data;
    },
    keepPreviousData: false,
  });
};

/* =========================
   DEPARTMENTS
========================= */
export const useDepartments = (filters = {}) => {
  return useQuery({
    queryKey: buildQueryKey("departments", filters),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/departments`, {
        params: filters,
      });
      return res.data.data;
    },
    keepPreviousData: false,
  });
};

/* =========================
   LEAVES
========================= */
export const useLeaves = (filters = {}) => {
  return useQuery({
    queryKey: buildQueryKey("leaves", filters),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/leaves`, {
        params: filters,
      });
      return res.data.data;
    },
    keepPreviousData: false,
  });
};
