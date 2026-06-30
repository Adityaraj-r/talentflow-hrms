import {
  Clock3,
  Timer,
  BarChart3,
  Activity,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function ProductivityCards({
  data = [],
}) {
  const first =
    Array.isArray(data) &&
    data.length > 0
      ? data[0]
      : {};

  const totalHours =
    Number(
      first?.totalHours 
    );

  const avgHours =
    Number(
      first?.avgHoursPerDay 
    );

  const efficiency =
    avgHours > 0
      ? Math.min(
          (
            (avgHours / 8) *
            100
          ).toFixed(0),
          100
        )
      : 0;

  const productivity =
    totalHours > 0
      ? Math.min(
          (
            (totalHours /
              220) *
            100
          ).toFixed(0),
          100
        )
      : 0;

  const cards = [
    {
      title:
        "Efficiency",
      value: `${efficiency}`,
      suffix: "%",
      icon: Activity,
    },

    {
      title:
        "Productivity",
      value: `${productivity}`,
      suffix: "%",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-4">

      <div>
        <h2 className="text-2xl font-bold">
          Department Productivity
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Working hours and team efficiency overview
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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
                          item.title
                        }
                      </p>

                      <h3 className="text-2xl font-bold mt-2">
                        {
                          item.value
                        }
                        {
                          item.suffix
                        }
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
            );
          }
        )}

      </div>
    </div>
  );
}