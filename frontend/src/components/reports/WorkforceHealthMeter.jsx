import { motion } from "framer-motion";
import { useSummary } from "../../utils/useReports";

export default function WorkforceHealthMeter({ filters }) {
  const { data, isLoading } = useSummary(filters);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6">
        <p className="text-gray-500 dark:text-gray-400">
          Calculating Workforce Health...
        </p>
      </div>
    );
  }

  // Weighted scoring logic
  const attendanceScore = (data?.avgAttendance || 0) * 0.4;
  const attritionScore = (100 - (data?.attritionRate || 0)) * 0.3;
  const hiringScore = (data?.openPositions > 0 ? 80 : 60) * 0.2;
  const payrollScore = 90 * 0.1;

  const totalScore = Math.round(
    attendanceScore + attritionScore + hiringScore + payrollScore
  );

  let status = "Healthy";
  let color = "text-emerald-500";
  let ringColor = "stroke-emerald-500";

  if (totalScore < 70) {
    status = "Critical";
    color = "text-red-500";
    ringColor = "stroke-red-500";
  } else if (totalScore < 85) {
    status = "Watch";
    color = "text-amber-500";
    ringColor = "stroke-amber-500";
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (totalScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
        rounded-2xl
        p-8
        shadow-sm
        text-center
      "
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Workforce Health Score
      </h2>

      <div className="flex justify-center items-center">
        <svg width="180" height="180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
            className="dark:stroke-slate-700"
          />

          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            strokeWidth="12"
            fill="none"
            className={ringColor}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1 }}
          />
        </svg>

        <div className="absolute">
          <p className={`text-3xl font-bold ${color}`}>
            {totalScore}
          </p>
          <p className={`text-sm font-medium ${color}`}>
            {status}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        AI-generated overall workforce health assessment
      </p>
    </motion.div>
  );
}
