import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, DollarSign, Users } from "lucide-react";

export default function ExecutiveInsights() {
  const insights = [
    {
      icon: TrendingUp,
      title: "Workforce Growth",
      description: "Headcount increased by 8% in the last quarter.",
      color: "text-indigo-500",
    },
    {
      icon: AlertTriangle,
      title: "Attrition Risk",
      description: "Sales department showing 3% higher exit trend.",
      color: "text-amber-500",
    },
    {
      icon: DollarSign,
      title: "Payroll Trend",
      description: "Payroll expenses grew 5% month-over-month.",
      color: "text-emerald-500",
    },
    {
      icon: Users,
      title: "Hiring Momentum",
      description: "14 open positions across 4 departments.",
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
        transition-all duration-300
      "
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Executive AI Insights
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          AI-generated executive summary based on workforce analytics
        </p>
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
              className="
                relative
                bg-gray-50 
                dark:bg-slate-800/60
                border border-gray-200 dark:border-slate-700/60
                rounded-xl
                p-6
                transition-all duration-300
                hover:shadow-md
                dark:hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]
              "
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`${item.color}`} size={22} />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
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
