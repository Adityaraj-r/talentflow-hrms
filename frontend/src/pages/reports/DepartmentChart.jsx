import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useDepartments } from "../../hooks/useReports";
import { motion } from "framer-motion";
import { useState } from "react";

export default function DepartmentChart({ filters }) {
  const { data = [], isLoading } = useDepartments(filters);
  const [selectedDept, setSelectedDept] = useState(null);

  const handleClick = (state) => {
    if (state?.activeLabel) {
      setSelectedDept(state.activeLabel);
    }
  };

  const selectedData = data.find(
    (d) => d.department === selectedDept
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-300">
          Loading Department Data...
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Department Distribution
        </h2>

        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} onClick={handleClick}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-slate-700"
              />

              <XAxis
                dataKey="department"
                stroke="#6b7280"
                className="dark:stroke-slate-400"
              />

              <YAxis
                stroke="#6b7280"
                className="dark:stroke-slate-400"
              />

              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Legend />

              <Bar
                dataKey="employees"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
                activeBar={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Dynamic Modal */}
      {selectedDept && selectedData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedDept(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {selectedDept} Department Details
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>• Total Employees: {selectedData.employees}</p>
              <p>• Avg Salary: ₹{selectedData.avgSalary?.toLocaleString()}</p>
              <p>• Total Salary: ₹{selectedData.totalSalary?.toLocaleString()}</p>
              <p>• Percentage: {selectedData.percentage}%</p>
            </div>

            <button
              onClick={() => setSelectedDept(null)}
              className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
