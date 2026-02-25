import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  BarChart3
} from "lucide-react";

const ViewCycleDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  
  // Get cycle data from navigation state or localStorage
  const [cycle] = useState(() => {
    if (location.state?.cycle) {
      return location.state.cycle;
    }
    // Fallback: try to get from localStorage
    const saved = localStorage.getItem('performanceCycles');
    if (saved) {
      const cycles = JSON.parse(saved);
      return cycles.find(c => c.id === parseInt(id));
    }
    return null;
  });

  // Mock assigned employees data
  const mockAssignedEmployees = [
    { id: 1, name: "John Doe", department: "Engineering", status: "completed", rating: 4.5, reviewedBy: "Sarah Manager", reviewDate: "2026-01-15" },
    { id: 2, name: "Jane Smith", department: "Marketing", status: "in-progress", rating: null, reviewedBy: null, reviewDate: null },
    { id: 3, name: "Mike Johnson", department: "Sales", status: "pending", rating: null, reviewedBy: null, reviewDate: null },
    { id: 4, name: "Sarah Williams", department: "HR", status: "completed", rating: 4.2, reviewedBy: "Tom Director", reviewDate: "2026-01-18" },
    { id: 5, name: "Tom Brown", department: "Engineering", status: "completed", rating: 3.8, reviewedBy: "Sarah Manager", reviewDate: "2026-01-20" },
  ];

  if (!cycle) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cycle Not Found</h2>
            <p className="text-muted-foreground mb-6">The performance cycle you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/role/admin/appraisal')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEmployees = mockAssignedEmployees.length;
  const completedReviews = mockAssignedEmployees.filter(e => e.status === 'completed').length;
  const inProgressReviews = mockAssignedEmployees.filter(e => e.status === 'in-progress').length;
  const pendingReviews = mockAssignedEmployees.filter(e => e.status === 'pending').length;
  const completionRate = totalEmployees > 0 ? Math.round((completedReviews / totalEmployees) * 100) : 0;
  
  const avgRating = mockAssignedEmployees
    .filter(e => e.rating !== null)
    .reduce((sum, e) => sum + e.rating, 0) / (completedReviews || 1);

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-green-100 text-green-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      pending: "bg-gray-100 text-gray-800"
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === 'in-progress') return <Clock className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/role/admin/appraisal')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{cycle.name}</h1>
            <p className="text-muted-foreground">
              Performance cycle details and employee reviews
            </p>
          </div>
        </div>
        <Badge className={cycle.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
          {cycle.status.toUpperCase()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Cycle Period</span>
            </div>
            <div className="text-sm font-semibold">
              {new Date(cycle.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              {' - '}
              {new Date(cycle.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Completion Rate</span>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-500">{completionRate}%</div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Average Rating</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {completedReviews > 0 ? avgRating.toFixed(1) : '—'}/5
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Review Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{completedReviews}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{inProgressReviews}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <XCircle className="h-8 w-8 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-600">{pendingReviews}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {cycle.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cycle Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{cycle.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Employee Review Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Reviews ({totalEmployees})</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Track individual employee review status and ratings
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Reviewed By</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Review Date</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mockAssignedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium">{employee.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusBadge(employee.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(employee.status)}
                          {employee.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {employee.rating ? (
                        <span className="text-orange-600">{employee.rating}/5</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {employee.reviewedBy || '—'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {employee.reviewDate 
                        ? new Date(employee.reviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        disabled={employee.status === 'pending'}
                      >
                        {employee.status === 'completed' ? 'View Details' : 'Start Review'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewCycleDetails;
