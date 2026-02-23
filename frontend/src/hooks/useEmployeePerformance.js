import { useEffect, useState } from "react";
import { getEmployeePerformance } from "@/services/reports.service";

export default function useEmployeePerformance(filters) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await getEmployeePerformance(filters);

        setData(res.data || []);
        setPagination(null);

      } catch (err) {
        console.error("Employee Performance Error:", err);
        setError("Failed to load employee performance");
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, [filters]);

  return { data, pagination, loading, error };
}