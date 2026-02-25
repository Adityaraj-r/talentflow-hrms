import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, Users, Award, Target, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const PerformanceAnalytics = () => {
  const [cycles, setCycles] = useState([]);

  // Load cycles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('performanceCycles');
    if (saved) {
      setCycles(JSON.parse(saved));
    }
  }, []);

  // Mock analytics data (in real app, calculate from actual review data)
  const performanceDistribution = [
    { name: "Outstanding (4.5-5.0)", value: 15, color: "#10b981" },
    { name: "Exceeds (4.0-4.4)", value: 28, color: "#3b82f6" },
    { name: "Meets (3.0-3.9)", value: 42, color: "#f59e0b" },
    { name: "Below (2.0-2.9)", value: 12, color: "#ef4444" },
    { name: "Poor (<2.0)", value: 3, color: "#991b1b" }
  ];

  const departmentComparison = [
    { department: "Engineering", avgScore: 4.2, employees: 45 },
    { department: "Sales", avgScore: 3.8, employees: 32 },
    { department: "Marketing", avgScore: 4.1, employees: 28 },
    { department: "HR", avgScore: 4.5, employees: 15 },
    { department: "Operations", avgScore: 3.9, employees: 38 },
    { department: "Finance", avgScore: 4.3, employees: 22 }
  ];

  const cycleCompletion = [
    { cycle: "Q4 2025", completion: 85 },
    { cycle: "Q3 2025", completion: 92 },
    { cycle: "Q2 2025", completion: 88 },
    { cycle: "Q1 2025", completion: 95 }
  ];

  const ratingTrend = [
    { month: "Jan", avgRating: 3.8 },
    { month: "Feb", avgRating: 3.9 },
    { month: "Mar", avgRating: 4.0 },
    { month: "Apr", avgRating: 4.1 },
    { month: "May", avgRating: 4.2 },
    { month: "Jun", avgRating: 4.0 }
  ];

  const topPerformers = [
    { name: "Sarah Johnson", department: "Engineering", rating: 4.9 },
    { name: "Michael Chen", department: "Sales", rating: 4.8 },
    { name: "Emily Brown", department: "Marketing", rating: 4.7 },
    { name: "David Wilson", department: "HR", rating: 4.7 },
    { name: "Lisa Anderson", department: "Finance", rating: 4.6 }
  ];

  const totalEmployees = departmentComparison.reduce((sum, dept) => sum + dept.employees, 0);
  const overallAvgRating = (departmentComparison.reduce((sum, dept) => sum + dept.avgScore * dept.employees, 0) / totalEmployees).toFixed(2);
  const activeCycles = cycles.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Employees</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{totalEmployees}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Overall Avg Rating</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{overallAvgRating}/5</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Cycles</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{activeCycles}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Performers</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{topPerformers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              Performance Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">Employee rating breakdown across all reviews</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Department Performance Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground">Average ratings by department</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cycle Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Cycle Completion Rates
            </CardTitle>
            <p className="text-sm text-muted-foreground">Review completion percentage per cycle</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cycleCompletion.map((cycle, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cycle.cycle}</span>
                    <span className="text-muted-foreground">{cycle.completion}%</span>
                  </div>
                  <Progress value={cycle.completion} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rating Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Rating Trend Over Time
            </CardTitle>
            <p className="text-sm text-muted-foreground">Monthly average performance ratings</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ratingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgRating" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Avg Rating"
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
          <p className="text-sm text-muted-foreground">Highest-rated employees across all cycles</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Employee Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topPerformers.map((performer, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                        {index === 1 && <Award className="h-5 w-5 text-gray-400" />}
                        {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                        <span className="font-bold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{performer.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{performer.department}</td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-orange-600">{performer.rating}/5</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full"
                          style={{ width: `${(performer.rating / 5) * 100}%` }}
                        ></div>
                      </div>
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

export default PerformanceAnalytics;
