import {
  AlertTriangle,
  CalendarX2,
  ClockAlert,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function AbsenteeismCard({
  attendance = [],
  leaves = [],
}) {
  const rows =
    Array.isArray(attendance)
      ? attendance
      : [];

  const leaveRows =
    Array.isArray(leaves)
      ? leaves
      : [];

  const totalLateMarks =
    rows.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.lateMarks 
        ),
      0
    );

  const totalLeaves =
    leaveRows.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.value 
        ),
      0
    );

  const totalAbsentDays =
    rows.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.absentDays 
        ),
      0
    );

  const riskEmployees =
    totalLateMarks > 10 ||
    totalAbsentDays > 5
      ? 3
      : totalLateMarks >
          5 ||
        totalAbsentDays >
          2
      ? 2
      : 1;

  const cards = [
    {
      label:
        "Late Marks",
      value:
        totalLateMarks,
      icon: ClockAlert,
    },

    {
      label:
        "Absent Days",
      value:
        totalAbsentDays,
      icon: CalendarX2,
    },

    {
      label:
        "Leaves Taken",
      value:
        totalLeaves,
      icon: Users,
    },

    {
      label:
        "Needs Attention",
      value:
        riskEmployees,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-2xl font-bold">
          Absenteeism Summary
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Attendance risks and leave behaviour overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {cards.map(
          (
            item,
            index
          ) => {
            const Icon =
              item.icon;

            return (
              <Card
                key={index}
                className="group relative cursor-pointer rounded-xl border border-border/80 hover:border-primary/40 dark:hover:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 transition-all duration-300 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CardContent className="p-5">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {
                          item.label
                        }
                      </p>

                      <h3 className="text-2xl font-bold tracking-tight text-foreground mt-1.5">
                        {
                          item.value
                        }
                      </h3>
                    </div>

                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                      <Icon
                        size={
                          18
                        }
                      />
                    </div>

                  </div>

                </CardContent>
              </Card>
            );
          }
        )}

      </div>
    </div>
  );
}