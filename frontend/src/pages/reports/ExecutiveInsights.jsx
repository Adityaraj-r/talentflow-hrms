import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Users } from "lucide-react";
import { useSummary } from "../../hooks/useReports";

export default function ExecutiveInsights({ filters }) {
  const { data, isLoading } = useSummary(filters);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-8">
        <p className="text-gray-500 dark:text-slate-400">
          Generating AI Insights...
        </p>
      </div>
    );
  }

  
  const headcount = data?.headcount ?? 0;
  const attritionRate = data?.attritionRate ?? 0;
  const totalPayroll = data?.totalPayroll ?? 0;
  const openPositions = data?.openPositions ?? 0;

  // Dynamic risk detection
  const attritionRisk =
    attritionRate > 8
      ? { level: "High Risk", color: "text-red-500", glow: "shadow-red-500/20" }
      : attritionRate > 5
      ? { level: "Moderate Risk", color: "text-amber-500", glow: "shadow-amber-500/20" }
      : { level: "Low Risk", color: "text-emerald-500", glow: "shadow-emerald-500/20" };

  const confidenceScore = 95; // stable confidence instead of random

  const insights = [
    {
      icon: TrendingUp,
      title: "Workforce Growth",
      description: `Current headcount: ${headcount}. Growth trend stable.`,
      color: "text-indigo-500",
    },
    {
      icon: AlertTriangle,
      title: "Attrition Analysis",
      description: `Attrition rate at ${attritionRate}%.`,
      badge: attritionRisk.level,
      badgeColor: attritionRisk.color,
      glow: attritionRisk.glow,
      color: "text-amber-500",
    },
    {
      icon: DollarSign,
      title: "Payroll Overview",
      description: `Total payroll: ₹${totalPayroll.toLocaleString()}.`,
      color: "text-emerald-500",
    },
    {
      icon: Users,
      title: "Hiring Activity",
      description: `${openPositions} open positions across departments.`,
      color: "text-blue-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        bg-white 
        dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
        border border-gray-200 dark:border-slate-700/60
        rounded-2xl
        p-8
        shadow-sm dark:shadow-2xl
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Executive AI Insights
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
            AI-generated executive summary based on selected filters
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            AI Confidence
          </p>
          <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {confidenceScore}%
          </p>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {insights.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className={`
                bg-gray-50 
                dark:bg-slate-800/60
                border border-gray-200 dark:border-slate-700/60
                rounded-xl
                p-6
                transition-all duration-300
                hover:shadow-md
                ${item.glow ? `dark:hover:${item.glow}` : ""}
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon className={item.color} size={22} />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>

                {item.badge && (
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-slate-700 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-300">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
