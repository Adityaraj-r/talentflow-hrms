import { useQuery } from "@tanstack/react-query";

export const useSummary = () =>
  useQuery({
    queryKey: ["summary"],
    queryFn: async () => {
      return {
        headcount: 128,
        activeEmployees: 120,
        attritionRate: 6,
        avgAttendance: 92,
        totalPayroll: 7850000,
        openPositions: 14,
      };
    },
  });

export const useWorkforce = () =>
  useQuery({
    queryKey: ["workforce"],
    queryFn: async () => {
      return [
        { month: "Jan", headcount: 110 },
        { month: "Feb", headcount: 115 },
        { month: "Mar", headcount: 120 },
        { month: "Apr", headcount: 128 },
      ];
    },
  });

export const useAttendance = () =>
  useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      return [
        { month: "Jan", attendance: 90 },
        { month: "Feb", attendance: 88 },
        { month: "Mar", attendance: 92 },
        { month: "Apr", attendance: 95 },
      ];
    },
  });
