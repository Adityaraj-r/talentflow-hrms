import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";

const PerformanceAnalytics = () => {
  // Mock data for charts
  const ratingDistribution = [
    { name: "5 Stars", value: 15, color: "#10b981" },
    { name: "4 Stars", value: 25, color: "#3b82f6" },
    { name: "3 Stars", value: 10, color: "#f59e0b" },
    { name: "2 Stars", value: 3, color: "#ef4444" },
    { name: "1 Star", value: 2, color: "#dc2626" }
  ];

  const departmentPerformance = [
    { department: "IT", avgScore: 4.5 },
    { department: "HR", avgScore: 4.2 },
    { department: "Sales", avgScore: 3.8 },
    { department: "Marketing", avgScore: 4.0 },
    { department: "Finance", avgScore: 4.3 }
  ];

  const performanceTrend = [
    { month: "Jul", avgScore: 3.8 },
    { month: "Aug", avgScore: 4.0 },
    { month: "Sep", avgScore: 3.9 },
    { month: "Oct", avgScore: 4.2 },
    { month: "Nov", avgScore: 4.3 },
    { month: "Dec", avgScore: 4.2 }
  ];

  const topPerformers = [
    { name: "Sarah Johnson", department: "IT", score: 4.9 },
    { name: "Michael Chen", department: "Sales", score: 4.8 },
    { name: "Emily Davis", department: "HR", score: 4.7 }
  ];

  const needsImprovement = [
    { name: "John Smith", department: "Marketing", score: 2.5 },
    { name: "Lisa Anderson", department: "Finance", score: 2.8 },
    { name: "Robert Brown", department: "Sales", score: 3.0 }
  ];

  return (
    <div className="space-y-6">
      {/* Performance Distribution Chart */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Performance Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Department Performance Comparison */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            Department Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#8b5cf6" name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Performance Trend (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={3} name="Average Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers & Needs Improvement */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-600">{performer.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-lg font-bold text-green-700">{performer.score}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Needs Improvement */}
        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {needsImprovement.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{performer.name}</p>
                    <p className="text-sm text-gray-600">{performer.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-lg font-bold text-red-700">{performer.score}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
