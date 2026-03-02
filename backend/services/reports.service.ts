import Employee from "../models/Employee.model";

export const fetchSummary = async (filters: any) => {
  const { department } = filters;

  const match: any = {};

  if (department && department !== "all") {
    match.department = department;
  }

  const headcount = await Employee.countDocuments(match);

  const activeEmployees = await Employee.countDocuments({
    ...match,
    status: "active",
  });

  const payroll = await Employee.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$salary" } } },
  ]);

  return {
    headcount,
    activeEmployees,
    attritionRate: 5, // placeholder for now
    avgAttendance: 94, // placeholder for now
    totalPayroll: payroll[0]?.total || 0,
    openPositions: 12, // placeholder
  };
};
