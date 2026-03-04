// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import { Search } from "lucide-react";

// export default function FiltersSection({ filters, setFilters }) {
//   const departments = [
//     "all",
//     "HR",
//     "Finance",
//     "IT",
//     "Marketing",
//     "Operations",
//   ];

//   const roles = [
//     "all",
//     "CEO",
//     "COUNTRY_MANAGER",
//     "HR_MANAGER",
//     "HR_OFFICER",
//     "DEPARTMENT_MANAGER",
//     "DIRECT_MANAGER",
//     "PAYROLL_OFFICER",
//     "PROJECT_MANAGER",
//     "OPERATIONS_MANAGER",
//     "ADMIN",
//     "EMPLOYEE",
//   ];

//   return (
//     <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center justify-between">

//       {/* LEFT FILTERS */}
//       <div className="flex flex-wrap gap-4">

//         {/* Department */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="outline">
//               {filters.department === "all"
//                 ? "All Departments"
//                 : filters.department}
//             </Button>
//           </DropdownMenuTrigger>

//           <DropdownMenuContent>
//             {departments.map((dep) => (
//               <DropdownMenuItem
//                 key={dep}
//                 onClick={() =>
//                   setFilters({ ...filters, department: dep, page: 1 })
//                 }
//               >
//                 {dep === "all" ? "All Departments" : dep}
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>

//         {/* Role */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="outline">
//               {filters.role === "all"
//                 ? "All Roles"
//                 : filters.role}
//             </Button>
//           </DropdownMenuTrigger>

//           <DropdownMenuContent className="max-h-60 overflow-y-auto">
//             {roles.map((role) => (
//               <DropdownMenuItem
//                 key={role}
//                 onClick={() =>
//                   setFilters({ ...filters, role, page: 1 })
//                 }
//               >
//                 {role === "all" ? "All Roles" : role}
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* SEARCH */}
//       <div className="relative w-full md:w-72">
//         <Search
//           size={16}
//           className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//         />
//         <Input
//           type="text"
//           placeholder="Search employee..."
//           value={filters.search}
//           onChange={(e) =>
//             setFilters({
//               ...filters,
//               search: e.target.value,
//               page: 1,
//             })
//           }
//           className="pl-9"
//         />
//       </div>
//     </div>
//   );
// }

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export default function FiltersSection({ filters, setFilters }) {
  const departments = [
    "all",
    "HR",
    "Finance",
    "IT",
    "Marketing",
    "Operations",
  ];

  const roles = [
    "all",
    "CEO",
    "COUNTRY_MANAGER",
    "HR_MANAGER",
    "HR_OFFICER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
    "PAYROLL_OFFICER",
    "PROJECT_MANAGER",
    "OPERATIONS_MANAGER",
    "ADMIN",
    "EMPLOYEE",
  ];

  return (
    <Card className="rounded-2xl shadow-sm mb-6">
      <CardContent className="p-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

        {/* LEFT FILTERS */}
        <div className="flex flex-wrap gap-6">

          {/* Department */}
          <div className="flex flex-col gap-2 w-52">
            <Label>Department</Label>
            <Select
              value={filters.department}
              onValueChange={(value) =>
                setFilters({ ...filters, department: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>

              <SelectContent>
                {departments.map((dep) => (
                  <SelectItem key={dep} value={dep}>
                    {dep === "all" ? "All Departments" : dep}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="flex flex-col gap-2 w-60">
            <Label>Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) =>
                setFilters({ ...filters, role: value, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>

              <SelectContent className="max-h-60 overflow-y-auto">
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "all" ? "All Roles" : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SEARCH */}
        <div className="relative w-full md:w-72">
          <Label className="mb-2 block">Search</Label>
          <Search
            size={16}
            className="absolute left-3 top-[38px] text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Search employee..."
            value={filters.search}
            onChange={(e) =>
              setFilters({
                ...filters,
                search: e.target.value,
                page: 1,
              })
            }
            className="pl-9"
          />
        </div>

      </CardContent>
    </Card>
  );
}