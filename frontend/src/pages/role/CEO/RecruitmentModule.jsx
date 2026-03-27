import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Briefcase,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
} from "lucide-react";

const routeToTab = (pathname) => {
  if (pathname.includes("/executive-pipeline")) return "pipeline";
  if (pathname.includes("/strategic-analytics")) return "analytics";
  if (pathname.includes("/workforce-planning")) return "planning";
  if (pathname.includes("/executive-approvals")) return "approvals";
  if (pathname.includes("/employer-brand-health")) return "brand";
  return "analytics";
};

const tabToRoute = {
  pipeline: "/ceo/recruitment/executive-pipeline",
  analytics: "/ceo/recruitment/strategic-analytics",
  planning: "/ceo/recruitment/workforce-planning",
  approvals: "/ceo/recruitment/executive-approvals",
  brand: "/ceo/recruitment/employer-brand-health",
};

const RecruitmentModule = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [actioningId, setActioningId] = useState("");

  const activeTab = useMemo(() => routeToTab(location.pathname), [location.pathname]);
  const briefingText = useMemo(() => {
    if (!overview) return "Loading strategic recruitment briefing...";

    const openReqs = overview?.hiringVelocity?.openRequisitions ?? 0;
    const ytdReqs = overview?.hiringVelocity?.ytdRequisitions ?? 0;
    const targetYear = overview?.hiringVelocity?.targetYear ?? 2026;
    const budgetUtil = overview?.financialHealth?.utilizationPct ?? 0;
    const budgetActual = overview?.financialHealth?.actual ?? 0;
    const budgetTarget = overview?.financialHealth?.budgetTarget ?? 0;
    const executiveApps = overview?.qualityAndDiversity?.executiveApplications ?? 0;
    const sixMonthHires = overview?.qualityAndDiversity?.sixMonthHires ?? 0;
    const acceptanceRate = overview?.qualityAndDiversity?.acceptanceRate ?? 0;
    const pendingExec = overview?.bottlenecks?.pendingExecutiveRequisitions ?? 0;

    return `Hiring velocity remains ${openReqs > 0 ? "active" : "low"} with ${openReqs} open requisitions and ${ytdReqs} requisitions logged in ${targetYear}. Recruitment spend is currently at ${budgetUtil}% utilization (${budgetActual} of ${budgetTarget}), which should be monitored against growth priorities. Executive pipeline health shows ${executiveApps} leadership applications in scope, with ${sixMonthHires} six-month hires and an offer acceptance rate of ${acceptanceRate}%. There are ${pendingExec} executive-critical approvals awaiting final decision, representing the primary bottleneck for high-impact hiring.`;
  }, [overview]);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await apiClient.get("/ceo/recruitment-overview");
      setOverview(res?.data || null);
    } catch {
      toast.error("Failed to load recruitment overview");
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadApprovals = async () => {
    setLoadingApprovals(true);
    try {
      const res = await apiClient.get("/ceo/executive-approvals");
      setApprovals(Array.isArray(res?.data) ? res.data : []);
    } catch {
      toast.error("Failed to load executive approvals");
    } finally {
      setLoadingApprovals(false);
    }
  };

  useEffect(() => {
    loadOverview();
    loadApprovals();
  }, []);

  const handleApproveRequisition = async (item) => {
    if (!item?._id) return;
    setActioningId(item._id);
    try {
      await apiClient.put(`/requisitions/${item._id}/approve`);
      toast.success("Executive approval completed");
      loadApprovals();
      loadOverview();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Approval failed");
    } finally {
      setActioningId("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CEO Recruitment & Staffing</h1>
        <p className="text-muted-foreground">
          Strategic visibility with final authority on executive and high-value hiring decisions.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(next) => {
          const nextRoute = tabToRoute[next];
          if (nextRoute && nextRoute !== location.pathname) navigate(nextRoute);
        }}
      >
        <TabsList className="grid grid-cols-1 md:grid-cols-5 gap-2 h-auto bg-transparent p-0">
          <TabsTrigger value="pipeline">Executive Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Strategic Analytics</TabsTrigger>
          <TabsTrigger value="planning">Workforce Planning</TabsTrigger>
          <TabsTrigger value="approvals">Executive Approvals</TabsTrigger>
          <TabsTrigger value="brand">Employer Brand Health</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Hiring Velocity"
              subtitle="Open requisitions vs growth target"
              icon={Briefcase}
              value={loadingOverview ? "..." : `${overview?.hiringVelocity?.openRequisitions ?? 0}`}
              helper={`Target ${overview?.hiringVelocity?.targetYear || 2026}: ${overview?.hiringVelocity?.targetOpenRequisitions || 0}`}
            />
            <MetricCard
              title="Budget vs Actual"
              subtitle="Recruitment spend guardrails"
              icon={DollarSign}
              value={loadingOverview ? "..." : `${overview?.financialHealth?.utilizationPct ?? 0}%`}
              helper={`Actual ${overview?.financialHealth?.actual ?? 0} / Budget ${overview?.financialHealth?.budgetTarget ?? 0}`}
            />
            <MetricCard
              title="Quality Pulse (6M)"
              subtitle="New hires in last six months"
              icon={Activity}
              value={loadingOverview ? "..." : `${overview?.qualityAndDiversity?.sixMonthHires ?? 0}`}
              helper={`D&I benchmark: ${overview?.qualityAndDiversity?.diversityBenchmarkPct ?? 0}%`}
            />
            <MetricCard
              title="Offer Acceptance"
              subtitle="Accepted over offered outcomes"
              icon={ShieldCheck}
              value={loadingOverview ? "..." : `${overview?.qualityAndDiversity?.acceptanceRate ?? 0}%`}
              helper={`Declined offers: ${overview?.qualityAndDiversity?.declinedOffers ?? 0}`}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Hiring Velocity Trend
                </CardTitle>
                <CardDescription>
                  12-month requisition, approvals, and application movement.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ height: "320px", minHeight: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={overview?.charts?.hiringTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requisitions" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="approved" stroke="#16a34a" strokeWidth={2} />
                    <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Department Bottlenecks
                </CardTitle>
                <CardDescription>
                  Pending and high-urgency requisitions by department.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ height: "320px", minHeight: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.charts?.departmentBottlenecks || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pending" fill="#dc2626" />
                    <Bar dataKey="highUrgency" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic Dashboard Snapshot</CardTitle>
              <CardDescription>
                Real-time strategic signals for recruitment velocity, financial health, and talent quality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Hiring target progress</span>
                  <span>
                    {overview?.hiringVelocity?.openRequisitions ?? 0} / {overview?.hiringVelocity?.targetOpenRequisitions ?? 0}
                  </span>
                </div>
                <Progress
                  value={
                    !overview?.hiringVelocity?.targetOpenRequisitions
                      ? 0
                      : Math.min(
                          100,
                          ((overview?.hiringVelocity?.openRequisitions || 0) /
                            overview.hiringVelocity.targetOpenRequisitions) *
                            100
                        )
                  }
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Recruitment budget utilization</span>
                  <span>{overview?.financialHealth?.utilizationPct ?? 0}%</span>
                </div>
                <Progress value={Math.min(100, overview?.financialHealth?.utilizationPct ?? 0)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Executive Candidate Focus
                </CardTitle>
                <CardDescription>
                  Filtered leadership candidate pool with strategic visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{overview?.qualityAndDiversity?.executiveApplications ?? 0}</div>
                <p className="text-sm text-muted-foreground">Executive applications currently in scope.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-500" />
                  Pipeline Composition
                </CardTitle>
                <CardDescription>
                  Balance between open positions and executive-level intake.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ height: "260px", minHeight: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Open Requisitions", value: overview?.hiringVelocity?.openRequisitions ?? 0 },
                        { name: "Executive Applications", value: overview?.qualityAndDiversity?.executiveApplications ?? 0 },
                      ]}
                      dataKey="value"
                      outerRadius={90}
                      label
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#8b5cf6" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="planning">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Workforce Gap Radar</CardTitle>
                <CardDescription>
                  Plan headcount against strategic demand and approval throughput.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Open requisitions</span>
                  <span className="font-semibold">{overview?.hiringVelocity?.openRequisitions ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending executive approvals</span>
                  <span className="font-semibold">{overview?.bottlenecks?.pendingExecutiveRequisitions ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Published jobs</span>
                  <span className="font-semibold">{overview?.hiringVelocity?.jobsPublished ?? 0}</span>
                </div>
                <div className="pt-2">
                  <Progress
                    value={
                      !overview?.hiringVelocity?.targetOpenRequisitions
                        ? 0
                        : Math.min(
                            100,
                            ((overview?.hiringVelocity?.openRequisitions || 0) /
                              overview.hiringVelocity.targetOpenRequisitions) *
                              100
                          )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Pressure Points</CardTitle>
                <CardDescription>
                  Departments with the highest pending requisition load.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(overview?.charts?.departmentBottlenecks || []).slice(0, 5).map((d) => (
                  <div key={d.department} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <span>{d.department}</span>
                    <span className="font-medium">Pending {d.pending}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Executive Approvals</CardTitle>
              <CardDescription>
                Final authority queue for high-impact requisitions and compensation-sensitive staffing decisions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingApprovals ? (
                <div className="text-sm text-muted-foreground">Loading approvals...</div>
              ) : approvals.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending executive approvals.</div>
              ) : (
                approvals.map((item) => (
                  <div key={item._id} className="border rounded-md p-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.department} {item.salaryRange ? `• ${item.salaryRange}` : ""}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant="secondary">{item.urgency || "Normal"}</Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleApproveRequisition(item)}
                      disabled={actioningId === item._id}
                    >
                      {actioningId === item._id ? "Approving..." : "Approve"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand">
          <Card>
            <CardHeader>
              <CardTitle>Employer Brand Health</CardTitle>
              <CardDescription>
                Snapshot of talent-market perception and its impact on leadership hiring outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricPill label="Glassdoor Sentiment" value="Planned" />
                <MetricPill label="LinkedIn Brand Pull" value="Planned" />
                <MetricPill label="Employer NPS" value="Planned" />
              </div>
              <p className="text-sm text-muted-foreground">
                Integration placeholders are production-ready for external sentiment connectors. Once feeds are configured, this section will render real-time brand-attraction trends.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-l-4 border-l-blue-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            CEO Briefing
          </CardTitle>
          <CardDescription>
            Auto-generated strategic summary from live recruitment and staffing metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{briefingText}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const MetricCard = ({ title, subtitle, value, helper, icon: Icon }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center justify-between gap-2">
        <span>{title}</span>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardTitle>
      <CardDescription>{subtitle}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{helper}</p>
    </CardContent>
  </Card>
);

const MetricPill = ({ label, value }) => (
  <div className="rounded-md border px-3 py-2">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-sm font-semibold">{value}</div>
  </div>
);

export default RecruitmentModule;
