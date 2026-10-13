import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';

const COLORS = [
  '#3b82f6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#14b8a6',
  '#f43f5e',
  '#eab308',
  '#6366f1',
  '#06b6d4',
  '#84cc16'
];

export const GenderChart = ({ data }) => (
  <Card className="shadow-sm h-[350px] flex flex-col">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-medium">Gender Ratio</CardTitle>
    </CardHeader>
    <CardContent className="flex-grow">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" label>
            {data?.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default GenderChart;

export const RoleChart = ({ data = [] }) => {
  // Format role names
  const formattedData = data.map((item) => ({
    ...item,
    name: item?.name
      ? item.name
        .split("_")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(" ")
      : "Unknown",
  }));

  // Sort descending
  const sortedData = [...formattedData].sort(
    (a, b) => b.value - a.value
  );

  // Top 5
  const topRoles = sortedData.slice(0, 5);

  // Others
  const remainingRoles = sortedData.slice(5);

  const othersValue = remainingRoles.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const chartData =
    othersValue > 0
      ? [...topRoles, { name: "Others", value: othersValue }]
      : topRoles;

  const totalEmployees = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Labels on slices
  const renderLabel = ({ percent }) => {
    if (percent < 0.08) return "";
    return `${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card className="shadow-sm min-h-[360px] lg:h-[360px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          Employees by Role
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-col xl:flex-row h-full">

          {/* Chart */}
          <div className="w-full lg:w-[52%] h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                  label={false}
                  labelLine={false}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationBegin={150}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}

                  <Label
                    position="center"
                    content={({ viewBox }) => {
                      if (!viewBox) return null;

                      const { cx, cy } = viewBox;

                      return (
                        <g>
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "22px",
                              fontWeight: 700,
                              fill: "#111827",
                            }}
                          >
                            {totalEmployees}
                          </text>

                          <text
                            x={cx}
                            y={cy + 18}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            style={{
                              fontSize: "12px",
                              fill: "#6B7280",
                            }}
                          >
                          </text>
                        </g>
                      );
                    }}
                  />
                </Pie>

                <Tooltip
                  formatter={(value, name) => {
                    const numericValue = Number(value);

                    const percentage = (
                      (numericValue / totalEmployees) *
                      100
                    ).toFixed(1);

                    return [
                      `${numericValue} Employees (${percentage}%)`,
                      name,
                    ];
                  }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#fff",
                    boxShadow:
                      "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />

              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          {/* Legend */}
          <div className="w-full lg:w-[48%] mt-4 lg:mt-0 lg:pl-4">

            <div className="space-y-2">

              {chartData.map((entry, index) => {

                const percentage = (
                  (entry.value / totalEmployees) *
                  100
                ).toFixed(0);

                return (
                  <div
                    key={index}
                    className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-1
            rounded-lg
            px-3
            py-2
            hover:bg-muted/40
            transition
          "
                  >
                    <div className="flex items-center gap-2 min-w-0">

                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />

                      <span
                        className="text-sm truncate font-medium"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>

                    </div>

                    <span className="text-sm font-semibold whitespace-nowrap self-end sm:self-auto">
                      {entry.value} ({percentage}%)
                    </span>

                  </div>
                );
              })}

            </div>

          </div>

        </div>
      </CardContent>
    </Card>
  );
};