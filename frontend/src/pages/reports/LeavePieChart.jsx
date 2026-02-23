import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"];

export default function LeavePieChart({
  data = [],
  loading,
  error,
}) {
  const totalLeaves = data.reduce(
    (acc, item) => acc + (item.value || 0),
    0
  );

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border p-6 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-300">
          Loading Leave Data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Failed to load leave data
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold mb-6">
        Leave Breakdown
      </h2>

      <div className="relative w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip />
            <Legend />

            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Total Leaves
          </p>
          <p className="text-3xl font-bold">
            {totalLeaves}
          </p>
        </div>
      </div>
    </motion.div>
  );
}