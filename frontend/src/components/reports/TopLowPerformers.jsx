import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  TrendingDown,
} from "lucide-react";

export default function TopLowPerformers({
  data = [],
}) {
  const rows =
    Array.isArray(data)
      ? data
      : [];

  const sorted =
    [...rows].sort(
      (a, b) =>
        Number(
          b?.performanceScore ||
            b?.score 
        ) -
        Number(
          a?.performanceScore ||
            a?.score 
        )
    );

  const top =
    sorted.slice(0, 3);

  const low =
    [...sorted]
      .reverse()
      .slice(0, 3);

  const getName = (
    emp
  ) =>
    `${emp?.firstName || ""} ${
      emp?.lastName || ""
    }`.trim() ||
    emp?.name ||
    "Employee";

  const getScore = (
    emp
  ) =>
    Number(
      emp?.performanceScore ||
        emp?.score 
    );

  const ListCard = ({
    title,
    icon: Icon,
    items,
  }) => (
    <Card className="rounded-2xl shadow-sm border">
      <CardContent className="p-5">

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white flex items-center justify-center">
            <Icon size={18} />
          </div>

          <div>
            <h3 className="font-semibold">
              {title}
            </h3>

            <p className="text-sm text-muted-foreground">
              Team ranking insights
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {items.length >
          0 ? (
            items.map(
              (
                emp,
                index
              ) => (
                <div
                  key={index}
                  className="flex items-center justify-between border rounded-xl px-3 py-2"
                >
                  <span className="font-medium text-sm">
                    {
                      index +
                        1
                    }
                    .{" "}
                    {getName(
                      emp
                    )}
                  </span>

                  <span className="text-sm font-bold">
                    {getScore(
                      emp
                    )}
                  </span>
                </div>
              )
            )
          ) : (
            <p className="text-sm text-muted-foreground">
              No records found
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <ListCard
        title="Top Performers"
        icon={Trophy}
        items={top}
      />

      <ListCard
        title="Needs Attention"
        icon={TrendingDown}
        items={low}
      />

    </div>
  );
}