import { useState, useEffect, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  UserPlus,
  Briefcase,
  Search,
  Building,
  MapPin,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Eye,
  Send,
  Loader2,
  FileText,
  Trash2,
  Users,
  ChevronDown,
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RecruitmentKpiCard, RecruitmentEmptyState } from "@/components/recruitment/RecruitmentUI";

export default function EmployeeReferrals() {
  const [activeTab, setActiveTab] = useState("open-jobs");
  const [openJobs, setOpenJobs] = useState([]);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Modals
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [selectedJobForReferral, setSelectedJobForReferral] = useState(null);
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Referral Form State
  const [referralForm, setReferralForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    relationship: "",
    referralNote: "",
  });

  const fetchOpenJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const res = await apiClient.get("/referrals/open-jobs");
      setOpenJobs(res?.data || res || []);
    } catch (err) {
      toast.error("Failed to load open positions");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchMyReferrals = useCallback(async () => {
    try {
      setLoadingReferrals(true);
      const res = await apiClient.get("/referrals/my-referrals");
      setMyReferrals(res?.data || res || []);
    } catch (err) {
      toast.error("Failed to load your referrals");
    } finally {
      setLoadingReferrals(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenJobs();
    fetchMyReferrals();
  }, [fetchOpenJobs, fetchMyReferrals]);

  // Derived Department Options
  const departmentsList = [...new Set(openJobs.map((j) => j.department).filter(Boolean))].sort();

  // Filtered Jobs
  const filteredJobs = openJobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      job.jobTitle?.toLowerCase().includes(q) ||
      job.department?.toLowerCase().includes(q) ||
      job.officeLocation?.toLowerCase().includes(q);
    const matchesDept = selectedDept === "all" || job.department === selectedDept;
    return matchesQuery && matchesDept;
  });

  // Handle Submit Referral
  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    if (!referralForm.candidateName.trim() || !referralForm.candidateEmail.trim() || !referralForm.candidatePhone.trim()) {
      toast.error("Please enter Candidate Name, Email, and Phone number");
      return;
    }

    if (!selectedJobForReferral) return;

    try {
      setIsSubmittingReferral(true);
      const res = await apiClient.post("/referrals", {
        jobId: selectedJobForReferral._id,
        candidateName: referralForm.candidateName.trim(),
        candidateEmail: referralForm.candidateEmail.trim(),
        candidatePhone: referralForm.candidatePhone.trim(),
        relationship: referralForm.relationship.trim(),
        referralNote: referralForm.referralNote.trim(),
      });

      if (res?.emailSent === false) {
        toast.warning(res?.message || `Referral created, but email could not be sent to ${referralForm.candidateEmail}.`);
      } else {
        toast.success(`Referral created & invitation email sent to ${referralForm.candidateEmail}!`);
      }

      setSelectedJobForReferral(null);
      setReferralForm({
        candidateName: "",
        candidateEmail: "",
        candidatePhone: "",
        relationship: "",
        referralNote: "",
      });
      fetchMyReferrals();
      setActiveTab("my-referrals");
    } catch (err) {
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.error ||
        err?.message ||
        "Failed to submit referral";
      toast.error(errMsg);
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Handle Cancel Invitation
  const handleCancelReferral = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this referral invitation?")) return;
    try {
      await apiClient.delete(`/referrals/${id}`);
      toast.success("Referral invitation cancelled");
      fetchMyReferrals();
    } catch (err) {
      toast.error("Failed to cancel referral");
    }
  };

  // Stats
  const totalOpen = openJobs.length;
  const myTotalRef = myReferrals.length;
  const myPending = myReferrals.filter((r) => r.status === "Invited").length;
  const myHired = myReferrals.filter((r) => r.progress === "Hired").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
            Employee Referral
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Refer talented candidates for open positions and track your referral status.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RecruitmentKpiCard
          title="Open Positions"
          value={totalOpen}
          icon={Briefcase}
          helper="Available for referral"
          accent="sky"
          active={activeTab === "open-jobs"}
          onClick={() => setActiveTab("open-jobs")}
        />
        <RecruitmentKpiCard
          title="My Referrals"
          value={myTotalRef}
          icon={Users}
          helper="Total referred candidates"
          accent="violet"
          active={activeTab === "my-referrals"}
          onClick={() => setActiveTab("my-referrals")}
        />
        <RecruitmentKpiCard
          title="Pending Invitations"
          value={myPending}
          icon={Clock}
          helper="Awaiting candidate application"
          accent="amber"
        />
        <RecruitmentKpiCard
          title="Successful Hires"
          value={myHired}
          icon={CheckCircle2}
          helper="Candidates hired via referral"
          accent="emerald"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-start gap-6 bg-transparent border-b border-slate-200 dark:border-white/10 rounded-none h-auto p-0 mb-6">
          <TabsTrigger
            value="open-jobs"
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 transition-all"
          >
            Open Positions ({openJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="my-referrals"
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400 transition-all"
          >
            My Referrals ({myReferrals.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Open Positions */}
        <TabsContent value="open-jobs" className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search job title, department, or location..."
                className="pl-9 h-10 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900 text-xs md:text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900 px-3 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departmentsList.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Cards Grid */}
          {loadingJobs ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <RecruitmentEmptyState
              title="No open positions found"
              description="There are currently no active job openings matching your search criteria."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <Card
                  key={job._id}
                  className="rounded-xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-slate-950/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                        {job.department || "General"}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {job.employmentType || "Full-time"}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                      {job.jobTitle}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {job.officeLocation || "On-site"}
                      {job.workMode ? ` • ${job.workMode}` : ""}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-5 py-3 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-b border-slate-100 dark:border-white/5 my-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Experience:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {job.minExperience ? `${job.minExperience}+ yrs` : "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-500">Openings:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {job.positions || 1} position(s)
                      </span>
                    </div>
                    {job.deadline && (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-500">Deadline:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-5 pt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs font-semibold"
                      onClick={() => setSelectedJobForDetail(job)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold cursor-pointer"
                      onClick={() => setSelectedJobForReferral(job)}
                    >
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Refer Candidate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: My Referrals */}
        <TabsContent value="my-referrals">
          <Card className="rounded-xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-slate-950/70 shadow-sm overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                My Referred Candidates
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Track the application progress of candidates you have referred.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReferrals ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                </div>
              ) : myReferrals.length === 0 ? (
                <div className="p-8">
                  <RecruitmentEmptyState
                    title="No referrals submitted yet"
                    description="You have not referred any candidates. Click 'Open Positions' to refer talented colleagues."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-white/10">
                      <tr>
                        <th className="p-4">Candidate</th>
                        <th className="p-4">Position</th>
                        <th className="p-4">Referral Date</th>
                        <th className="p-4">Invitation Status</th>
                        <th className="p-4">Application Progress</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300 font-medium">
                      {myReferrals.map((ref) => (
                        <tr key={ref._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {ref.candidateName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {ref.candidateEmail}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {ref.jobTitle}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {ref.department}
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {new Date(ref.referralDate).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                ref.status === "Invited"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                                  : ref.status === "Applied"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {ref.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                ref.progress === "Hired"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                  : ref.progress === "Selected"
                                  ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300"
                                  : ref.progress === "Not Selected"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                                  : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                              }`}
                            >
                              {ref.progress}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {ref.status === "Invited" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
                                onClick={() => handleCancelReferral(ref._id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Job Details */}
      {selectedJobForDetail && (
        <Dialog open={!!selectedJobForDetail} onOpenChange={() => setSelectedJobForDetail(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                  {selectedJobForDetail.department}
                </span>
                <span className="text-xs text-slate-500">{selectedJobForDetail.employmentType}</span>
              </div>
              <DialogTitle className="text-xl font-bold mt-2">
                {selectedJobForDetail.jobTitle}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> {selectedJobForDetail.officeLocation} • {selectedJobForDetail.positions || 1} Openings
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs md:text-sm text-slate-700 dark:text-slate-300">
              {selectedJobForDetail.aboutRole && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">About the Role</h4>
                  <p className="whitespace-pre-line text-slate-600 dark:text-slate-400">{selectedJobForDetail.aboutRole}</p>
                </div>
              )}
              {selectedJobForDetail.keyResponsibilities && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Key Responsibilities</h4>
                  <p className="whitespace-pre-line text-slate-600 dark:text-slate-400">{selectedJobForDetail.keyResponsibilities}</p>
                </div>
              )}
              {(() => {
                const skillsData = selectedJobForDetail.requiredSkills || selectedJobForDetail.skills || selectedJobForDetail.qualifications;
                const skillsList = Array.isArray(skillsData)
                  ? skillsData.filter(Boolean)
                  : typeof skillsData === "string" && skillsData.trim()
                  ? skillsData.split(",").map((s) => s.trim()).filter(Boolean)
                  : [];

                if (skillsList.length === 0) return null;

                return (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {skillsList.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedJobForDetail(null)}>
                Close
              </Button>
              <Button
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer"
                onClick={() => {
                  const j = selectedJobForDetail;
                  setSelectedJobForDetail(null);
                  setSelectedJobForReferral(j);
                }}
              >
                <Send className="mr-2 h-4 w-4" /> Refer Candidate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Refer Candidate Form */}
      {selectedJobForReferral && (
        <Dialog open={!!selectedJobForReferral} onOpenChange={() => setSelectedJobForReferral(null)}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-cyan-600" /> Refer Candidate
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Position: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedJobForReferral.jobTitle}</span> ({selectedJobForReferral.department})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReferralSubmit} className="space-y-4 text-xs md:text-sm">
              <div className="space-y-1.5">
                <Label htmlFor="candidateName">Candidate Name <span className="text-rose-500">*</span></Label>
                <Input
                  id="candidateName"
                  placeholder="e.g. Rahul Sharma"
                  value={referralForm.candidateName}
                  onChange={(e) => setReferralForm({ ...referralForm, candidateName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="candidateEmail">Candidate Email <span className="text-rose-500">*</span></Label>
                <Input
                  id="candidateEmail"
                  type="email"
                  placeholder="candidate@example.com"
                  value={referralForm.candidateEmail}
                  onChange={(e) => setReferralForm({ ...referralForm, candidateEmail: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="candidatePhone">Candidate Phone <span className="text-rose-500">*</span></Label>
                <Input
                  id="candidatePhone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={referralForm.candidatePhone}
                  onChange={(e) => setReferralForm({ ...referralForm, candidatePhone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="relationship">How do you know this candidate?</Label>
                <Input
                  id="relationship"
                  placeholder="e.g. Ex-Colleague at XYZ, University Alumnus"
                  value={referralForm.relationship}
                  onChange={(e) => setReferralForm({ ...referralForm, relationship: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="referralNote">Referral Note / Recommendation</Label>
                <Textarea
                  id="referralNote"
                  placeholder="Why is this candidate a good fit for this role?"
                  rows={3}
                  value={referralForm.referralNote}
                  onChange={(e) => setReferralForm({ ...referralForm, referralNote: e.target.value })}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" type="button" onClick={() => setSelectedJobForReferral(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingReferral} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer">
                  {isSubmittingReferral ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />} Send Referral Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
