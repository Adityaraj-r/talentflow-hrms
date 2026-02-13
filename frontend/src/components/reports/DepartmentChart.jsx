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
import { useState } from "react";

export default function DepartmentChart() {

  const [selectedDept, setSelectedDept] = useState(null);

  const data = [
    { department: "IT", employees: 40 },
    { department: "HR", employees: 20 },
    { department: "Sales", employees: 35 },
    { department: "Finance", employees: 15 },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="
          bg-white dark:bg-slate-900
          border border-gray-200 dark:border-slate-800
          rounded-2xl p-6
          shadow-sm
          dark:hover:border-indigo-400
          transition-all duration-300
        "
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Department Distribution
        </h2>

        <div className="w-full h-[320px] min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              onClick={(state) => {
                if (state?.activeLabel) {
                  setSelectedDept(state.activeLabel);
                }
              }}
            >
              <CartesianGrid
                stroke="#e5e7eb"
                className="dark:stroke-slate-700"
                strokeDasharray="3 3"
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
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Bar
                dataKey="employees"
                fill="#6366f1"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Drill-down Modal */}
      {selectedDept && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {selectedDept} Department Details
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>
                • Total Employees:{" "}
                {data.find(d => d.department === selectedDept)?.employees}
              </p>
              <p>• Active Projects: 6</p>
              <p>• Open Positions: 3</p>
              <p>• Avg Performance Score: 8.4</p>
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
