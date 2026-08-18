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
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RecruitmentEmptyState } from "@/components/recruitment/RecruitmentUI";
import { Pagination } from "@/components/ui/pagination";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RecruitmentKpiCard, RecruitmentEmptyState } from "@/components/recruitment/RecruitmentUI";
import ReferralProgressDrawer from "@/components/recruitment/ReferralProgressDrawer";

export default function EmployeeReferrals() {
  const [activeTab, setActiveTab] = useState("open-jobs");
  const [openJobs, setOpenJobs] = useState([]);
  const [myReferrals, setMyReferrals] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  // Modals & Drawer State
  const [selectedJobForDetail, setSelectedJobForDetail] = useState(null);
  const [selectedJobForReferral, setSelectedJobForReferral] = useState(null);
  const [selectedReferralForDrawer, setSelectedReferralForDrawer] = useState(null);
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
  
  const totalMyReferralsPages = Math.ceil(myTotalRef / itemsPerPage) || 1;
  const paginatedMyReferrals = myReferrals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  return (
    <div className="space-y-6 max-w-full pt-2 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <UserPlus className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Employee Referral
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Refer talented candidates for open positions and track your referral status.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Open Positions"
          value={totalOpen}
          icon={<Briefcase className="h-8 w-8" />}
          variant="blue"
          isActive={activeTab === "open-jobs"}
          onClick={() => setActiveTab("open-jobs")}
        />
        <StatsCard
          title="My Referrals"
          value={myTotalRef}
          icon={<Users className="h-8 w-8" />}
          variant="purple"
          isActive={activeTab === "my-referrals"}
          onClick={() => setActiveTab("my-referrals")}
        />
        <StatsCard
          title="Pending Invitations"
          value={myPending}
          icon={<Clock className="h-8 w-8" />}
          variant="amber"
          helper="Awaiting candidate application"
          accent="amber"
          onClick={() => setActiveTab("my-referrals")}
        />
        <StatsCard
          title="Successful Hires"
          value={myHired}
          icon={CheckCircle2}
          helper="Candidates hired via referral"
          accent="emerald"
          onClick={() => setActiveTab("my-referrals")}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-start gap-6 bg-transparent border-b border-slate-200 dark:border-slate-800 rounded-none h-auto p-0 mb-6">
          <TabsTrigger
            value="open-jobs"
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 rounded-none px-2 py-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all"
          >
            Open Positions ({openJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="my-referrals"
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 dark:data-[state=active]:border-indigo-400 rounded-none px-2 py-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 transition-all"
          >
            My Referrals ({myReferrals.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Open Positions */}
        <TabsContent value="open-jobs" className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search job title, department, or location..."
                className="pl-9 h-10 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-xs md:text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="h-10 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900 px-3 text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentsList.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Job Cards Grid */}
          {loadingJobs ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
                  className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 transition-all flex flex-col justify-between hover:shadow-md cursor-pointer"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40">
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

                  <CardContent className="px-5 py-3 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-800 my-2">
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
                      className="flex-1 text-xs font-semibold cursor-pointer"
                      onClick={() => setSelectedJobForDetail(job)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" /> Details
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
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
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                My Referred Candidates
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Track candidate application progress, invitation statuses, and hiring stages.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingReferrals ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : myReferrals.length === 0 ? (
                <div className="p-8">
                  <RecruitmentEmptyState
                    title="No referrals submitted yet"
                    description="You have not referred any candidates. Click 'Open Positions' to refer talented colleagues."
                  />
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      accessorKey: "candidate",
                      header: "Candidate",
                      cell: ({ row }) => {
                        const ref = row.original;
                        return (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {ref.candidateName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {ref.candidateEmail}
                            </div>
                          </div>
                        );
                      }
                    },
                    {
                      accessorKey: "position",
                      header: "Position",
                      cell: ({ row }) => {
                        const ref = row.original;
                        return (
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {ref.jobTitle}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {ref.department}
                            </div>
                          </div>
                        );
                      }
                    },
                    {
                      accessorKey: "referralDate",
                      header: "Referral Date",
                      cell: ({ row }) => <span className="text-slate-500 dark:text-slate-400">{new Date(row.original.referralDate).toLocaleDateString()}</span>
                    },
                    {
                      accessorKey: "status",
                      header: "Invitation Status",
                      cell: ({ row }) => {
                        const ref = row.original;
                        return (
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
                        );
                      }
                    },
                    {
                      accessorKey: "progress",
                      header: "Application Progress",
                      cell: ({ row }) => {
                        const ref = row.original;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              ref.progress === "Hired"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : ref.progress === "Selected"
                                ? "bg-primary/20 text-primary dark:bg-primary/100/20 dark:text-primary"
                                : ref.progress === "Not Selected"
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                                : "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300"
                            }`}
                          >
                            {ref.progress}
                          </span>
                        );
                      }
                    },
                    {
                      id: "actions",
                      header: () => <div className="text-right">Actions</div>,
                      cell: ({ row }) => {
                        const ref = row.original;
                        return (
                          <div className="flex justify-end">
                            {ref.status === "Invited" && (
                              <ActionIcon
                                icon={Trash2}
                                tooltip="Cancel Referral"
                                onClick={() => handleCancelReferral(ref._id)}
                              />
                            )}
                          </div>
                        );
                      }
                    }
                  ]}
                  data={paginatedMyReferrals}
                  searchable={false}
                />
              )}
            </CardContent>
            
            {myTotalRef > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalMyReferralsPages}
                  totalItems={myTotalRef}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Job Details */}
      {selectedJobForDetail && (
        <Dialog open={!!selectedJobForDetail} onOpenChange={() => setSelectedJobForDetail(null)}>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary dark:bg-primary/100/10 dark:text-primary">
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
                  <span className="text-slate-500 font-medium">Min Experience:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedJobForDetail.minExperience ? `${selectedJobForDetail.minExperience}+ years` : "Open"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Positions Open:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedJobForDetail.positions || 1}
                  </p>
                </div>
              </div>

              {selectedJobForDetail.description && (
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Job Description</h4>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {selectedJobForDetail.description}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <Button variant="outline" size="sm" className="text-xs cursor-pointer" onClick={() => setSelectedJobForDetail(null)}>
              Close
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs cursor-pointer"
              onClick={() => {
                const job = selectedJobForDetail;
                setSelectedJobForDetail(null);
                setSelectedJobForReferral(job);
              }}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Refer Candidate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Referral Submission Modal */}
      <Dialog open={!!selectedJobForReferral} onOpenChange={() => setSelectedJobForReferral(null)}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-indigo-600" />
              Refer Candidate for {selectedJobForReferral?.jobTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter the candidate's details. An invitation email will be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReferralSubmit} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Candidate Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                className="mt-1 h-9 text-xs"
                value={referralForm.candidateName}
                onChange={(e) => setReferralForm({ ...referralForm, candidateName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Candidate Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="rahul@example.com"
                className="mt-1 h-9 text-xs"
                value={referralForm.candidateEmail}
                onChange={(e) => setReferralForm({ ...referralForm, candidateEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Candidate Phone <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                className="mt-1 h-9 text-xs"
                value={referralForm.candidatePhone}
                onChange={(e) => setReferralForm({ ...referralForm, candidatePhone: e.target.value })}
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Relationship</Label>
              <Input
                placeholder="e.g. Former Colleague, Friend, College Alumni"
                className="mt-1 h-9 text-xs"
                value={referralForm.relationship}
                onChange={(e) => setReferralForm({ ...referralForm, relationship: e.target.value })}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Referral Note</Label>
              <Textarea
                placeholder="Why do you recommend this candidate? Highlight key skills..."
                className="mt-1 text-xs min-h-[70px]"
                value={referralForm.referralNote}
                onChange={(e) => setReferralForm({ ...referralForm, referralNote: e.target.value })}
              />
            </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" type="button" onClick={() => setSelectedJobForReferral(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmittingReferral} className="bg-primary hover:bg-primary/90 text-white font-semibold cursor-pointer">
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
