import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useWorkforce } from "../../hooks/useReports";
import { motion } from "framer-motion";

export default function WorkforceCharts() {
  const { data = [], isLoading } = useWorkforce();

  if (isLoading) {
    return (
      <div className="bg-slate-900 p-6 rounded-2xl text-white">
        Loading Workforce Data...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6
                 hover:border-indigo-500 transition-all duration-300"
    >
      <h2 className="text-xl font-semibold mb-6 text-white">
        Workforce Analytics
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              color: "#fff",
            }}
          />
          <Area
            type="monotone"
            dataKey="headcount"
            stroke="#6366f1"
            fill="#6366f120"
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
