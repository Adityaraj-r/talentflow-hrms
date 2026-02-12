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
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 
                    hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]
                    transition-all duration-300"
        >
            <p className="text-slate-400 text-sm">{card.label}</p>

            <p className="text-2xl font-bold mt-2">
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
