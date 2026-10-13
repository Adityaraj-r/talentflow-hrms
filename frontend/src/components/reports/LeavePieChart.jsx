import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

export default function LeavePieChart({
  data = [],
  loading,
  error,
}) {
  const totalLeaves = data.reduce(
    (acc, item) =>
      acc + (item.value ),
    0
  );

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 text-red-500">
          Failed to load leave data
        </CardContent>
      </Card>
    );
  }

  if (!data.length || totalLeaves === 0) {
    return (
      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Leave Breakdown
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Team leave summary
            </p>
          </div>

          <div className="h-[280px] flex flex-col items-center justify-center text-center">
            <div className="text-5xl">
              📅
            </div>

            <h3 className="font-semibold mt-4">
              No Leaves Recorded
            </h3>

            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Your department has no
              leave activity for the
              selected period.
            </p>

            <Button
              variant="outline"
              className="mt-5"
            >
              Total Leaves: 0
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-6">

          <div className="mb-5">
            <h2 className="text-xl font-bold">
              Leave Breakdown
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Team leave category split
            </p>
          </div>

          <div className="relative w-full h-[320px]">
            <ResponsiveContainer
              width="99%"
              height={320}
            >
              <PieChart>
                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />

                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={75}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {data.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                              COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* CENTER TEXT */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">
                Total
              </span>

              <span className="text-3xl font-bold">
                {totalLeaves}
              </span>

              <span className="text-xs text-muted-foreground">
                Leaves
              </span>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}