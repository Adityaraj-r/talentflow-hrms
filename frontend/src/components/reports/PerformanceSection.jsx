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
import { Pagination } from "@/components/ui/pagination";

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
        <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
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

          <div className="w-full">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[20%]">Employee</TableHead>
                  <TableHead className="w-[12%]">Employee ID</TableHead>
                  <TableHead className="w-[14%]">Department</TableHead>
                  <TableHead className="w-[12%]">Role</TableHead>
                  <TableHead className="w-[9%] text-center">Attendance</TableHead>
                  <TableHead className="w-[7%] text-center">Leaves</TableHead>
                  <TableHead className="w-[7%] text-center">Late</TableHead>
                  <TableHead className="w-[10%] text-center">Compliance</TableHead>
                  <TableHead className="w-[7%] text-center">Score</TableHead>
                  <TableHead className="w-[7%] text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>

                {/* Loading */}
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(10)].map((_, j) => (
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
                      colSpan={10}
                      className="text-center text-red-500 py-10"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  /* Empty */
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center text-muted-foreground py-12"
                    >
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  /* Data Rows */
                  data.map((emp, index) => (
                    <TableRow key={emp?._id || index}>
                      <TableCell className="font-medium truncate">
                        {emp?.firstName || "-"} {emp?.lastName || ""}
                      </TableCell>

                      <TableCell className="text-muted-foreground truncate">
                        {emp?.employeeCode || `EMP${String(index + 1).padStart(3, '0')}`}
                      </TableCell>

                      <TableCell className="truncate">
                        {emp?.department || "-"}
                      </TableCell>

                      <TableCell className="truncate">
                        <span className="capitalize">{emp?.role ? emp.role.replace(/_/g, ' ').toLowerCase() : "-"}</span>
                      </TableCell>

                      <TableCell className="text-center">
                        {emp?.attendance}%
                      </TableCell>

                      <TableCell className="text-center">
                        {emp?.leaves}
                      </TableCell>

                      <TableCell className="text-center">
                        {emp?.lateMarks}
                      </TableCell>

                      <TableCell className="text-center">
                        {emp?.compliance}%
                      </TableCell>

                      <TableCell className="text-center">
                        {emp?.performanceScore}
                      </TableCell>

                      <TableCell className="text-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800">
                          {emp?.grade || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <Pagination
              currentPage={pagination?.page || 1}
              totalPages={pagination?.pages || 1}
              totalItems={pagination?.total || 0}
              itemsPerPage={10}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}