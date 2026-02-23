import FiltersSection from "@/pages/reports/FiltersSection";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function PerformanceSection({
  hook,
  filters,
  setFilters,
}) {
  const { data, pagination, loading, error } = hook;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">
        Employee Performance
      </h2>

      <FiltersSection
        filters={filters}
        setFilters={setFilters}
      />

      <div className="rounded-lg border bg-card p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Attendance %</TableHead>
              <TableHead>Leaves</TableHead>
              <TableHead>Late</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No employee performance data found
                </TableCell>
              </TableRow>
            ) : (
              data.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>
                    {emp.firstName} {emp.lastName}
                  </TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell>{emp.attendance}%</TableCell>
                  <TableCell>{emp.leaves}</TableCell>
                  <TableCell>{emp.lateMarks}</TableCell>
                  <TableCell>{emp.compliance}%</TableCell>
                  <TableCell>{emp.performanceScore}</TableCell>
                  <TableCell>{emp.grade}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex justify-end items-center gap-4 mt-4">
          <Button
            variant="outline"
            disabled={!pagination || filters.page <= 1}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: prev.page - 1,
              }))
            }
          >
            Previous
          </Button>

          <span>
            Page {pagination?.page || 1} of{" "}
            {pagination?.pages || 1}
          </span>

          <Button
            variant="outline"
            disabled={
              !pagination || filters.page >= pagination.pages
            }
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                page: prev.page + 1,
              }))
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}