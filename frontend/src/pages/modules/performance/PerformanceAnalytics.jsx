import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import { TrendingUp, Users, Award, Target, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { performanceApi } from "@/services/performanceApi";
import apiClient from "@/services/apiClient";
import SkeletonCard from "@/components/reports/SkeletonCard";

const PerformanceAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    performanceDistribution: [],
    departmentComparison: [],
    cycleCompletion: [],
    ratingTrend: [],
    topPerformers: [],
    totalEmployees: 0,
    overallAvgRating: 0,
    activeCycles: 0
  });
  const [loading, setLoading] = useState(true);

  const calculatePerformanceDistribution = (reviews) => {
    const buckets = { outstanding: 0, exceeds: 0, meets: 0, below: 0, poor: 0 };
    reviews.forEach(review => {
      const score = review.avgRating || review.overallRating || 0;
      if (score >= 4.5) buckets.outstanding++;
      else if (score >= 4.0) buckets.exceeds++;
      else if (score >= 3.0) buckets.meets++;
      else if (score >= 2.0) buckets.below++;
      else buckets.poor++;
    });
    return [
      { name: "Outstanding (4.5-5.0)", value: buckets.outstanding, color: "#10b981" },
      { name: "Exceeds (4.0-4.4)", value: buckets.exceeds, color: "#3b82f6" },
      { name: "Meets (3.0-3.9)", value: buckets.meets, color: "#f59e0b" },
      { name: "Below (2.0-2.9)", value: buckets.below, color: "#ef4444" },
      { name: "Poor (<2.0)", value: buckets.poor, color: "#991b1b" }
    ];
  };

  const calculateDepartmentComparison = (reviews) => {
    const deptMap = {};
    reviews.forEach(review => {
      const dept = review.employeeId?.department || 'Unknown';
      const score = review.avgRating || review.overallRating || 0;
      if (!deptMap[dept]) deptMap[dept] = { total: 0, count: 0 };
      deptMap[dept].total += score;
      deptMap[dept].count += 1;
    });
    return Object.entries(deptMap).map(([department, data]) => ({
      department,
      avgScore: parseFloat((data.total / data.count).toFixed(1)),
      employees: data.count
    }));
  };

  const calculateCycleCompletion = (cycles) => {
    return cycles.map(cycle => ({
      cycle: cycle.name,
      completion: cycle.completionRate || 0
    }));
  };

  const calculateRatingTrend = (reviews) => {
    const monthly = {};
    reviews.forEach(review => {
      const month = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short' });
      if (!monthly[month]) monthly[month] = { total: 0, count: 0 };
      monthly[month].total += review.avgRating || review.overallRating || 0;
      monthly[month].count += 1;
    });
    return Object.entries(monthly).map(([month, data]) => ({
      month,
      avgRating: parseFloat((data.total / data.count).toFixed(1))
    }));
  };

  const calculateTopPerformers = (reviews) => {
    const performerMap = {};
    reviews.forEach(review => {
      const name = `${review.employeeId?.firstName || ''} ${review.employeeId?.lastName || ''}`.trim() || 'Unknown';
      const dept = review.employeeId?.department || 'Unknown';
      const rating = review.avgRating || review.overallRating || 0;
      if (!performerMap[name] || rating > performerMap[name].rating) {
        performerMap[name] = { name, department: dept, rating };
      }
    });
    return Object.values(performerMap)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const [stats, cycles] = await Promise.all([
          performanceApi.getStats(),
          performanceApi.getCycles()
        ]);

        // ✅ Fetch reviews via apiClient (same as employees fetch)
        let reviews = [];
        try {
          const reviewsRes = await apiClient.get('/performance/reviews/all');
          reviews = reviewsRes.data || [];
        } catch {
          reviews = [];
        }

        // ✅ Fetch total employees count
        let totalEmployees = stats.totalEmployees || 0;
        if (!totalEmployees) {
          try {
            const usersRes = await apiClient.get('/users');
            totalEmployees = usersRes.data.filter(u => u.role?.toUpperCase() !== 'ADMIN').length;
          } catch {
            totalEmployees = 0;
          }
        }

        setAnalyticsData({
          performanceDistribution: calculatePerformanceDistribution(reviews),
          departmentComparison: calculateDepartmentComparison(reviews),
          cycleCompletion: calculateCycleCompletion(cycles),
          ratingTrend: calculateRatingTrend(reviews),
          topPerformers: calculateTopPerformers(reviews),
          totalEmployees,
          overallAvgRating: stats.avgScore || 0,
          activeCycles: stats.activeCycles || 0
        });
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) return <SkeletonCard />;
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
            <div className="text-3xl font-bold text-blue-500">{analyticsData.totalEmployees}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Overall Avg Rating</span>
            </div>
            <div className="text-3xl font-bold text-green-500">
              {(analyticsData.overallAvgRating || 0).toFixed(1)}/5
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Cycles</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{analyticsData.activeCycles}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Performers</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">{analyticsData.topPerformers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
              Performance Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">Employee rating breakdown across all reviews</p>
          </CardHeader>
          <CardContent style={{ height: '350px', minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.performanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                >
                  {analyticsData.performanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Department Performance Comparison
            </CardTitle>
            <p className="text-sm text-muted-foreground">Average ratings by department</p>
          </CardHeader>
          <CardContent style={{ height: '350px', minHeight: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.departmentComparison}>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Cycle Completion Rates
            </CardTitle>
            <p className="text-sm text-muted-foreground">Review completion percentage per cycle</p>
          </CardHeader>
          <CardContent>
            {analyticsData.cycleCompletion.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No cycle data available</p>
            ) : (
              <div className="space-y-4">
                {analyticsData.cycleCompletion.map((cycle, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{cycle.cycle}</span>
                      <span className="text-muted-foreground">{cycle.completion}%</span>
                    </div>
                    <Progress value={cycle.completion} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Rating Trend Over Time
            </CardTitle>
            <p className="text-sm text-muted-foreground">Monthly average performance ratings</p>
          </CardHeader>
          <CardContent style={{ height: '250px', minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.ratingTrend}>
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
                {analyticsData.topPerformers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No review data yet — submit reviews to see top performers
                    </td>
                  </tr>
                ) : (
                  analyticsData.topPerformers.map((performer, index) => (
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
                        <span className="text-lg font-bold text-orange-600">
                          {(performer.rating || 0).toFixed(1)}/5
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full"
                            style={{ width: `${((performer.rating || 0) / 5) * 100}%` }}
                          />
                        </div>
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

export default PerformanceAnalytics;
