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

import {
  getLast12Months,
  getMonthsBetween,
} from "@/utils/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendanceCharts({
  data = [],
  loading,
  error,
  filters,
}) {
  const [selectedMonth, setSelectedMonth] =
    useState(null);

  const handleClick = (state) => {
    if (state?.activeLabel) {
      setSelectedMonth(state.activeLabel);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 text-red-500">
          Failed to load attendance data
        </CardContent>
      </Card>
    );
  }

  const months =
    filters?.startDate &&
    filters?.endDate
      ? getMonthsBetween(
          filters.startDate,
          filters.endDate
        )
      : getLast12Months();

  const formattedData = months.map((m) => {
    const found = data.find(
      (d) => d.month === m.label
    );

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

  const selectedData =
    formattedData.find(
      (d) => d.month === selectedMonth
    );

  const getComplianceVariant = (
    score
  ) => {
    if (score > 90) return "default";
    if (score > 75) return "secondary";
    return "destructive";
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="rounded-2xl shadow-sm border">
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold">
                Attendance Analytics
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Monthly attendance &
                compliance trend
              </p>
            </div>

            <div className="w-full h-[340px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={formattedData}
                  onClick={handleClick}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip />
                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Attendance %"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="complianceScore"
                    name="Compliance %"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog
        open={!!selectedMonth}
        onOpenChange={() =>
          setSelectedMonth(null)
        }
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMonth} Details
            </DialogTitle>
          </DialogHeader>

          {selectedData && (
            <div className="space-y-3 text-sm mt-3">
              <div className="flex justify-between">
                <span>Attendance</span>
                <span>
                  {
                    selectedData.attendance
                  }
                  %
                </span>
              </div>

              <div className="flex justify-between">
                <span>Total Days</span>
                <span>
                  {
                    selectedData.totalDays
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span>Present</span>
                <span>
                  {
                    selectedData.presentDays
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span>Late Marks</span>
                <span>
                  {
                    selectedData.lateMarks
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span>Leaves</span>
                <span>
                  {
                    selectedData.leavesTaken
                  }
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>
                  Compliance
                </span>

                <Badge
                  variant={getComplianceVariant(
                    selectedData.complianceScore
                  )}
                >
                  {
                    selectedData.complianceScore
                  }
                  %
                </Badge>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    setSelectedMonth(
                      null
                    )
                  }
                >
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