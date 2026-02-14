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
import { getLast12Months } from "../../utils/dateUtils";
import { useState } from "react";
import { getMonthsBetween } from "../../utils/dateUtils";


export default function AttendanceCharts({ filters }) {
  const { data = [], isLoading } = useAttendance(filters);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // Generate last 12 months
  const months =
              filters.startDate && filters.endDate
                ? getMonthsBetween(filters.startDate, filters.endDate)
                : getLast12Months();


  // Forward fill attendance
  let lastValue = 0;

  const finalData = months.map((m) => {
    const found = data.find((d) => d.month === m.label);

    if (found) {
      lastValue = found.attendance;
      return found;
    }

    return {
      month: m.label,
      attendance: lastValue,
    };
  });

  
  const visibleLength = finalData.length;
  const forecastMonths = Math.min(3, visibleLength);
  const forecastStartIndex = visibleLength - forecastMonths;

  const forecastData = finalData.map((item, index) => {
    if (index >= forecastStartIndex) {
      return {
        ...item,
        forecast:
          finalData[forecastStartIndex - 1]?.attendance +
          (index - forecastStartIndex + 1) * 1.5,
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
          Loading Attendance Data...
        </p>
      </div>
    );
  }

  return (
    <>
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

        <div className="w-full h-[320px] min-h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastData}
              onClick={(state) => {
                if (state?.activeLabel) {
                  setSelectedMonth(state.activeLabel);
                }
              }}
            >
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
                }}
                itemStyle={{ color: "#ffffff" }}
                labelStyle={{ color: "#94a3b8" }}
              />

              {/* Actual Data */}
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              {/* Forecast Line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Drill-down Modal */}
      {selectedMonth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Attendance Details — {selectedMonth}
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>
                • Attendance:{" "}
                {finalData.find(d => d.month === selectedMonth)?.attendance}%
              </p>
              <p>• Leaves Taken: 12</p>
              <p>• Late Marks: 4</p>
              <p>• Compliance Score: 94%</p>
            </div>

            <button
              onClick={() => setSelectedMonth(null)}
              className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
