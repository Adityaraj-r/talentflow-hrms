// Get last 12 months (default fallback)
export const getLast12Months = () => {
  const months = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      value: d.toISOString().split("T")[0],
    });
  }

  return months;
};


export const getMonthsBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  const months = [];
  const current = new Date(start);

  while (current <= end) {
    months.push({
      label: current.toLocaleString("default", {
        month: "short",
        year: "numeric",
      }),
      value: current.toISOString().split("T")[0],
    });

    current.setMonth(current.getMonth() + 1);
  }

  return months;
};
