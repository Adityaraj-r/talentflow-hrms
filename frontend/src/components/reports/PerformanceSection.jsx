// import FiltersSection from "@/components/reports/FiltersSection";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
//   TableCell,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";

// export default function PerformanceSection({
//   hook,
//   filters,
//   setFilters,
// }) {
//   const { data, pagination, loading, error } = hook;

//   return (
//     <div className="space-y-6">
//       <h2 className="text-2xl font-semibold">
//         Employee Performance
//       </h2>

//       <FiltersSection
//         filters={filters}
//         setFilters={setFilters}
//       />

//       <div className="rounded-lg border bg-card p-4">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Name</TableHead>
//               <TableHead>Department</TableHead>
//               <TableHead>Attendance %</TableHead>
//               <TableHead>Leaves</TableHead>
//               <TableHead>Late</TableHead>
//               <TableHead>Compliance</TableHead>
//               <TableHead>Score</TableHead>
//               <TableHead>Grade</TableHead>
//             </TableRow>
//           </TableHeader>

//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={8} className="text-center">
//                   Loading...
//                 </TableCell>
//               </TableRow>
//             ) : error ? (
//               <TableRow>
//                 <TableCell colSpan={8} className="text-center text-red-500">
//                   {error}
//                 </TableCell>
//               </TableRow>
//             ) : data.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={8} className="text-center">
//                   No employee performance data found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               data.map((emp) => (
//                 <TableRow key={emp._id}>
//                   <TableCell>
//                     {emp.firstName} {emp.lastName}
//                   </TableCell>
//                   <TableCell>{emp.department}</TableCell>
//                   <TableCell>{emp.attendance}%</TableCell>
//                   <TableCell>{emp.leaves}</TableCell>
//                   <TableCell>{emp.lateMarks}</TableCell>
//                   <TableCell>{emp.compliance}%</TableCell>
//                   <TableCell>{emp.performanceScore}</TableCell>
//                   <TableCell>{emp.grade}</TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>

//         <div className="flex justify-end items-center gap-4 mt-4">
//           <Button
//             variant="outline"
//             disabled={!pagination || filters.page <= 1}
//             onClick={() =>
//               setFilters((prev) => ({
//                 ...prev,
//                 page: prev.page - 1,
//               }))
//             }
//           >
//             Previous
//           </Button>

//           <span>
//             Page {pagination?.page || 1} of{" "}
//             {pagination?.pages || 1}
//           </span>

//           <Button
//             variant="outline"
//             disabled={
//               !pagination || filters.page >= pagination.pages
//             }
//             onClick={() =>
//               setFilters((prev) => ({
//                 ...prev,
//                 page: prev.page + 1,
//               }))
//             }
//           >
//             Next
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

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
  const { data = [], pagination, loading, error } = hook;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold">
          Employee Performance
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Performance analytics based on selected filters
        </p>
      </div>

      {/* Filters */}
      <FiltersSection
        filters={filters}
        setFilters={setFilters}
      />

      {/* Table Card */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-6">

          <div className="overflow-x-auto">
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
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-red-500"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground"
                    >
                      No employee performance data found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((emp) => (
                    <TableRow key={emp._id}>
                      <TableCell className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>{emp.attendance}%</TableCell>
                      <TableCell>{emp.leaves}</TableCell>
                      <TableCell>{emp.lateMarks}</TableCell>
                      <TableCell>{emp.compliance}%</TableCell>
                      <TableCell>{emp.performanceScore}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            emp.grade === "A"
                              ? "bg-emerald-100 text-emerald-600"
                              : emp.grade === "B"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {emp.grade}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-4">
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

            <span className="text-sm text-muted-foreground">
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

        </CardContent>
      </Card>
    </div>
  );
}