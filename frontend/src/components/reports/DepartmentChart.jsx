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
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6
                 hover:border-indigo-400 transition-all duration-300"
    >
      <h2 className="text-xl font-semibold mb-6 text-white">
        Department Distribution
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="department" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip />
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
