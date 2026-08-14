import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  Award,
  DollarSign,
  CheckCircle2,
  Clock,
  User,
  Building,
  Check,
  Loader2,
  Calendar,
  AlertCircle,
  FileText,
  ShieldCheck,
  Settings,
  AlertTriangle,
  TrendingUp,
  Save,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import ReferralAnalyticsDashboard from "./ReferralAnalyticsDashboard";

export default function ReferralRewardManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [rewards, setRewards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [policy, setPolicy] = useState({
    programEnabled: true,
    invitationExpiryDays: 14,
    shareableLinkExpiryDays: 30,
    minEmployeeTenureDays: 0,
    probationDurationDays: 90,
    maxActiveReferralsPerEmployee: 10,
    defaultBonusAmount: 10000,
    currency: "INR",
    reviewSlaHours: 48,
    probationEligibilityRule: "Employee must complete probation period and be in Active status at payout.",
  });
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Approval Modal state
  const [selectedReward, setSelectedReward] = useState(null);
  const [approvalType, setApprovalType] = useState(null); // 'HR' | 'Finance'
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  // Conflict Resolution Modal state
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [chosenReferrerId, setChosenReferrerId] = useState("");
  const [conflictNotes, setConflictNotes] = useState("");
  const [resolvingConflict, setResolvingConflict] = useState(false);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/referral-rewards/queue");
      setRewards(res?.data || []);
      const analyticsRes = await apiClient.get("/referral-rewards/analytics");
      setAnalytics(analyticsRes?.data || null);
      const policyRes = await apiClient.get("/referrals/policy");
      if (policyRes?.data) setPolicy(policyRes.data);
      const conflictsRes = await apiClient.get("/referrals/conflicts");
      setConflicts(conflictsRes?.data || []);
    } catch (err) {
      toast.error("Failed to load referral rewards & policy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleApproveHR = async () => {
    if (!selectedReward) return;
    try {
      setSubmitting(true);
      await apiClient.patch(`/referral-rewards/${selectedReward._id}/approve-hr`, { notes });
      toast.success("Referral bonus approved by HR!");
      setSelectedReward(null);
      setNotes("");
      fetchRewards();
    } catch (err) {
      toast.error(err?.response?.data?.error || "HR Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveFinance = async () => {
    if (!selectedReward) return;
    try {
      setSubmitting(true);
      await apiClient.patch(`/referral-rewards/${selectedReward._id}/approve-finance`, { notes });
      toast.success("Referral bonus approved by Finance & added to Payroll queue!");
      setSelectedReward(null);
      setNotes("");
      fetchRewards();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Finance Approval failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      setSavingPolicy(true);
      await apiClient.put("/referrals/policy", policy);
      toast.success("Referral Policy updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to update referral policy");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleResolveConflict = async () => {
    if (!selectedConflict || !chosenReferrerId) {
      toast.error("Please select the valid referring employee");
      return;
    }
    try {
      setResolvingConflict(true);
      await apiClient.post(`/referrals/${selectedConflict._id}/resolve-conflict`, {
        chosenReferrerId,
        notes: conflictNotes,
      });
      toast.success("Referral conflict resolved successfully!");
      setSelectedConflict(null);
      setChosenReferrerId("");
      setConflictNotes("");
      fetchRewards();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to resolve referral conflict");
    } finally {
      setResolvingConflict(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending_Probation":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Probation</Badge>;
      case "Eligible":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Probation Passed (Eligible)</Badge>;
      case "HR_Approved":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">HR Approved</Badge>;
      case "Finance_Approved":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Finance Approved</Badge>;
      case "Paid":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Paid in Payroll</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRewards = rewards.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending-hr") return r.rewardStatus === "Eligible" || r.rewardStatus === "Pending_Probation";
    if (activeTab === "pending-finance") return r.rewardStatus === "HR_Approved";
    if (activeTab === "approved") return r.rewardStatus === "Finance_Approved" || r.rewardStatus === "Paid";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600" />
            Referral Reward Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage probation completion, HR approvals, Finance releases, policy rules, and conflict resolution for employee referral bonuses.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5 border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Total Referrals Sent</p>
              <p className="text-2xl font-bold mt-1 text-purple-950 dark:text-purple-100">{analytics?.funnel?.referralsSent || rewards.length}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Total Bonuses Paid</p>
              <p className="text-2xl font-bold mt-1 text-emerald-950 dark:text-emerald-100">₹{(analytics?.totalPaid || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-emerald-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending Approvals</p>
              <p className="text-2xl font-bold mt-1 text-amber-950 dark:text-amber-100">₹{(analytics?.totalPending || 0).toLocaleString()}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-5 border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Referral-to-Hire Rate</p>
              <p className="text-2xl font-bold mt-1 text-blue-950 dark:text-blue-100">{analytics?.conversion?.referralToHireRate || "0.0%"}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Main Table & Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="all">All Rewards ({rewards.length})</TabsTrigger>
          <TabsTrigger value="pending-hr">Pending HR Approval</TabsTrigger>
          <TabsTrigger value="pending-finance">Pending Finance Release</TabsTrigger>
          <TabsTrigger value="approved">Approved & Paid</TabsTrigger>
          <TabsTrigger value="conflicts" className="relative">
            Conflicts ({conflicts.length})
            {conflicts.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {conflicts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Operational Reports & SLA
          </TabsTrigger>
          <TabsTrigger value="policy" className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" /> Policy Settings
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Reward Queue Views */}
        {["all", "pending-hr", "pending-finance", "approved"].includes(activeTab) && (
          <TabsContent value={activeTab} className="mt-4">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="p-5 border-b bg-muted/20">
                <CardTitle className="text-base font-semibold">Referral Reward Approvals</CardTitle>
                <CardDescription className="text-xs">
                  Review candidate probation history and authorize employee referral payouts.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="p-4">Referring Employee</th>
                        <th className="p-4">Referred Candidate</th>
                        <th className="p-4">Position</th>
                        <th className="p-4">Bonus Amount</th>
                        <th className="p-4">Probation Status</th>
                        <th className="p-4">Reward Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Loading referral rewards...
                          </td>
                        </tr>
                      ) : filteredRewards.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">
                            No referral rewards found for this view.
                          </td>
                        </tr>
                      ) : (
                        filteredRewards.map((reward) => (
                          <tr key={reward._id} className="hover:bg-muted/30">
                            <td className="p-4">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {reward.employeeId?.firstName ? `${reward.employeeId.firstName} ${reward.employeeId.lastName || ""}` : reward.employeeId?.name || "Employee"}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {reward.employeeId?.email} ({reward.employeeId?.department || "General"})
                              </div>
                            </td>
                            <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                              {reward.candidateName || reward.referralId?.candidateName || "Candidate"}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {reward.jobId?.jobTitle || "Job Position"}
                            </td>
                            <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{(reward.bonusAmount || 10000).toLocaleString()}
                            </td>
                            <td className="p-4">
                              {reward.isProbationCompleted ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                                  <Clock className="h-3.5 w-3.5" /> {reward.probationDays || 90} Days Probation
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {getStatusBadge(reward.rewardStatus)}
                            </td>
                            <td className="p-4 text-right">
                              {(reward.rewardStatus === "Eligible" || reward.rewardStatus === "Pending_Probation") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  onClick={() => {
                                    setSelectedReward(reward);
                                    setApprovalType("HR");
                                  }}
                                >
                                  Approve HR
                                </Button>
                              )}
                              {reward.rewardStatus === "HR_Approved" && (
                                <Button
                                  size="sm"
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => {
                                    setSelectedReward(reward);
                                    setApprovalType("Finance");
                                  }}
                                >
                                  Release Finance
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 2: Conflict Resolution */}
        <TabsContent value="conflicts" className="mt-4">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="p-5 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-700 dark:text-rose-400">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                Referral Conflict Review
              </CardTitle>
              <CardDescription className="text-xs">
                Review candidates referred by multiple employees and determine the valid referrer according to policy.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {conflicts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  No referral conflicts detected. All candidate referrals are clean.
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((item) => (
                    <div key={item._id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.candidateName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.candidateEmail})</span>
                        </div>
                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-xs font-semibold">
                          Conflict Detected
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100">
                          <p className="font-bold text-purple-900 dark:text-purple-300">Original Referrer (1st Claim)</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                            {item.referredByEmployeeId?.firstName} {item.referredByEmployeeId?.lastName} ({item.referredByEmployeeId?.department})
                          </p>
                          <p className="text-[11px] text-slate-500">Referred: {new Date(item.createdAt).toLocaleString()}</p>
                          {item.referralNote && <p className="text-[11px] italic text-slate-600 mt-1">"{item.referralNote}"</p>}
                        </div>

                        {item.conflictDetails?.map((sec, sIdx) => (
                          <div key={sIdx} className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100">
                            <p className="font-bold text-amber-900 dark:text-amber-300">Secondary Claim #{sIdx + 1}</p>
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">
                              {sec.referredByEmployeeId?.firstName} {sec.referredByEmployeeId?.lastName} ({sec.referredByEmployeeId?.department})
                            </p>
                            <p className="text-[11px] text-slate-500">Submitted: {new Date(sec.referredAt).toLocaleString()}</p>
                            {sec.referralNote && <p className="text-[11px] italic text-slate-600 mt-1">"{sec.referralNote}"</p>}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
                          onClick={() => {
                            setSelectedConflict(item);
                            setChosenReferrerId(item.referredByEmployeeId?._id || "");
                          }}
                        >
                          Resolve Conflict
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Policy Settings */}
        <TabsContent value="policy" className="mt-4">
          <Card className="rounded-xl border shadow-sm max-w-3xl">
            <CardHeader className="p-5 border-b bg-muted/20">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Referral Program Policy Settings
              </CardTitle>
              <CardDescription className="text-xs">
                Configure global rules, default bonuses, probation eligibility, and referral link limits without changing code.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleSavePolicy} className="space-y-5 text-xs md:text-sm">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
                  <div>
                    <Label className="font-bold text-slate-900 dark:text-slate-100">Enable Referral Program</Label>
                    <p className="text-xs text-muted-foreground">Allow employees to submit candidate referrals across open positions.</p>
                  </div>
                  <Switch
                    checked={policy.programEnabled}
                    onCheckedChange={(checked) => setPolicy({ ...policy, programEnabled: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="defaultBonusAmount">Default Bonus Amount (₹)</Label>
                    <Input
                      id="defaultBonusAmount"
                      type="number"
                      value={policy.defaultBonusAmount}
                      onChange={(e) => setPolicy({ ...policy, defaultBonusAmount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="probationDurationDays">Probation Duration (Days)</Label>
                    <Input
                      id="probationDurationDays"
                      type="number"
                      value={policy.probationDurationDays}
                      onChange={(e) => setPolicy({ ...policy, probationDurationDays: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invitationExpiryDays">Email Invitation Expiry (Days)</Label>
                    <Input
                      id="invitationExpiryDays"
                      type="number"
                      value={policy.invitationExpiryDays}
                      onChange={(e) => setPolicy({ ...policy, invitationExpiryDays: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="shareableLinkExpiryDays">Shareable Link Expiry (Days)</Label>
                    <Input
                      id="shareableLinkExpiryDays"
                      type="number"
                      value={policy.shareableLinkExpiryDays}
                      onChange={(e) => setPolicy({ ...policy, shareableLinkExpiryDays: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxActiveReferralsPerEmployee">Max Active Pending Referrals / Employee</Label>
                    <Input
                      id="maxActiveReferralsPerEmployee"
                      type="number"
                      value={policy.maxActiveReferralsPerEmployee}
                      onChange={(e) => setPolicy({ ...policy, maxActiveReferralsPerEmployee: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minEmployeeTenureDays">Min Employee Tenure Required (Days)</Label>
                    <Input
                      id="minEmployeeTenureDays"
                      type="number"
                      value={policy.minEmployeeTenureDays}
                      onChange={(e) => setPolicy({ ...policy, minEmployeeTenureDays: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reviewSlaHours">Referral Review SLA Limit (Hours)</Label>
                    <Input
                      id="reviewSlaHours"
                      type="number"
                      value={policy.reviewSlaHours || 48}
                      onChange={(e) => setPolicy({ ...policy, reviewSlaHours: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="probationEligibilityRule">Probation Payout Eligibility Rule</Label>
                  <Textarea
                    id="probationEligibilityRule"
                    rows={3}
                    value={policy.probationEligibilityRule}
                    onChange={(e) => setPolicy({ ...policy, probationEligibilityRule: e.target.value })}
                  />
                </div>

                <div className="flex justify-end pt-3 border-t">
                  <Button type="submit" disabled={savingPolicy} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer">
                    {savingPolicy ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />} Save Policy Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Operational Reports & SLA */}
        <TabsContent value="analytics" className="mt-4">
          <ReferralAnalyticsDashboard />
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      {selectedReward && (
        <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                {approvalType === "HR" ? "HR Manager Bonus Approval" : "Finance Bonus Release & Payroll Link"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {approvalType === "HR"
                  ? "Authorize candidate probation completion and approve referral bonus eligibility."
                  : "Release approved referral bonus to be disbursed in the next monthly payroll run."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                <div><span className="font-semibold">Referring Employee:</span> {selectedReward.employeeId?.firstName} {selectedReward.employeeId?.lastName}</div>
                <div><span className="font-semibold">Referred Candidate:</span> {selectedReward.candidateName}</div>
                <div><span className="font-semibold">Bonus Amount:</span> ₹{(selectedReward.bonusAmount || 10000).toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="approvalNotes">Approval Notes / Comments (Optional)</Label>
                <Input
                  id="approvalNotes"
                  placeholder="Add approval comment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedReward(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className={approvalType === "HR" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                disabled={submitting}
                onClick={approvalType === "HR" ? handleApproveHR : handleApproveFinance}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Confirm {approvalType} Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Conflict Resolution Dialog */}
      {selectedConflict && (
        <Dialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-700">
                <AlertTriangle className="h-5 w-5 text-rose-500" /> Resolve Referral Conflict
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select the rightful referring employee according to company referral policy guidelines.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                <div><span className="font-semibold">Candidate:</span> {selectedConflict.candidateName}</div>
                <div><span className="font-semibold">Email:</span> {selectedConflict.candidateEmail}</div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Select Approved Referrer</Label>
                <div className="space-y-2 border p-3 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="chosenReferrer"
                      value={selectedConflict.referredByEmployeeId?._id}
                      checked={chosenReferrerId === selectedConflict.referredByEmployeeId?._id}
                      onChange={(e) => setChosenReferrerId(e.target.value)}
                    />
                    <span>
                      {selectedConflict.referredByEmployeeId?.firstName} {selectedConflict.referredByEmployeeId?.lastName} (1st Claim)
                    </span>
                  </label>

                  {selectedConflict.conflictDetails?.map((sec, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="chosenReferrer"
                        value={sec.referredByEmployeeId?._id}
                        checked={chosenReferrerId === sec.referredByEmployeeId?._id}
                        onChange={(e) => setChosenReferrerId(e.target.value)}
                      />
                      <span>
                        {sec.referredByEmployeeId?.firstName} {sec.referredByEmployeeId?.lastName} (Claim #{idx + 1})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="conflictNotes">Resolution Notes / Reason</Label>
                <Input
                  id="conflictNotes"
                  placeholder="e.g. Approved 1st timestamp claim according to Policy Section 4..."
                  value={conflictNotes}
                  onChange={(e) => setConflictNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSelectedConflict(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                disabled={resolvingConflict}
                onClick={handleResolveConflict}
              >
                {resolvingConflict ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Confirm Resolution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
