import { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";

export function useSummary(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/reports/summary", {
          params: filters,
        });
        setData(res.data?.data);
      } catch (err) {
        console.error("Summary fetch failed");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [filters]);

  return { data, loading };
}