// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
//   Legend,
// } from "recharts";
// import { motion } from "framer-motion";
// import { getLast12Months, getMonthsBetween } from "@/utils/dateUtils";
// //import { useWorkforce } from "@/hooks/useReports";
// import { useState } from "react";

// export default function WorkforceCharts({
//   data = [],
//   loading,
//   error,
//   filters,
// }) {
//   const [selectedMonth, setSelectedMonth] = useState(null);

//   const handleMonthClick = (state) => {
//     if (state?.activeLabel) {
//       setSelectedMonth(state.activeLabel);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white dark:bg-slate-900 border p-6 rounded-2xl">
//         <p className="text-gray-500 dark:text-gray-300">
//           Loading Workforce Data...
//         </p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-500">
//         Failed to load workforce data
//       </div>
//     );
//   }

//   const months =
//     filters?.startDate && filters?.endDate
//       ? getMonthsBetween(filters.startDate, filters.endDate)
//       : getLast12Months();

//   /* ===============================
//      Fill Missing Months
//   =============================== */
//   let lastValue = 0;

//   const finalData = months.map((m) => {
//     const found = data.find((d) => d.month === m.label);

//     if (found) {
//       lastValue = found.headcount;
//       return found;
//     }

//     return {
//       month: m.label,
//       headcount: lastValue,
//     };
//   });

//   /* ===============================
//      Forecast Logic
//   =============================== */
//   const headcounts = finalData.map((d) => d.headcount);
//   const first = headcounts[0] ;
//   const last = headcounts[headcounts.length - 1] ;
//   const monthsCount = headcounts.length;

//   const avgGrowth =
//     monthsCount > 1 ? (last - first) / (monthsCount - 1) : 0;

//   const forecastData = finalData.map((item, index) => {
//     if (index >= finalData.length - 3) {
//       const projected = Math.max(
//         0,
//         Math.round(last + avgGrowth * (index - (finalData.length - 4)))
//       );

//       return {
//         ...item,
//         forecast: projected,
//       };
//     }

//     return { ...item, forecast: null };
//   });

//   /* ===============================
//      Modal Calculation
//   =============================== */
//   const selectedIndex = finalData.findIndex(
//     (d) => d.month === selectedMonth
//   );

//   const previousValue =
//     selectedIndex > 0
//       ? finalData[selectedIndex - 1]?.headcount
//       : 0;

//   const currentValue =
//     selectedIndex >= 0
//       ? finalData[selectedIndex]?.headcount
//       : 0;

//   const netGrowth = currentValue - previousValue;

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm"
//       >
//         <h2 className="text-xl font-semibold mb-6">
//           Workforce Analytics
//         </h2>

//         <div className="w-full h-[320px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <AreaChart
//               data={forecastData}
//               onClick={handleMonthClick}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis allowDecimals={false} />
//               <Tooltip />
//               <Legend />

//               <Area
//                 type="monotone"
//                 dataKey="headcount"
//                 stroke="#6366f1"
//                 fill="#6366f120"
//                 strokeWidth={3}
//               />

//               <Area
//                 type="monotone"
//                 dataKey="forecast"
//                 stroke="#f59e0b"
//                 strokeDasharray="5 5"
//                 strokeWidth={2}
//                 fill="#f59e0b10"
//               />
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//       </motion.div>

//       {selectedMonth && (
//         <div
//           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//           onClick={() => setSelectedMonth(null)}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg"
//           >
//             <h3 className="text-lg font-semibold mb-4">
//               Workforce Details — {selectedMonth}
//             </h3>

//             <div className="text-sm space-y-2">
//               <p>• Total Employees: {currentValue}</p>
//               <p>
//                 • Net Growth:{" "}
//                 {netGrowth >= 0 ? `+${netGrowth}` : netGrowth}
//               </p>
//             </div>

//             <button
//               onClick={() => setSelectedMonth(null)}
//               className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { getLast12Months, getMonthsBetween } from "@/utils/dateUtils";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function WorkforceCharts({
  data = [],
  loading,
  error,
  filters,
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleMonthClick = (state) => {
    if (state?.activeLabel) {
      setSelectedMonth(state.activeLabel);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[280px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Failed to load workforce data
        </CardContent>
      </Card>
    );
  }

  const months =
    filters?.startDate && filters?.endDate
      ? getMonthsBetween(filters.startDate, filters.endDate)
      : getLast12Months();

  let lastValue = 0;

  const finalData = months.map((m) => {
    const found = data.find((d) => d.month === m.label);

    if (found) {
      lastValue = found.headcount;
      return found;
    }

    return {
      month: m.label,
      headcount: lastValue,
    };
  });

  const headcounts = finalData.map((d) => d.headcount);
  const first = headcounts[0] ;
  const last = headcounts[headcounts.length - 1] ;
  const monthsCount = headcounts.length;

  const avgGrowth =
    monthsCount > 1 ? (last - first) / (monthsCount - 1) : 0;

  const forecastData = finalData.map((item, index) => {
    if (index >= finalData.length - 3) {
      const projected = Math.max(
        0,
        Math.round(last + avgGrowth * (index - (finalData.length - 4)))
      );

      return {
        ...item,
        forecast: projected,
      };
    }

    return { ...item, forecast: null };
  });

  const selectedIndex = finalData.findIndex(
    (d) => d.month === selectedMonth
  );

  const previousValue =
    selectedIndex > 0
      ? finalData[selectedIndex - 1]?.headcount
      : 0;

  const currentValue =
    selectedIndex >= 0
      ? finalData[selectedIndex]?.headcount
      : 0;

  const netGrowth = currentValue - previousValue;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              Workforce Analytics
            </h2>

            <div className="w-full min-h-[320px]">
              <ResponsiveContainer width="99%" height={320}>
                <AreaChart
                  data={forecastData}
                  onClick={handleMonthClick}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />

                  <Area
                    type="monotone"
                    dataKey="headcount"
                    stroke="#6366f1"
                    fill="#6366f120"
                    strokeWidth={3}
                  />

                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#f59e0b"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    fill="#f59e0b10"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={!!selectedMonth}
        onOpenChange={() => setSelectedMonth(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Workforce Details — {selectedMonth}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p>• Total Employees: {currentValue}</p>
            <p>
              • Net Growth:{" "}
              {netGrowth >= 0 ? `+${netGrowth}` : netGrowth}
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => setSelectedMonth(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}