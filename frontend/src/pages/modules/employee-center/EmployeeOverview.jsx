import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, TrendingUp, TrendingDown, Minus, Award, Users } from "lucide-react";

// Mock employee performance data
const mockEmployeeData = [
  { id: 1, name: "Sarah Johnson", email: "sarah.j@company.com", department: "Engineering", position: "Senior Developer", avgRating: 4.9, totalReviews: 4, lastReview: "2026-01-15", trend: "up", status: "outstanding" },
  { id: 2, name: "Michael Chen", email: "michael.c@company.com", department: "Sales", position: "Sales Manager", avgRating: 4.8, totalReviews: 5, lastReview: "2026-01-18", trend: "up", status: "outstanding" },
  { id: 3, name: "Emily Brown", email: "emily.b@company.com", department: "Marketing", position: "Marketing Lead", avgRating: 4.7, totalReviews: 4, lastReview: "2026-01-20", trend: "stable", status: "outstanding" },
  { id: 4, name: "David Wilson", email: "david.w@company.com", department: "HR", position: "HR Specialist", avgRating: 4.7, totalReviews: 3, lastReview: "2026-01-12", trend: "up", status: "outstanding" },
  { id: 5, name: "Lisa Anderson", email: "lisa.a@company.com", department: "Finance", position: "Finance Analyst", avgRating: 4.6, totalReviews: 4, lastReview: "2026-01-22", trend: "stable", status: "outstanding" },
  { id: 6, name: "James Taylor", email: "james.t@company.com", department: "Engineering", position: "Backend Developer", avgRating: 4.3, totalReviews: 3, lastReview: "2026-01-10", trend: "up", status: "exceeds" },
  { id: 7, name: "Jennifer Lee", email: "jennifer.l@company.com", department: "Operations", position: "Operations Manager", avgRating: 4.2, totalReviews: 5, lastReview: "2026-01-25", trend: "stable", status: "exceeds" },
  { id: 8, name: "Robert Martinez", email: "robert.m@company.com", department: "Sales", position: "Sales Representative", avgRating: 4.1, totalReviews: 4, lastReview: "2026-01-14", trend: "down", status: "exceeds" },
  { id: 9, name: "Amanda White", email: "amanda.w@company.com", department: "Marketing", position: "Content Strategist", avgRating: 3.9, totalReviews: 3, lastReview: "2026-01-19", trend: "stable", status: "meets" },
  { id: 10, name: "Christopher Garcia", email: "chris.g@company.com", department: "Engineering", position: "Frontend Developer", avgRating: 3.8, totalReviews: 4, lastReview: "2026-01-11", trend: "up", status: "meets" },
  { id: 11, name: "Jessica Davis", email: "jessica.d@company.com", department: "Finance", position: "Accountant", avgRating: 3.7, totalReviews: 3, lastReview: "2026-01-16", trend: "stable", status: "meets" },
  { id: 12, name: "Daniel Rodriguez", email: "daniel.r@company.com", department: "Operations", position: "Operations Coordinator", avgRating: 3.5, totalReviews: 4, lastReview: "2026-01-21", trend: "down", status: "meets" },
  { id: 13, name: "Michelle Thomas", email: "michelle.t@company.com", department: "HR", position: "Recruiter", avgRating: 2.8, totalReviews: 3, lastReview: "2026-01-13", trend: "down", status: "below" },
  { id: 14, name: "Kevin Moore", email: "kevin.m@company.com", department: "Sales", position: "Sales Associate", avgRating: 2.5, totalReviews: 4, lastReview: "2026-01-17", trend: "down", status: "below" },
];

const EmployeeOverview = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating-desc");

  // Get unique departments
  const departments = ["all", ...new Set(mockEmployeeData.map(emp => emp.department))];

  // Filter and sort employees
  const filteredEmployees = mockEmployeeData
    .filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter;
      const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case "rating-desc": return b.avgRating - a.avgRating;
        case "rating-asc": return a.avgRating - b.avgRating;
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "reviews-desc": return b.totalReviews - a.totalReviews;
        default: return 0;
      }
    });

  // Calculate statistics
  const topPerformers = mockEmployeeData.filter(emp => emp.avgRating >= 4.5).length;
  const needsImprovement = mockEmployeeData.filter(emp => emp.avgRating < 3.0).length;
  const avgRating = (mockEmployeeData.reduce((sum, emp) => sum + emp.avgRating, 0) / mockEmployeeData.length).toFixed(2);

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
    // Simple CSV export
    const headers = ["Name", "Email", "Department", "Position", "Avg Rating", "Total Reviews", "Last Review", "Status"];
    const rows = filteredEmployees.map(emp => [
      emp.name,
      emp.email,
      emp.department,
      emp.position,
      emp.avgRating,
      emp.totalReviews,
      emp.lastReview,
      emp.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employee-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Performers</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{topPerformers}</div>
            <p className="text-xs text-muted-foreground mt-1">Rating ≥ 4.5</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{mockEmployeeData.length}</div>
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

      {/* Filters and Search */}
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
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>
                    {dept === "all" ? "All Departments" : dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="outstanding">Outstanding</SelectItem>
                <SelectItem value="exceeds">Exceeds</SelectItem>
                <SelectItem value="meets">Meets</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
                <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="reviews-desc">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              Showing {filteredEmployees.length} of {mockEmployeeData.length} employees
            </span>
          </div>

          {/* Employee Table */}
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">Last Review</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      No employees found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.position}</td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-orange-600">{employee.avgRating}/5</span>
                      </td>
                      <td className="px-6 py-4">
                        {getTrendIcon(employee.trend)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{employee.totalReviews}</td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusBadge(employee.status)}>
                          {employee.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(employee.lastReview).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
