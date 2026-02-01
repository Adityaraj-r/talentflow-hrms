import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Calendar, Users, FileText, TrendingUp, Edit, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const ViewCycleDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cycle = location.state?.cycle;

  if (!cycle) {
    return (
      <div className="p-6">
        <p>No cycle data found. Please go back.</p>
        <Button onClick={() => navigate("/role/admin/appraisal")}>Go Back</Button>
      </div>
    );
  }

  // Mock assigned employees
  const assignedEmployees = [
    { id: 1, name: "John Doe", department: "IT", position: "Developer", status: "completed", rating: 4.5, reviewDate: "2025-11-15" },
    { id: 2, name: "Jane Smith", department: "HR", position: "HR Manager", status: "completed", rating: 4.2, reviewDate: "2025-11-20" },
    { id: 3, name: "Mike Johnson", department: "Sales", position: "Sales Executive", status: "pending", rating: null, reviewDate: null },
    { id: 4, name: "Sarah Williams", department: "Marketing", position: "Marketing Lead", status: "completed", rating: 3.8, reviewDate: "2025-11-10" },
    { id: 5, name: "David Brown", department: "Finance", position: "Accountant", status: "pending", rating: null, reviewDate: null }
  ];

  const completedCount = assignedEmployees.filter(e => e.status === "completed").length;
  const pendingCount = assignedEmployees.filter(e => e.status === "pending").length;
  const completionRate = ((completedCount / assignedEmployees.length) * 100).toFixed(0);

  const handleEdit = () => {
    toast.info("Edit functionality coming soon!");
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${cycle.name}"?`)) {
      toast.success("Cycle deleted successfully!");
      navigate("/role/admin/appraisal");
    }
  };

  const handleCloseCycle = () => {
    toast.success("Cycle marked as completed!");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/role/admin/appraisal")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{cycle.name}</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {cycle.status.toUpperCase()}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
          {cycle.status === "active" && (
            <Button onClick={handleCloseCycle} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <CheckCircle className="h-4 w-4 mr-2" /> Close Cycle
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Assigned</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{assignedEmployees.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Completed</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-3xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{completedCount} of {assignedEmployees.length} completed</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Employees ({assignedEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Review Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                    <td className="px-6 py-4 text-muted-foreground">{employee.position}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {employee.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {employee.rating ? `${employee.rating}/5` : '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {employee.reviewDate ? new Date(employee.reviewDate).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Description Card (if exists) */}
      {cycle.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{cycle.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewCycleDetails;
