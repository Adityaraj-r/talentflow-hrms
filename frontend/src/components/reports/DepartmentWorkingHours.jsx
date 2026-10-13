// import { motion } from "framer-motion";

// export default function DepartmentWorkingHours({ data }) {
//   if (!data?.data?.length) return null;

//   return (
//     <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//       {data.data.map((item, index) => (
//         <motion.div
//           key={index}
//           initial={{ opacity: 0, y: 15 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow"
//         >
//           <h3 className="text-lg font-semibold">
//             {item.department}
//           </h3>

//           <p className="mt-3 text-sm text-gray-500">
//             Total Working Hours
//           </p>
//           <p className="text-[17px] font-bold text-slate-900 dark:text-white">
//             {item.totalHours} hrs
//           </p>

//           <p className="mt-3 text-sm text-gray-500">
//             Avg Hours Per Day
//           </p>
//           <p className="text-xl font-semibold">
//             {item.avgHoursPerDay} hrs
//           </p>
//         </motion.div>
//       ))}
//     </div>
//   );
// }

import { motion } from "framer-motion";
import CountUp from "react-countup";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DepartmentWorkingHours({ data }) {
  if (!data?.data?.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-6">
        Department Working Hours
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.data.map((item, index) => (
          <motion.div
            key={item.department || index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="rounded-2xl shadow-sm hover:shadow-md transition">
              <CardContent className="p-6 space-y-4">
                
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {item.department}
                  </h3>

                  <Badge variant="outline">
                    Dept
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Working Hours
                  </p>
                  <p className="text-[17px] font-bold text-slate-900 dark:text-white">
                    <CountUp
                      end={item.totalHours }
                      duration={1.5}
                      separator=","
                    />{" "}
                    hrs
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg Hours Per Day
                  </p>
                  <p className="text-xl font-semibold">
                    <CountUp
                      end={item.avgHoursPerDay }
                      duration={1.5}
                      decimals={1}
                    />{" "}
                    hrs
                  </p>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}