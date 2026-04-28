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
          item?.lateMarks ||
            0
        ),
      0
    );

  const totalLeaves =
    leaveRows.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.value ||
            0
        ),
      0
    );

  const totalAbsentDays =
    rows.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.absentDays ||
            0
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
                className="rounded-2xl shadow-sm border"
              >
                <CardContent className="p-5">

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {
                          item.label
                        }
                      </p>

                      <h3 className="text-2xl font-bold mt-2">
                        {
                          item.value
                        }
                      </h3>
                    </div>

                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
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