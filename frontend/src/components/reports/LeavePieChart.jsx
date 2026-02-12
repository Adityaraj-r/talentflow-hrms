import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { motion } from "framer-motion";

export default function LeavePieChart() {
  const data = [
    { name: "Casual", value: 30 },
    { name: "Sick", value: 20 },
    { name: "Earned", value: 50 },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6
                 hover:border-amber-400 transition-all duration-300"
    >
      <h2 className="text-xl font-semibold mb-6 text-white">
        Leave Breakdown
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={100}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
