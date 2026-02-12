import SkeletonCard from "./SkeletonCard";
import { useSummary } from "../../hooks/useReports";
import CountUp from "react-countup";
import { motion } from "framer-motion";

export default function KPISection({ filters }) {
  const { data, isLoading, isError } = useSummary(filters);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500">Failed to load report data</div>;
  }

  const cards = [
  { label: "Headcount", value: data?.headcount ?? 0 },
  { label: "Active Employees", value: data?.activeEmployees ?? 0 },
  { label: "Attrition Rate", value: `${data?.attritionRate ?? 0}%` },
  { label: "Avg Attendance", value: `${data?.avgAttendance ?? 0}%` },
  { label: "Total Payroll", value: `₹${data?.totalPayroll ?? 0}` },
  { label: "Open Positions", value: data?.openPositions ?? 0 },
];





    return (
  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
    {cards.map((card, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
        className="
          bg-card 
          border border-border 
          rounded-2xl 
          p-5 
          shadow-sm
          hover:shadow-lg
          hover:scale-[1.02]
          transition-all duration-300
        "
      >
        <p className="text-muted-foreground text-sm">
          {card.label}
        </p>

        <p className="text-2xl font-bold mt-2 text-foreground">
          {typeof card.value === "number" ? (
            <CountUp end={card.value} duration={1.5} />
          ) : (
            card.value
          )}
        </p>
      </motion.div>
    ))}
  </div>
);
}
