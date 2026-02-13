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
import { getLast12Months } from "../../utils/dateUtils";
import { useState } from "react";

export default function WorkforceCharts() {

  // ✅ YOU COMMENTED THIS — NEED IT
  const { data = [], isLoading } = useWorkforce();

  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleMonthClick = (state) => {
    if (state?.activeLabel) {
      setSelectedMonth(state.activeLabel);
    }
  };

  // Generate last 12 months
  const months = getLast12Months();

  // Forward fill logic
  let lastValue = 0;

  const finalData = months.map((m) => {
    const found = data.find((d) => d.month === m.label);

    if (found) {
      lastValue = found.headcount;
      return found;
    }

    return {
      month: m.label,
      headcount: lastValue,
    };
  });

  // Forecast (last 3 months)
  const forecastData = finalData.map((item, index) => {
    if (index >= finalData.length - 3) {
      return {
        ...item,
        forecast:
          finalData[finalData.length - 4]?.headcount +
          (index - (finalData.length - 4)) * 5,
      };
    }

    return {
      ...item,
      forecast: null,
    };
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl">
        <p className="text-gray-500 dark:text-gray-300">
          Loading Workforce Data...
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
        className="
          bg-white dark:bg-slate-900
          border border-gray-200 dark:border-slate-800
          rounded-2xl
          p-6
          shadow-sm
          dark:hover:border-indigo-500
          transition-all duration-300
        "
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Workforce Analytics
        </h2>

        <div className="w-full h-[320px] min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData} onClick={handleMonthClick}>
              <legend>
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

              <Tooltip />

              {/* Actual */}
              <Area
                type="monotone"
                dataKey="headcount"
                stroke="#6366f1"
                fill="#6366f120"
                strokeWidth={3}
              />

              {/* Forecast */}
              <Area
                type="linear"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={2}
                fill="#f59e0b10"
              />
              </legend>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Drill-down Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Workforce Details — {selectedMonth}
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>
                • Total Employees:{" "}
                {finalData.find((d) => d.month === selectedMonth)?.headcount}
              </p>
              <p>• Estimated Hires: 8</p>
              <p>• Estimated Exits: 3</p>
              <p>• Net Growth: +5</p>
            </div>

            <button
              onClick={() => setSelectedMonth(null)}
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
