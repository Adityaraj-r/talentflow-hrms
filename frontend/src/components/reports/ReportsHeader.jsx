// import { useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectTrigger,
//   SelectContent,
//   SelectItem,
//   SelectValue,
// } from "@/components/ui/select";

// export default function ReportsHeader({ filters, setFilters }) {
//   const departments = [
//     "Engineering",
//     "Sales",
//     "Marketing",
//     "HR",
//     "Finance",
//     "Operations",
//   ];

//   const roles = [
//     "CEO",
//     "Country Manager",
//     "HR Manager",
//     "HR Officer",
//     "Department Manager",
//     "Direct Manager",
//     "Payroll Officer",
//     "Project Manager",
//     "Operations Manager",
//     "Camp Boss",
//     "Admin",
//     "Employee",
//   ];

//   /* =========================
//      PRESET PERIOD HANDLER
//   ========================== */
//   useEffect(() => {
//     const today = new Date();
//     let start = new Date();

//     if (filters.period === "3m") {
//       start.setMonth(today.getMonth() - 3);
//     } else if (filters.period === "6m") {
//       start.setMonth(today.getMonth() - 6);
//     } else if (filters.period === "year") {
//       start = new Date(today.getFullYear(), 0, 1);
//     } else {
//       return; // custom → do nothing
//     }

//     setFilters((prev) => ({
//       ...prev,
//       startDate: start.toISOString().split("T")[0],
//       endDate: today.toISOString().split("T")[0],
//     }));
//   }, [filters.period]);

//   /* =========================
//      RESET FILTERS
//   ========================== */
//   const handleReset = () => {
//     setFilters({
//       period: "3m",
//       startDate: "",
//       endDate: "",
//       department: "all",
//       role: "all",
//     });
//   };

//   return (
//     <div className="flex flex-wrap gap-4 items-end">

//       {/* ======================
//           PERIOD
//       ======================= */}
//       <Select
//         value={filters.period}
//         onValueChange={(value) =>
//           setFilters((prev) => ({
//             ...prev,
//             period: value,
//           }))
//         }
//       >
//         <SelectTrigger className="w-[200px]">
//           <SelectValue placeholder="Select Period" />
//         </SelectTrigger>
//         <SelectContent>
//           <SelectItem value="3m">Last 3 Months</SelectItem>
//           <SelectItem value="6m">Last 6 Months</SelectItem>
//           <SelectItem value="year">This Year</SelectItem>
//           <SelectItem value="custom">Custom Range</SelectItem>
//         </SelectContent>
//       </Select>

//       {/* ======================
//           CUSTOM DATE RANGE
//       ======================= */}
//       {filters.period === "custom" && (
//         <>
//           <div className="flex flex-col">
//             <label className="text-sm text-muted-foreground mb-1">
//               From
//             </label>
//             <Input
//               type="date"
//               value={filters.startDate}
//               onChange={(e) =>
//                 setFilters((prev) => ({
//                   ...prev,
//                   startDate: e.target.value,
//                 }))
//               }
//               className="w-[180px]"
//             />
//           </div>

//           <div className="flex flex-col">
//             <label className="text-sm text-muted-foreground mb-1">
//               To
//             </label>
//             <Input
//               type="date"
//               value={filters.endDate}
//               onChange={(e) =>
//                 setFilters((prev) => ({
//                   ...prev,
//                   endDate: e.target.value,
//                 }))
//               }
//               className="w-[180px]"
//             />
//           </div>
//         </>
//       )}

//       {/* ======================
//           DEPARTMENT
//       ======================= */}
//       <Select
//         value={filters.department}
//         onValueChange={(value) =>
//           setFilters((prev) => ({
//             ...prev,
//             department: value,
//           }))
//         }
//       >
//         <SelectTrigger className="w-[200px]">
//           <SelectValue placeholder="All Departments" />
//         </SelectTrigger>

//         <SelectContent>
//           <SelectItem value="all">All Departments</SelectItem>
//           {departments.map((dept) => (
//             <SelectItem key={dept} value={dept}>
//               {dept}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>

//       {/* ======================
//           ROLE
//       ======================= */}
//       <Select
//         value={filters.role}
//         onValueChange={(value) =>
//           setFilters((prev) => ({
//             ...prev,
//             role: value,
//           }))
//         }
//       >
//         <SelectTrigger className="w-[200px]">
//           <SelectValue placeholder="All Roles" />
//         </SelectTrigger>

//         <SelectContent>
//           <SelectItem value="all">All Roles</SelectItem>
//           {roles.map((role) => (
//             <SelectItem key={role} value={role}>
//               {role}
//             </SelectItem>
//           ))}
//         </SelectContent>
//       </Select>

//       {/* ======================
//           RESET BUTTON
//       ======================= */}
//       <Button variant="secondary" onClick={handleReset}>
//         Reset
//       </Button>

//     </div>
//   );
// }

import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function ReportsHeader({ filters, setFilters }) {
  const departments = [
    "Engineering",
    "Sales",
    "Marketing",
    "HR",
    "Finance",
    "Operations",
  ];

  const roles = [
      { label: "All Roles", value: "all" },
      { label: "CEO", value: "CEO" },
      { label: "Country Manager", value: "COUNTRY_MANAGER" },
      { label: "HR Manager", value: "HR_MANAGER" },
      { label: "HR Officer", value: "HR_OFFICER" },
      { label: "Department Manager", value: "DEPARTMENT_MANAGER" },
      { label: "Direct Manager", value: "DIRECT_MANAGER" },
      { label: "Payroll Officer", value: "PAYROLL_OFFICER" },
      { label: "Project Manager", value: "PROJECT_MANAGER" },
      { label: "Operations Manager", value: "OPERATIONS_MANAGER" },
      { label: "Camp Boss", value: "CAMP_BOSS" },
      { label: "Admin", value: "ADMIN" },
      { label: "Employee", value: "EMPLOYEE" },
    ];

  /* =========================
     PRESET PERIOD HANDLER
  ========================== */
  useEffect(() => {
    const today = new Date();
    let start = new Date();

    if (filters.period === "3m") {
      start.setMonth(today.getMonth() - 3);
    } else if (filters.period === "6m") {
      start.setMonth(today.getMonth() - 6);
    } else if (filters.period === "year") {
      start = new Date(today.getFullYear(), 0, 1);
    } else {
      return; // custom → do nothing
    }

    setFilters((prev) => ({
      ...prev,
      startDate: start.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    }));
  }, [filters.period, setFilters]);

  /* =========================
     RESET FILTERS
  ========================== */
  const handleReset = () => {
    setFilters({
      period: "3m",
      startDate: "",
      endDate: "",
      department: "all",
      role: "all",
    });
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-6 items-end">

          {/* PERIOD */}
          <div className="flex flex-col gap-2 w-[200px]">
            <Label>Period</Label>
            <Select
              value={filters.period}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  period: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CUSTOM RANGE */}
          {filters.period === "custom" && (
            <>
              <div className="flex flex-col gap-2 w-[180px]">
                <Label>From</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-2 w-[180px]">
                <Label>To</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}

          {/* DEPARTMENT */}
          <div className="flex flex-col gap-2 w-[200px]">
            <Label>Department</Label>
            <Select
              value={filters.department}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  department: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ROLE */}
          <div className="flex flex-col gap-2 w-[200px]">
            <Label>Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  role: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="all"></SelectItem> */}
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* RESET */}
          <div className="flex items-end">
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}