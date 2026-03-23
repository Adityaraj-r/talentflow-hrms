import { useEffect, useMemo, useState } from "react";
import apiClient from "@/services/apiClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const StatCard = ({ title, value, tone }) => {
  const toneClass =
    tone === "blue"
      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      : tone === "purple"
      ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
      : tone === "green"
      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : tone === "red"
      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      : "bg-muted/30";

  return (
    <Card className={toneClass}>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-2xl font-bold mt-2">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
};

const RecruitmentDashboard = () => {
  const [department, setDepartment] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [department, from, to]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await apiClient.get(`/recruitment/dashboard${queryString}`);
      setDashboard(res?.data ?? null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const t = setInterval(fetchDashboard, 10000); // "live" polling
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruitment Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Live staffing + pipeline overview with filters
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground">Department</label>
          <Input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g., Engineering"
          />
        </div>
        <div className="w-full md:w-56">
          <label className="text-sm text-muted-foreground">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="w-full md:w-56">
          <label className="text-sm text-muted-foreground">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" onClick={fetchDashboard} disabled={loading} className="h-10">
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {!dashboard && loading && <div className="text-muted-foreground">Loading...</div>}

      {dashboard && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Pending Requisitions" value={dashboard.requisitionStats?.Pending} tone="blue" />
            <StatCard title="Approved Requisitions" value={dashboard.requisitionStats?.Approved} tone="green" />
            <StatCard title="Rejected Requisitions" value={dashboard.requisitionStats?.Rejected} tone="red" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Draft Jobs" value={dashboard.jobStats?.Draft} tone="purple" />
            <StatCard title="Published Jobs" value={dashboard.jobStats?.Published} tone="blue" />
            <StatCard title="Closed Jobs" value={dashboard.jobStats?.Closed} tone="red" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Applied" value={dashboard.pipelineStats?.Applied} tone="blue" />
            <StatCard title="Screening" value={dashboard.pipelineStats?.Screening} tone="purple" />
            <StatCard title="Interview" value={dashboard.pipelineStats?.Interview} tone="blue" />
            <StatCard title="Offer" value={dashboard.pipelineStats?.Offer} tone="green" />
            <StatCard title="Hired" value={dashboard.pipelineStats?.Hired} tone="green" />
            <StatCard title="Rejected" value={dashboard.pipelineStats?.Rejected} tone="red" />
          </div>
        </>
      )}
    </div>
  );
};

export default RecruitmentDashboard;

