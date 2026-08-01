import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, TrendingUp, TrendingDown, Minus, Award, Users } from "lucide-react";
import apiClient from "@/services/apiClient";
import { FileText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EmployeeOverview = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const employees = await apiClient.get('/performance/employee-overview');

        const users = employees.filter(user => user.role !== 'admin');
        setEmployeeData(users.map(user => ({
          id: user.employeeId,
          name: user.name || user.email?.split('@')[0],
          email: user.email,
          department: user.department || 'General',
          position: user.position || 'Employee',
          avgRating: user.avgRating || 0,
          totalReviews: user.totalReviews || 0,
          lastReview: user.lastReview || 'Never',
          trend: 'stable',
          status: getStatusFromRating(user.avgRating || 0)
        })));
      } catch (error) {
        console.error("Employee overview fetch failed:", error);
        setEmployeeData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const getStatusFromRating = (rating) => {
    if (rating >= 4.5) return 'outstanding';
    if (rating >= 4.0) return 'exceeds';
    if (rating >= 3.0) return 'meets';
    return 'below';
  };

  const departments = ["all", ...new Set(employeeData.map(emp => emp.department))];

  const filteredEmployees = employeeData
    .filter(emp => {
      const matchesSearch =
        (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.position || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch &&
        (departmentFilter === "all" || emp.department === departmentFilter) &&
        (statusFilter === "all" || emp.status === statusFilter);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating-desc": return (b.avgRating || 0) - (a.avgRating || 0);
        case "rating-asc": return (a.avgRating || 0) - (b.avgRating || 0);
        case "name-asc": return (a.name || "").localeCompare(b.name || "");
        case "name-desc": return (b.name || "").localeCompare(a.name || "");
        case "reviews-desc": return (b.totalReviews || 0) - (a.totalReviews || 0);
        default: return 0;
      }
    });

  const topPerformers = employeeData.filter(emp => (emp.avgRating || 0) >= 4.5).length;
  const needsImprovement = employeeData.filter(emp => (emp.avgRating || 0) < 3.0).length;

  const getStatusBadge = (status) => {
    const styles = {
      outstanding: "bg-green-100 text-green-800 border-green-300",
      exceeds: "bg-blue-100 text-blue-800 border-blue-300",
      meets: "bg-yellow-100 text-yellow-800 border-yellow-300",
      below: "bg-red-100 text-red-800 border-red-300"
    };
    return styles[status] || styles.meets;
  };

  const getTrendIcon = (trend) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const handleExport = () => {
    const headers = ["Name", "Email", "Department", "Position", "Avg Rating", "Reviews", "Status"];
    const rows = filteredEmployees.map(emp => [
      emp.name, emp.email, emp.department, emp.position,
      (emp.avgRating || 0).toFixed(1), emp.totalReviews, emp.status
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees-${Date.now()}.csv`;
    link.click();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading employees...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Award className="w-16 h-16 text-green-600" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col gap-4">
            <div className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg w-fit">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{topPerformers}</div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Top Performers</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rating &gt;= 4.5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col gap-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{employeeData.length}</div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Total Employees</p>
              <p className="text-xs text-muted-foreground mt-0.5">Across all departments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown className="w-16 h-16 text-red-600" />
          </div>
          <CardContent className="p-6 relative z-10 flex flex-col gap-4">
            <div className="p-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg w-fit">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">{needsImprovement}</div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Needs Improvement</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rating &lt; 3.0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
        <CardHeader className="bg-muted/20 border-b border-border/50 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">All Employees Performance</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Detailed performance metrics across the organization</p>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="bg-background shadow-sm h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          <div className="p-6 border-b border-border/50 bg-background/50">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, email, position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-background shadow-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 flex-wrap md:flex-nowrap">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] h-10 shadow-sm"><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 shadow-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="exceeds">Exceeds</SelectItem>
                    <SelectItem value="meets">Meets</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 mt-2 border-t border-border/30">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-8 text-xs bg-muted/30 border-transparent hover:bg-muted/50 transition-colors"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating-desc">Rating High-Low</SelectItem>
                  <SelectItem value="rating-asc">Rating Low-High</SelectItem>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="reviews-desc">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm font-medium text-muted-foreground ml-auto bg-muted/40 px-3 py-1 rounded-full">
                {filteredEmployees.length} of {employeeData.length}
              </span>
            </div>
          </div>

          <div className="overflow-auto custom-scrollbar relative max-h-[600px]">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Avg Rating</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Trend</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Reviews</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground bg-background">
                      No employees found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="group hover:bg-blue-600/5 dark:hover:bg-blue-500/10 transition-colors bg-background">
                      <td className="px-6 py-4 border-b border-border/50 align-middle">
                        <div className="font-semibold text-sm text-foreground">{employee.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-border/50 text-sm text-muted-foreground align-middle">{employee.department}</td>
                      <td className="px-6 py-4 border-b border-border/50 text-sm text-muted-foreground align-middle">{employee.position}</td>
                      <td className="px-6 py-4 border-b border-border/50 align-middle text-center">
                        <span className="text-lg font-bold text-orange-600 dark:text-orange-500">
                          {(employee.avgRating || 0).toFixed(1)}<span className="text-xs font-medium text-muted-foreground">/5</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-border/50 align-middle text-center">
                        <div className="flex justify-center">{getTrendIcon(employee.trend)}</div>
                      </td>
                      <td className="px-6 py-4 border-b border-border/50 text-sm text-muted-foreground align-middle text-center">{employee.totalReviews}</td>
                      <td className="px-6 py-4 border-b border-border/50 align-middle text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border ${getStatusBadge(employee.status)}`}>
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-border/50 text-right align-middle whitespace-nowrap">
                      <Button   variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setIsDetailsOpen(true);
    }}
  >
    <FileText className="h-4 w-4" />
  </Button>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>Employee Performance Details</DialogTitle>
    </DialogHeader>

    {selectedEmployee && (
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">Name</span>
          <span>{selectedEmployee.name}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Email</span>
          <span>{selectedEmployee.email}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Department</span>
          <span>{selectedEmployee.department}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Position</span>
          <span>{selectedEmployee.position}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Average Rating</span>
          <span>{selectedEmployee.avgRating.toFixed(1)}/5</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Total Reviews</span>
          <span>{selectedEmployee.totalReviews}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Status</span>
          <Badge className={getStatusBadge(selectedEmployee.status)}>
            {selectedEmployee.status}
          </Badge>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
    </div>
  );
};

export default EmployeeOverview;
