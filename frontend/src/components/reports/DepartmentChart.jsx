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

            <div className="w-full min-h-[320px]">
              <ResponsiveContainer width="99%" height={320}>
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
                {selectedData.avgSalary?.toLocaleString() }
              </p>

              <p>
                Total Salary: ₹
                {selectedData.totalSalary?.toLocaleString() }
              </p>

              <p>
                Percentage:{" "}
                <Badge variant="outline">
                  {selectedData.percentage }%
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