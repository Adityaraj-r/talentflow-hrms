import CountUp from "react-countup";
import { motion } from "framer-motion";

import {
  Users,
  UserCheck,
  TrendingDown,
  CalendarCheck,
  Wallet,
  Clock3,
  Timer,
  Briefcase,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function KPISection({
  data,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(8)].map(
          (_, i) => (
            <Card
              key={i}
              className="rounded-2xl"
            >
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          )
        )}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-red-500">
          Failed to load report data
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: "Headcount",
      value:
        data.headcount ,
      icon: Users,
    },

    {
      label:
        "Active Employees",
      value:
        data.activeEmployees ,
      icon: UserCheck,
    },

    {
      label:
        "Attrition Rate",
      value:
        data.attritionRate ,
      suffix: "%",
      icon: TrendingDown,
    },

    {
      label:
        "Avg Attendance",
      value:
        data.avgAttendance ,
      suffix: "%",
      icon: CalendarCheck,
    },

    {
      label:
        "Total Payroll",
      value:
        data.totalPayroll ,
      prefix: "₹",
      icon: Wallet,
    },

    {
      label:
        "Total Working Hours",
      value:
        data.totalWorkingHours ,
      suffix: " hrs",
      icon: Clock3,
    },

    {
      label:
        "Avg Working Hours",
      value:
        data.avgWorkingHours ,
      suffix: " hrs",
      icon: Timer,
    },

    {
      label:
        "Open Positions",
      value:
        data.openPositions ,
      icon: Briefcase,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {cards.map(
        (
          card,
          index
        ) => {
          const Icon =
            card.icon;

          return (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.05,
              }}
            >
              <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <CardContent className="p-5">

                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {
                          card.label
                        }
                      </p>

                      <h3 className="text-2xl font-bold mt-2">
                        <CountUp
                          end={
                            Number(
                              card.value
                            ) 
                          }
                          duration={
                            1.3
                          }
                          prefix={
                            card.prefix ||
                            ""
                          }
                          suffix={
                            card.suffix ||
                            ""
                          }
                          separator=","
                        />
                      </h3>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white flex items-center justify-center">
                      <Icon
                        size={
                          18
                        }
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          );
        }
      )}

    </div>
  );
}