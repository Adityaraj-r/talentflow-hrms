import { useAuth } from "@/contexts/AuthContext";
import FiltersSection from "@/components/reports/FiltersSection";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceSection({
  hook,
  filters,
  setFilters,
}) {
  const { user } = useAuth();

  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || "";

  const isDept =
    role === "DEPARTMENT_MANAGER";

  const {
    data = [],
    pagination = {},
    loading = false,
    error = "",
  } = hook || {};

  // Debug: Log API response in console
  console.log("Employee Performance API Response:", data);

  return (
    <div className="space-y-5">

      {/* Heading */}
      <div>
        <h2 className="text-2xl font-bold">
          {isDept
            ? "My Department Performance"
            : "Employee Performance"}
        </h2>

        <p className="text-sm text-muted-foreground mt-1">
          Performance analytics based on selected filters
        </p>
      </div>

      {/* Filters only for non department manager */}
      {!isDept && (
        <FiltersSection
          filters={filters}
          setFilters={setFilters}
        />
      )}

      {/* Table Card */}
      <Card className="rounded-2xl shadow-sm border">
        <CardContent className="p-5">

          <div className="overflow-x-auto rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Leaves</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>

                {/* Loading */}
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(9)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : error ? (

                  /* Error */
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-red-500 py-10"
                    >
                      {error}
                    </TableCell>
                  </TableRow>

                ) : data.length === 0 ? (

                  /* Empty */
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground py-12"
                    >
                      {isDept
                        ? "No team performance records available."
                        : "No employee performance records available."}
                    </TableCell>
                  </TableRow>

                ) : (

                  /* Data Rows */
                  data.map((emp, index) => (
                    <TableRow
                      key={emp?._id || index}
                    >
                      <TableCell className="font-medium">
                        {emp?.firstName || "-"} {emp?.lastName || ""}
                      </TableCell>

                      <TableCell>
                        {emp?.department || "-"}
                      </TableCell>

                      <TableCell>
                        <span className="capitalize">{emp?.role ? emp.role.replace(/_/g, ' ').toLowerCase() : "-"}</span>
                      </TableCell>

                      <TableCell>
                        {emp?.attendance}%
                      </TableCell>

                      <TableCell>
                        {emp?.leaves}
                      </TableCell>

                      <TableCell>
                        {emp?.lateMarks}
                      </TableCell>

                      <TableCell>
                        {emp?.compliance}%
                      </TableCell>

                      <TableCell>
                        {emp?.performanceScore}
                      </TableCell>

                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100">
                          {emp?.grade || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))

                )}

              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-3 mt-5">

            <Button
              variant="outline"
              disabled={
                !pagination ||
                (filters?.page || 1) <= 1
              }
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev?.page || 1) - 1,
                }))
              }
            >
              Previous
            </Button>

            <Button
              variant="outline"
              disabled={
                !pagination ||
                (filters?.page || 1) >=
                  (pagination?.pages || 1)
              }
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: (prev?.page || 1) + 1,
                }))
              }
            >
              Next
            </Button>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}