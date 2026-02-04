import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Users, UserCheck, Clock, AlertTriangle, ShieldCheck, MoreHorizontal } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">System overview, metrics, and alerts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsBox title="Total Users" value="1,560" sub="Registered Employees" icon={<Users className="h-4 w-4 text-blue-500" />} borderColor="border-l-blue-500" textColor="text-blue-500" />
        <StatsBox title="Active" value="1,203" sub="Currently Active" icon={<UserCheck className="h-4 w-4 text-green-500" />} borderColor="border-l-green-500" textColor="text-green-500" />
        <StatsBox title="Pending" value="12" sub="Approvals needed" icon={<Clock className="h-4 w-4 text-yellow-500" />} borderColor="border-l-yellow-500" textColor="text-yellow-500" />
        <StatsBox title="System Alerts" value="3" sub="Requires attention" icon={<AlertTriangle className="h-4 w-4 text-red-500" />} borderColor="border-l-red-500" textColor="text-red-500" />
        <StatsBox title="Security" value="Secure" sub="System Healthy" icon={<ShieldCheck className="h-4 w-4 text-purple-500" />} borderColor="border-l-purple-500" textColor="text-purple-500" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">User Distribution</CardTitle>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
              <Users className="h-10 w-10 mb-2 opacity-20" />
              <span>Chart: User Distribution by Role</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Recent Activities</CardTitle>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
              <Clock className="h-10 w-10 mb-2 opacity-20" />
              <span>Activity Timeline Log</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatsBox = ({ title, value, sub, icon, borderColor, textColor }) => (
  <Card className={`border-l-4 ${borderColor} bg-card shadow-sm hover:shadow-md transition-shadow`}>
    <CardContent className="p-6">
      <div className="flex items-center space-x-2">{icon}<span className="text-sm font-medium text-muted-foreground">{title}</span></div>
      <div className="mt-2 flex items-baseline space-x-2"><span className={`text-3xl font-bold ${textColor}`}>{value}</span><span className="text-xs text-muted-foreground">{sub}</span></div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
