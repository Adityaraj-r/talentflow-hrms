// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
//   Legend,
// } from "recharts";
// import { motion } from "framer-motion";
// import { useState } from "react";
// import { getLast12Months, getMonthsBetween } from "@/utils/dateUtils";

// export default function AttendanceCharts({
//   data = [],
//   loading,
//   error,
//   filters,
// }) {
//   const [selectedMonth, setSelectedMonth] = useState(null);

//   const handleClick = (state) => {
//     if (state?.activeLabel) {
//       setSelectedMonth(state.activeLabel);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="bg-white dark:bg-slate-900 border p-6 rounded-2xl">
//         <p className="text-gray-500 dark:text-gray-300">
//           Loading Attendance Data...
//         </p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-500">
//         Failed to load attendance data
//       </div>
//     );
//   }

//   /* ===============================
//      Generate Months Based on Filter
//   =============================== */
//   const months =
//     filters?.startDate && filters?.endDate
//       ? getMonthsBetween(filters.startDate, filters.endDate)
//       : getLast12Months();

//   /* ===============================
//      Fill Missing Months With 0%
//   =============================== */
//   const formattedData = months.map((m) => {
//     const found = data.find((d) => d.month === m.label);

//     if (found) return found;

//     return {
//       month: m.label,
//       attendance: 0,
//       complianceScore: 0,
//       totalDays: 0,
//       presentDays: 0,
//       lateMarks: 0,
//       leavesTaken: 0,
//     };
//   });

//   const selectedData = formattedData.find(
//     (d) => d.month === selectedMonth
//   );

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm"
//       >
//         <h2 className="text-xl font-semibold mb-6">
//           Attendance Analytics
//         </h2>

//         <div className="w-full h-[320px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={formattedData} onClick={handleClick}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis domain={[0, 100]} />
//               <Tooltip />
//               <Legend />

//               <Line
//                 type="monotone"
//                 dataKey="attendance"
//                 stroke="#22c55e"
//                 strokeWidth={3}
//                 dot={{ r: 4 }}
//               />

//               <Line
//                 type="monotone"
//                 dataKey="complianceScore"
//                 stroke="#6366f1"
//                 strokeWidth={2}
//                 strokeDasharray="5 5"
//                 dot={{ r: 3 }}
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </motion.div>

//       {/* ================= Modal ================= */}
//       {selectedMonth && selectedData && (
//         <div
//           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//           onClick={() => setSelectedMonth(null)}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg"
//           >
//             <h3 className="text-lg font-semibold mb-4">
//               Attendance Details — {selectedMonth}
//             </h3>

//             <div className="text-sm space-y-2">
//               <p>• Attendance: {selectedData.attendance}%</p>
//               <p>• Total Records: {selectedData.totalDays}</p>
//               <p>• Present Days: {selectedData.presentDays}</p>
//               <p>• Late Marks: {selectedData.lateMarks}</p>
//               <p>• Leaves Taken: {selectedData.leavesTaken}</p>
//               <p>
//                 • Compliance Score:{" "}
//                 <span
//                   className={
//                     selectedData.complianceScore > 90
//                       ? "text-emerald-500"
//                       : selectedData.complianceScore > 75
//                       ? "text-amber-500"
//                       : "text-red-500"
//                   }
//                 >
//                   {selectedData.complianceScore}%
//                 </span>
//               </p>
//             </div>

//             <button
//               onClick={() => setSelectedMonth(null)}
//               className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg"
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";
import { getLast12Months, getMonthsBetween } from "@/utils/dateUtils";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AttendanceCharts({
  data = [],
  loading,
  error,
  filters,
}) {
  const [selectedMonth, setSelectedMonth] = useState(null);

  const handleClick = (state) => {
    if (state?.activeLabel) {
      setSelectedMonth(state.activeLabel);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Loading Attendance Data...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Failed to load attendance data
        </CardContent>
      </Card>
    );
  }

  /* ===============================
     Generate Months Based on Filter
  =============================== */
  const months =
    filters?.startDate && filters?.endDate
      ? getMonthsBetween(filters.startDate, filters.endDate)
      : getLast12Months();

  /* ===============================
     Fill Missing Months With 0%
  =============================== */
  const formattedData = months.map((m) => {
    const found = data.find((d) => d.month === m.label);

    if (found) return found;

    return {
      month: m.label,
      attendance: 0,
      complianceScore: 0,
      totalDays: 0,
      presentDays: 0,
      lateMarks: 0,
      leavesTaken: 0,
    };
  });

  const selectedData = formattedData.find(
    (d) => d.month === selectedMonth
  );

  const getComplianceVariant = (score) => {
    if (score > 90) return "default";
    if (score > 75) return "secondary";
    return "destructive";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">
              Attendance Analytics
            </h2>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData} onClick={handleClick}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="complianceScore"
                    stroke="#6366f1"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================= Dialog ================= */}
      <Dialog
        open={!!selectedMonth}
        onOpenChange={() => setSelectedMonth(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Attendance Details — {selectedMonth}
            </DialogTitle>
          </DialogHeader>

          {selectedData && (
            <div className="text-sm space-y-3 mt-4">
              <p>Attendance: {selectedData.attendance}%</p>
              <p>Total Records: {selectedData.totalDays}</p>
              <p>Present Days: {selectedData.presentDays}</p>
              <p>Late Marks: {selectedData.lateMarks}</p>
              <p>Leaves Taken: {selectedData.leavesTaken}</p>

              <div className="flex items-center gap-2">
                <span>Compliance Score:</span>
                <Badge variant={getComplianceVariant(selectedData.complianceScore)}>
                  {selectedData.complianceScore}%
                </Badge>
              </div>

              <div className="pt-4">
                <Button onClick={() => setSelectedMonth(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}