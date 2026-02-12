import { exportPDF, exportExcel } from "../../utils/exportUtils";
import { useSummary } from "../../hooks/useReports";

export default function ReportsHeader({ filters, setFilters }) {
  const { data } = useSummary();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">

        <input
          type="date"
          className="
            bg-white dark:bg-slate-900
            border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2
            text-gray-900 dark:text-white
            focus:outline-none
            focus:ring-2 focus:ring-indigo-500
            transition
          "
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
        />

        <select
          className="
            bg-white dark:bg-slate-900
            border border-gray-300 dark:border-slate-700
            rounded-lg px-3 py-2
            text-gray-900 dark:text-white
            focus:outline-none
            focus:ring-2 focus:ring-indigo-500
            transition
          "
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, department: e.target.value }))
          }
        >
          <option value="all">All Departments</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">

        <button
          onClick={exportPDF}
          className="
            bg-indigo-600
            hover:bg-indigo-700
            text-white
            px-4 py-2
            rounded-lg
            shadow-sm
            hover:shadow-md
            transition-all duration-200
          "
        >
          Export PDF
        </button>

        <button
          onClick={() => exportExcel(data)}
          className="
            bg-emerald-600
            hover:bg-emerald-700
            text-white
            px-4 py-2
            rounded-lg
            shadow-sm
            hover:shadow-md
            transition-all duration-200
          "
        >
          Export Excel
        </button>

      </div>
    </div>
  );
}
