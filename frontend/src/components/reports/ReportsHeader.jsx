import { exportPDF, exportExcel } from "../../utils/exportUtils";
import { useSummary } from "../../hooks/useReports";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";


export default function ReportsHeader({ filters, setFilters }) {

  
  const { data } = useSummary(filters);
  const [quickFilter, setQuickFilter] = useState("last12");
  const handleQuickFilter = useCallback((value) => {
    setQuickFilter(value);

    const today = new Date();
    let startDate = null;

    switch (value) {
      case "last3":
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 3);
        break;

      case "last6":
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 6);
        break;

      case "last12":
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 12);
        break;

      case "thisYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        break;

      default:
        startDate = null;
    }

    if (startDate) {
      setFilters((prev) => ({
        ...prev,
        startDate: startDate.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
      }));
    }
  }, [setFilters]);

  // Set default on first load
  useEffect(() => {
    handleQuickFilter("last12");
  }, [handleQuickFilter]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      {/* Filters Section */}
      <div className="flex gap-4 flex-wrap items-center">

        {/* Quick Filter */}
        <Select
            value={quickFilter}
            onValueChange={(value) => handleQuickFilter(value)}
          >
            <SelectTrigger className="w-[200px] rounded-md">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="last12">Last 12 Months</SelectItem>
              <SelectItem value="last6">Last 6 Months</SelectItem>
              <SelectItem value="last3">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

        {/* Custom Range */}
        {quickFilter === "custom" && (
          <>
            <input
              type="date"
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="
                bg-white dark:bg-slate-900
                border border-gray-300 dark:border-slate-700
                rounded-lg px-3 py-2
                text-gray-900 dark:text-white
              "
            />

            <input
              type="date"
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="
                bg-white dark:bg-slate-900
                border border-gray-300 dark:border-slate-700
                rounded-lg px-3 py-2
                text-gray-900 dark:text-white
              "
            />
          </>
        )}

        {/* Department */}
        <Select
            value={filters.department}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                department: value,
              }))
            }
          >
            <SelectTrigger className="w-[200px] rounded-md">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>


      </div>

          <div className="flex gap-3">

  {/* Primary Button */}
  <div className="flex gap-3">

  <Button variant="outline" onClick={() => exportPDF(filters)}>
    Export PDF
  </Button>

  <Button onClick={() => exportExcel(data, filters)}>
    Export Excel
  </Button>

</div>


</div>


    </div>
  );
}
