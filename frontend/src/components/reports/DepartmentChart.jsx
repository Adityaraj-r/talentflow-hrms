// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   ResponsiveContainer,
//   CartesianGrid,
//   Legend,
// } from "recharts";
// import { motion } from "framer-motion";
// import { useState } from "react";

// export default function DepartmentChart({
//   data = [],
//   loading,
//   error,
// }) {
//   const [selectedDept, setSelectedDept] = useState(null);

//   const handleClick = (state) => {
//     if (state?.activeLabel) {
//       setSelectedDept(state.activeLabel);
//     }
//   };

//   const selectedData = data.find(
//     (d) => d.department === selectedDept
//   );

//   if (loading) {
//     return (
//       <div className="bg-white dark:bg-slate-900 border p-6 rounded-2xl">
//         <p className="text-gray-500 dark:text-gray-300">
//           Loading Department Data...
//         </p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-500">
//         Failed to load department data
//       </div>
//     );
//   }

//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, y: 40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm"
//       >
//         <h2 className="text-xl font-semibold mb-6">
//           Department Distribution
//         </h2>

//         <div className="w-full h-[320px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={data} onClick={handleClick}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="department" />
//               <YAxis />
//               <Tooltip />
//               <Legend />

//               <Bar
//                 dataKey="employees"
//                 fill="#6366f1"
//                 radius={[8, 8, 0, 0]}
//                 activeBar={false}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </motion.div>

//       {/* ================= Modal ================= */}
//       {selectedDept && selectedData && (
//         <div
//           className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
//           onClick={() => setSelectedDept(null)}
//         >
//           <div
//             onClick={(e) => e.stopPropagation()}
//             className="bg-white dark:bg-slate-900 p-6 rounded-xl w-[400px] shadow-lg"
//           >
//             <h3 className="text-lg font-semibold mb-4">
//               {selectedDept} Department Details
//             </h3>

//             <div className="text-sm space-y-2">
//               <p>
//                 • Total Employees: {selectedData.employees}
//               </p>
//               <p>
//                 • Avg Salary: ₹
//                 {selectedData.avgSalary?.toLocaleString() || 0}
//               </p>
//               <p>
//                 • Total Salary: ₹
//                 {selectedData.totalSalary?.toLocaleString() || 0}
//               </p>
//               <p>
//                 • Percentage: {selectedData.percentage || 0}%
//               </p>
//             </div>

//             <button
//               onClick={() => setSelectedDept(null)}
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function DepartmentChart({
  data = [],
  loading,
  error,
}) {
  const [selectedDept, setSelectedDept] = useState(null);

  const handleClick = (state) => {
    if (state?.activeLabel) {
      setSelectedDept(state.activeLabel);
    }
  };

  const selectedData = data.find(
    (d) => d.department === selectedDept
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Loading Department Data...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-red-500">
          Failed to load department data
        </CardContent>
      </Card>
    );
  }

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
              Department Distribution
            </h2>

            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} onClick={handleClick}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />

                  <Bar
                    dataKey="employees"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                    activeBar={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ================= Dialog ================= */}
      <Dialog
        open={!!selectedDept}
        onOpenChange={() => setSelectedDept(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDept} Department Details
            </DialogTitle>
          </DialogHeader>

          {selectedData && (
            <div className="text-sm space-y-3 mt-4">
              <p>
                Total Employees:{" "}
                <Badge variant="secondary">
                  {selectedData.employees}
                </Badge>
              </p>

              <p>
                Avg Salary: ₹
                {selectedData.avgSalary?.toLocaleString() || 0}
              </p>

              <p>
                Total Salary: ₹
                {selectedData.totalSalary?.toLocaleString() || 0}
              </p>

              <p>
                Percentage:{" "}
                <Badge variant="outline">
                  {selectedData.percentage || 0}%
                </Badge>
              </p>

              <div className="pt-4">
                <Button onClick={() => setSelectedDept(null)}>
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