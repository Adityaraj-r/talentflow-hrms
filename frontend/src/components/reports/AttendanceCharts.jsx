import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAttendance } from "../../hooks/useReports";
import { motion } from "framer-motion";

export default function AttendanceCharts() {
  const { data = [], isLoading } = useAttendance();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-300">
          Loading Attendance Data...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
        rounded-2xl
        p-6
        shadow-sm
        dark:hover:border-emerald-500
        transition-all duration-300
      "
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Attendance Analytics
      </h2>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid
            stroke="#e5e7eb"
            className="dark:stroke-slate-700"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="month"
            stroke="#6b7280"
            className="dark:stroke-slate-400"
          />

          <YAxis
            stroke="#6b7280"
            className="dark:stroke-slate-400"
          />

          <Tooltip
            cursor={{ stroke: "#22c55e", strokeWidth: 1 }}
            contentStyle={{
              backgroundColor: "#0b1220",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            }}
            itemStyle={{ color: "#ffffff" }}
            labelStyle={{ color: "#94a3b8" }}
          />


          <Line
            type="monotone"
            dataKey="attendance"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
