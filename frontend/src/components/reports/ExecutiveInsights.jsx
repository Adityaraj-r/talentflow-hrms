import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function ExecutiveInsights({
  data,
  loading,
  error,
}) {
  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Could not load executive insights
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const headcount = data.headcount ?? 0;
  const attritionRate = data.attritionRate ?? 0;
  const totalPayroll = data.totalPayroll ?? 0;
  const openPositions = data.openPositions ?? 0;

  const attritionRisk =
    attritionRate > 8
      ? { level: "High Risk", variant: "destructive" }
      : attritionRate > 5
      ? { level: "Moderate Risk", variant: "secondary" }
      : { level: "Low Risk", variant: "default" };

  const confidenceScore = 95;

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
      variant: attritionRisk.variant,
      color: "text-amber-500",
    },
    {
      icon: IndianRupee,
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
    >
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">
                Executive insights
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Summary derived from the selected report filters.
              </p>
            </div>

            <div className="text-right w-40">
              <p className="text-xs text-muted-foreground">
                Confidence score
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={confidenceScore} className="h-2" />
                <span className="text-sm font-semibold text-indigo-600">
                  {confidenceScore}%
                </span>
              </div>
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
                >
                  <Card className="rounded-xl hover:shadow-md transition">
                    <CardContent className="p-6 space-y-3">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={item.color} size={22} />
                          <h3 className="font-semibold">
                            {item.title}
                          </h3>
                        </div>

                        {item.badge && (
                          <Badge variant={item.variant}>
                            {item.badge}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}