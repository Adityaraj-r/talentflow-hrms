import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Label,
} from "recharts";
import { motion } from "framer-motion";

export default function LeavePieChart() {
  const data = [
    { name: "Casual", value: 30 },
    { name: "Sick", value: 20 },
    { name: "Earned", value: 50 },
  ];

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="
        bg-white dark:bg-slate-900
        border border-gray-200 dark:border-slate-800
        rounded-2xl p-6
        shadow-sm dark:shadow-none
        hover:shadow-md
        dark:hover:border-amber-400
        transition-all duration-300
      "
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        Leave Breakdown
      </h2>

      {/* IMPORTANT FIX: wrapper with real height */}
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={75}
              outerRadius={110}
              paddingAngle={4}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}

              {/* Center Label inside SVG (no overlap ever) */}
              <Label
                value={`${total}%`}
                position="center"
                fill="#111827"
                className="dark:fill-white"
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                }}
              />
            </Pie>

            <Tooltip
              cursor={false}
              contentStyle={{
                backgroundColor: "#111827",
                border: "1px solid #1f2937",
                borderRadius: "10px",
              }}
              itemStyle={{ color: "#ffffff" }}
              labelStyle={{ color: "#ffffff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex justify-center gap-6 mt-6">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-gray-700 dark:text-slate-300">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
