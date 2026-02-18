import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAttendance } from "../../hooks/useReports";
import { motion } from "framer-motion";
import { useState } from "react";
import { getLast12Months, getMonthsBetween } from "../../utils/dateUtils";

export default function AttendanceCharts({ filters }) {
  const { data = [], isLoading } = useAttendance(filters);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleClick = (state) => {
    if (state?.activeLabel) {
      setSelectedMonth(state.activeLabel);
    }
  };

  /* ===============================
     Generate Months Based on Filter
  =============================== */
  const months =
    filters?.startDate && filters?.endDate
      ? getMonthsBetween(filters.startDate, filters.endDate)
      : getLast12Months();

  /* ===============================
     Fill Missing Months With 0%
  =============================== */
  const formattedData = months.map((m) => {
    const found = data.find((d) => d.month === m.label);

    if (found) return found;

    return {
      month: m.label,
      attendance: 0,
      complianceScore: 0,
      totalDays: 0,
      presentDays: 0,
      lateMarks: 0,
      leavesTaken: 0,
    };
  });

  const selectedData = formattedData.find(
    (d) => d.month === selectedMonth
  );

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
        transition={{ duration: 0.6 }}
        className="
          bg-white dark:bg-slate-900
          border border-gray-200 dark:border-slate-800
          rounded-2xl
          p-6
          shadow-sm
          transition-all duration-300
        "
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
          Attendance Analytics
        </h2>

        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} onClick={handleClick}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                className="dark:stroke-slate-700"
              />

              <XAxis
                dataKey="month"
                stroke="#6b7280"
                className="dark:stroke-slate-400"
              />

              <YAxis
                domain={[0, 100]}
                stroke="#6b7280"
                className="dark:stroke-slate-400"
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b1220",
                  border: "1px solid #1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Legend />

              {/* Attendance % */}
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4 }}
              />

              {/* Compliance Score */}
              <Line
                type="monotone"
                dataKey="complianceScore"
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ===============================
         Dynamic Modal
      =============================== */}
      {selectedMonth && selectedData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedMonth(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Attendance Details — {selectedMonth}
            </h3>

            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p>• Attendance: {selectedData.attendance}%</p>
              <p>• Total Records: {selectedData.totalDays}</p>
              <p>• Present Days: {selectedData.presentDays}</p>
              <p>• Late Marks: {selectedData.lateMarks}</p>
              <p>• Leaves Taken: {selectedData.leavesTaken}</p>
              <p>
                • Compliance Score:{" "}
                <span
                  className={
                    selectedData.complianceScore > 90
                      ? "text-emerald-500"
                      : selectedData.complianceScore > 75
                      ? "text-amber-500"
                      : "text-red-500"
                  }
                >
                  {selectedData.complianceScore}%
                </span>
              </p>
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
