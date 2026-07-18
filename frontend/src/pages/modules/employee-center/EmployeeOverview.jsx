import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, TrendingUp, TrendingDown, Minus, Award, Users } from "lucide-react";
import apiClient from "@/services/apiClient";

const EmployeeOverview = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Performers</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{topPerformers}</div>
            <p className="text-xs text-muted-foreground mt-1">Rating &gt;= 4.5</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{employeeData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all departments</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Needs Improvement</span>
            </div>
            <div className="text-3xl font-bold text-red-500">{needsImprovement}</div>
            <p className="text-xs text-muted-foreground mt-1">Rating &lt; 3.0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>All Employees Performance</CardTitle>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="exceeds">Exceeds</SelectItem>
                <SelectItem value="meets">Meets</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rating-desc">Rating High-Low</SelectItem>
                <SelectItem value="rating-asc">Rating Low-High</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="reviews-desc">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredEmployees.length} of {employeeData.length} employees
            </span>
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Avg Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Trend</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reviews</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.position}</td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-orange-600">
                          {(employee.avgRating || 0).toFixed(1)}/5
                        </span>
                      </td>
                      <td className="px-6 py-4">{getTrendIcon(employee.trend)}</td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.totalReviews}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadge(employee.status)}>
                          {employee.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View Details
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
    </div>
  );
};

export default EmployeeOverview;
