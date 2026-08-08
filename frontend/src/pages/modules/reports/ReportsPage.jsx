
import { useState, useEffect } from "react";
import api from "@/services/apiClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import DashboardSection from "@/components/reports/DashboardSection";
import ReportsHeader from "@/components/reports/ReportsHeader";

import useReports from "@/hooks/useReports";
import useEmployeePerformance from "@/hooks/useEmployeePerformance";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ReportsPage() {
  const { user } = useAuth();

  const role =
    typeof user?.role === "string"
      ? user.role
      : user?.role?.name || "";

  const isDept =
    role === "DEPARTMENT_MANAGER";

  const canExport = [
    "ADMIN",
    "CEO",
    "HR_MANAGER",
  ].includes(role);

  const showPerformance = [
    "CEO",
    "ADMIN",
    "HR_MANAGER",
    "DEPARTMENT_MANAGER",
    "DIRECT_MANAGER",
  ].includes(role);

  const [filters, setFilters] =
    useState({
      period: "3m",
      startDate: "",
      endDate: "",
      department: "all",
      role: "all",
    });

  const [
    performanceFilters,
    setPerformanceFilters,
  ] = useState({
    role: "all",
    department: "all",
    search: "",
    page: 1,
    limit: 10,
  });

  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
  } = useReports(filters);

  const performanceHook =
    useEmployeePerformance(
      performanceFilters
    );

  useEffect(() => {
    if (isDept) {
      setFilters((prev) => ({
        ...prev,
        department: "all",
        role: "all",
      }));
    }
  }, [isDept]);

  useEffect(() => {
    setPerformanceFilters(
      (prev) => ({
        ...prev,
        role: filters.role,
        department: filters.department,
        search: filters.search || "",
        page: 1,
      })
    );
  }, [
    filters.role,
    filters.department,
    filters.search,
  ]);

  const [
    productivityData,
    setProductivityData,
  ] = useState(null);

  useEffect(() => {
    if (role ==="OPERATIONS_MANAGER") {
      api
        .get(
          "/reports/productivity",
          {
            params: filters,
          }
        )
        .then((res) =>
          setProductivityData(
            res.data
          )
        )
        .catch(
          console.error
        );
    }
  }, [filters, role]);



  const handleExportCSV =
    async () => {
      const res =
        await api.get(
          "/reports/export",
          {
            params: filters,
          }
        );

      const rows = res.data?.data ||
        [];

      if (!rows.length)
        return;

      const headers =
        Object.keys(
          rows[0]
        );

      const csv = [
        headers.join(","),
        ...rows.map(
          (row) =>
            headers
              .map(
                (h) =>
                  `"${row[h]}"`
              )
              .join(",")
        ),
      ].join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type: "text/csv",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          "a"
        );

      a.href = url;
      a.download =
        "HRMS_Report.csv";
      a.click();
    };

  const handleExportPDF =
    async () => {
      const res =
        await api.get(
          "/reports/export",
          {
            params: filters,
          }
        );

      const rows =
        res.data?.data ||
        [];

      if (!rows.length)
        return;

      const doc =
        new jsPDF();

      doc.setFontSize(16);

      doc.text(
        "HRMS Report",
        14,
        15
      );

      autoTable(doc, {
        head: [
          Object.keys(
            rows[0]
          ),
        ],
        body: rows.map(
          (r) =>
            Object.values(
              r
            )
        ),
        startY: 22,
      });

      doc.save(
        "HRMS_Report.pdf"
      );
    };

  return (
    <div className="p-6 space-y-6">

      <ReportsHeader
        filters={filters}
        setFilters={
          setFilters
        }
      />

      <DashboardSection
        data={reportsData}
        loading={reportsLoading}
        error={reportsError}
        filters={filters}
        setFilters={setFilters}
        performanceFilters={performanceFilters}
        setPerformanceFilters={setPerformanceFilters}
        performanceHook={performanceHook}
      />

      {role ===
        "OPERATIONS_MANAGER" &&
        productivityData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

            {[
              {
                label:"Avg Working Hours",
                value:productivityData.avgWorkingHours,
              },
              {
                label:"Break Hours",
                value: productivityData.avgBreakHours,
              },
              {
                label:"Efficiency",
                value: `${productivityData.efficiency}%`,
              },
              {
                label:"Productivity",
                value: `${productivityData.productivity}%`,
              },
            ].map(
              (
                item,i
              ) => (
                <Card
                  key={i}
                  className="rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group h-full bg-card cursor-pointer"
                >
                  <CardContent className="p-6 relative z-10 flex flex-col h-full justify-between gap-4">
                    <div>
                      <h3 className="text-3xl font-bold text-foreground">
                        {
                          item.value
                        }
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground mt-1">
                        {
                          item.label
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}

          </div>
        )}



    </div>
  );
}