import { exportPDF, exportExcel } from "@/utils/exportUtils";
import { useSummary } from "@/hooks/useReports";
import { useState, useEffect, useCallback } from "react";

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
        <select
          value={quickFilter}
          onChange={(e) => handleQuickFilter(e.target.value)}
          className="
            bg-white dark:bg-slate-900
            border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-indigo-500
          "
        >
          <option value="last12">Last 12 Months</option>
          <option value="last6">Last 6 Months</option>
          <option value="last3">Last 3 Months</option>
          <option value="thisYear">This Year</option>
          <option value="custom">Custom Range</option>
        </select>

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
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              department: e.target.value,
            }))
          }
          className="
            bg-white dark:bg-slate-900
            border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-indigo-500
          "
        >
          <option value="all">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Sales">Sales</option>
          <option value="Marketing">Marketing</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
        </select>

      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => exportPDF(filters)}
          className="
            bg-indigo-600 hover:bg-indigo-700
            text-white px-4 py-2
            rounded-lg shadow-sm hover:shadow-md
            transition-all duration-200
          "
        >
          Export PDF
        </button>

        <button
          onClick={() => exportExcel(data, filters)}
          className="
            bg-emerald-600 hover:bg-emerald-700
            text-white px-4 py-2
            rounded-lg shadow-sm hover:shadow-md
            transition-all duration-200
          "
        >
          Export Excel
        </button>
      </div>

    </div>
  );
}
