import { useQuery } from "@tanstack/react-query";

/* ------------------------------------------
   BASE MOCK DATA (Full Year)
------------------------------------------- */
const baseData = [
  { month: "Jan", headcount: 120, attendance: 92 },
  { month: "Feb", headcount: 125, attendance: 90 },
  { month: "Mar", headcount: 128, attendance: 94 },
  { month: "Apr", headcount: 130, attendance: 91 },
  { month: "May", headcount: 135, attendance: 95 },
  { month: "Jun", headcount: 140, attendance: 93 },
  { month: "Jul", headcount: 142, attendance: 92 },
  { month: "Aug", headcount: 145, attendance: 96 },
  { month: "Sep", headcount: 150, attendance: 94 },
  { month: "Oct", headcount: 155, attendance: 95 },
  { month: "Nov", headcount: 160, attendance: 93 },
  { month: "Dec", headcount: 165, attendance: 97 },
];

/* ------------------------------------------
   Utility: Filter by Date Range
------------------------------------------- */
const filterByDateRange = (data, filters) => {
  if (!filters?.startDate || !filters?.endDate) return data;

  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);

  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3,
    May: 4, Jun: 5, Jul: 6, Aug: 7,
    Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  return data.filter(item => {
    const monthIndex = monthMap[item.month];
    const current = new Date(end.getFullYear(), monthIndex, 1);
    return current >= start && current <= end;
  });
};

/* ------------------------------------------
   Workforce Hook
------------------------------------------- */
export const useWorkforce = (filters) =>
  useQuery({
    queryKey: ["workforce", filters],
    queryFn: async () => {
      let data = [...baseData];

      // Department simulation
      if (filters?.department && filters.department !== "all") {
        data = data.map(item => ({
          ...item,
          headcount: item.headcount - 20,
        }));
      }

      // Date filter
      data = filterByDateRange(data, filters);

      return data;
    },
  });

/* ------------------------------------------
   Attendance Hook
------------------------------------------- */
export const useAttendance = (filters) =>
  useQuery({
    queryKey: ["attendance", filters],
    queryFn: async () => {
      let data = [...baseData];

      data = filterByDateRange(data, filters);

      return data;
    },
  });

/* ------------------------------------------
   Department Distribution Hook
------------------------------------------- */
export const useDepartment = (filters) =>
  useQuery({
    queryKey: ["department", filters],
    queryFn: async () => {
      let departments = [
        { department: "Engineering", employees: 40 },
        { department: "Sales", employees: 35 },
        { department: "Marketing", employees: 25 },
        { department: "HR", employees: 20 },
        { department: "Finance", employees: 15 },
        { department: "Operations", employees: 30 },
      ];

      if (filters?.department && filters.department !== "all") {
        departments = departments.filter(
          d => d.department === filters.department
        );
      }

      return departments;
    },
  });

/* ------------------------------------------
   Summary Hook
------------------------------------------- */
export const useSummary = (filters) =>
  useQuery({
    queryKey: ["summary", filters],
    queryFn: async () => {
      const workforce = await Promise.resolve(baseData);
      const filtered = filterByDateRange(workforce, filters);

      const latest = filtered[filtered.length - 1] || workforce[workforce.length - 1];

      return {
        headcount: latest.headcount,
        activeEmployees: latest.headcount - 7,
        attritionRate: 6,
        avgAttendance:
          filtered.reduce((sum, m) => sum + m.attendance, 0) /
          (filtered.length || 1),
        totalPayroll: latest.headcount * 50000,
        openPositions: 12,
      };
    },
  });

export const useLeave = (filters) =>
  useQuery({
    queryKey: ["leave", filters],
    queryFn: async () => {
      return [
        { name: "Casual", value: 30 },
        { name: "Sick", value: 20 },
        { name: "Earned", value: 50 },
      ];
    },
  });
