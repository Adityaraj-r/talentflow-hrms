import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default GenderChart;

export const RoleChart = ({ data = [] }) => {
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

  return (
    <Card className="shadow-sm relative  h-[350px] flex flex-col">
      <CardHeader className=" pb-2">
        <CardTitle className="text-lg font-semibold">
          Employees by Role
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 pl-0 pr-0 pb-8">
        <div className="flex h-full w-full items-center">

          {/* LEFT SIDE – DONUT */}
          <div className="w-[55%] h-full flex items-center justify-start">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"          // pushes donut tightly left
                  cy="50%"
                  innerRadius="75%"
                  outerRadius="105%"
                  paddingAngle={2}
                >
                  {formattedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                  
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* RIGHT SIDE – CUSTOM VERTICAL LEGEND */}
          <div className="w-[45%] h-full flex flex-col justify-center space-y-4 pl-8 pr-0">
            {formattedData.map((entry, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor:
                      COLORS[index % COLORS.length],
                  }}
                />
                <span className="truncate">
                  {entry.name}
                </span>
              </div>
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  );
};