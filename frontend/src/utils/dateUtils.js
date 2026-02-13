export const getLast12Months = () => {
  const months = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

    months.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString("default", { month: "short" }),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    });
  }

  return months;
};
