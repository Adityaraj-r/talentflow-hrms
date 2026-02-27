import SkeletonCard from "@/components/reports/SkeletonCard";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function KPISection({ data, loading, error }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Failed to load report data
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const cards = [
    { label: "Headcount", value: data.headcount ?? 0 },
    { label: "Active Employees", value: data.activeEmployees ?? 0 },
    { label: "Attrition Rate", value: data.attritionRate ?? 0, suffix: "%" },
    { label: "Avg Attendance", value: data.avgAttendance ?? 0, suffix: "%" },
    { label: "Total Payroll", value: data.totalPayroll ?? 0, prefix: "₹" },
    { label: "Total Working Hours", value: data.totalWorkingHours ?? 0, suffix: " hrs" },
    { label: "Avg Working Hours", value: data.avgWorkingHours ?? 0, suffix: " hrs" },
    { label: "Open Positions", value: data.openPositions ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition hover:scale-[1.02]">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold mt-2">
                <CountUp
                  end={card.value}
                  duration={1.5}
                  prefix={card.prefix || ""}
                  suffix={card.suffix || ""}
                  separator=","
                />
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
