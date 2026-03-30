import { motion } from "framer-motion";

export default function WorkforceHealthMeter({
  data,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border rounded-2xl p-8 text-center">
        Loading Health Score...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Failed to calculate workforce health
      </div>
    );
  }

  if (!data) return null;

  const attendanceScore = data.avgAttendance || 0;
  const attritionScore = 100 - (data.attritionRate || 0);

  const activeRatio =
    data.headcount > 0
      ? (data.activeEmployees / data.headcount) * 100
      : 0;

  /* =====================================
     Health Formula
     40% Attendance
     30% (100 - Attrition)
     30% Active Ratio
  ===================================== */
  const healthScore = Math.round(
    attendanceScore * 0.4 +
      attritionScore * 0.3 +
      activeRatio * 0.3
  );

  const status =
    healthScore >= 85
      ? "Healthy"
      : healthScore >= 65
      ? "Moderate"
      : "Critical";

  const color =
    healthScore >= 85
      ? "#10b981"
      : healthScore >= 65
      ? "#f59e0b"
      : "#ef4444";

  const circumference = 2 * Math.PI * 60;
  const offset =
    circumference - (healthScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-slate-900 border rounded-2xl p-8 text-center shadow-sm"
    >
      <h2 className="text-xl font-semibold mb-6">
        Workforce Health Score
      </h2>

      <div className="relative flex items-center justify-center">
        <svg width="160" height="160">
          {/* Background Circle */}
          <circle
            cx="80"
            cy="80"
            r="60"
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
            className="dark:stroke-slate-700"
          />

          {/* Animated Progress */}
          <motion.circle
            cx="80"
            cy="80"
            r="60"
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1 }}
            transform="rotate(-90 80 80)"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center">
          <span
            className="text-3xl font-bold"
            style={{ color }}
          >
            {healthScore}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {status}
          </span>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        Composite score from attendance, attrition, and active headcount ratio.
      </p>
    </motion.div>
  );
}