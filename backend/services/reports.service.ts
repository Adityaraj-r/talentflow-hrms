import Employee from "../models/Employee.model";

export const fetchSummary = async (filters: any) => {
  const { department, startDate, endDate } = filters;

  const match: any = {};

  if (department && department !== "all") {
    match.department = department;
  }

  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const totalEmployees = await Employee.countDocuments(match);

  const activeEmployees = await Employee.countDocuments({
    ...match,
    status: "active",
  });

  const inactiveEmployees = await Employee.countDocuments({
    ...match,
    status: "inactive",
  });

  const attritionRate = totalEmployees
    ? Number(((inactiveEmployees / totalEmployees) * 100).toFixed(1))
    : 0;

  const payroll = await Employee.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ["$salary", 0] } },
      },
    },
  ]);

  return {
    headcount: totalEmployees,
    activeEmployees,
    attritionRate,
    avgAttendance: 0, 
    totalPayroll: payroll?.[0]?.total ?? 0,
    openPositions: 0, 
  };
};