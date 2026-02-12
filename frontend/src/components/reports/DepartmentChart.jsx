import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

export default function DepartmentChart() {
  const data = [
    { department: "IT", employees: 40 },
    { department: "HR", employees: 20 },
    { department: "Sales", employees: 35 },
    { department: "Finance", employees: 15 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
        rounded-2xl p-6
        shadow-sm dark:shadow-none
        hover:shadow-md
        dark:hover:border-indigo-400
        transition-all duration-300
      "
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Department Distribution
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid
            stroke="#e5e7eb"
            className="dark:stroke-slate-700"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="department"
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            className="dark:stroke-slate-400"
          />

          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280" }}
            className="dark:stroke-slate-400"
          />

          <Tooltip
            cursor={{ fill: "rgba(99,102,241,0.15)" }}
            contentStyle={{
              backgroundColor: "#0f172a", // dark background
              border: "1px solid #1e293b",
              borderRadius: "12px",
            }}
            itemStyle={{ color: "#ffffff" }}
            labelStyle={{ color: "#94a3b8" }}
          />


          <Bar
            dataKey="employees"
            fill="#6366f1"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

    </motion.div>
  );
}
