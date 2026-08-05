import { PriorityDot } from "@/components/ui/PriorityDot";
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import apiClient from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Clock3, PlusCircle, XCircle, Eye, Search, Minus, Plus, FileEdit } from "lucide-react"
import { toast } from "sonner"
import {
  RecruitmentEmptyState,
  RecruitmentKpiCard,
  RecruitmentPageHeader,
  RecruitmentStatusBadge,
} from "@/components/recruitment/RecruitmentUI"

const StaffRequisition = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canCreateRequisition = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const [activeTab, setActiveTab] = useState(canCreateRequisition ? "create" : "pending")
  const [activeCardFilter, setActiveCardFilter] = useState("all")
  const [stats, setStats] = useState({ totalOpen: 0, pending: 0, approved: 0, rejected: 0 })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const totalRequisitions = stats.totalOpen + stats.rejected
  const percentOfTotal = (count) => totalRequisitions ? Math.round((count / totalRequisitions) * 100) : 0

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiClient.get("/requisitions/stats")
      setStats({
        totalOpen: Number(data?.totalOpen) || 0,
        pending: Number(data?.pending) || 0,
        approved: Number(data?.approved) || 0,
        rejected: Number(data?.rejected) || 0,
      })
    } catch {
      setStats({ totalOpen: 0, pending: 0, approved: 0, rejected: 0 })
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Requisitions</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RecruitmentKpiCard title="New Requests" value={totalRequisitions} icon={PlusCircle} trend={percentOfTotal(totalRequisitions)} trendLabel="of requisitions" helper={`${totalRequisitions} total requests`} accent="sky" active={activeCardFilter === "all"} onClick={() => { setActiveTab("history"); setActiveCardFilter("all"); }} />
        <RecruitmentKpiCard title="Pending" value={stats.pending} icon={Clock3} trend={percentOfTotal(stats.pending)} trendLabel="of requisitions" helper={`${stats.pending} awaiting approval`} accent="amber" active={activeCardFilter === "Pending"} onClick={() => { setActiveTab("pending"); setActiveCardFilter("Pending"); }} />
        <RecruitmentKpiCard title="Approved" value={stats.approved} icon={CheckCircle2} trend={percentOfTotal(stats.approved)} trendLabel="of requisitions" helper={`${stats.approved} ready for hiring`} accent="emerald" active={activeCardFilter === "Approved"} onClick={() => { setActiveTab("history"); setActiveCardFilter("Approved"); }} />
        <RecruitmentKpiCard title="Rejected" value={stats.rejected} icon={XCircle} trend={-percentOfTotal(stats.rejected)} trendLabel="of requisitions" helper={`${stats.rejected} returned with decision`} accent="rose" active={activeCardFilter === "Rejected"} onClick={() => { setActiveTab("history"); setActiveCardFilter("Rejected"); }} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex justify-start gap-6 bg-transparent border-b border-border rounded-none h-auto p-0 mb-6">
          {canCreateRequisition && (
            <TabsTrigger 
              value="create" 
              className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-[15px] font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Create Requisition
            </TabsTrigger>
          )}
          <TabsTrigger 
            value="pending" 
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-[15px] font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            Pending Approvals
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="cursor-pointer bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-[15px] font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
          >
            Requisition History
          </TabsTrigger>
        </TabsList>

        {canCreateRequisition && (
          <TabsContent value="create" forceMount>
            {activeTab === "create" && <RequisitionForm onSubmitted={() => { fetchStats(); setRefreshTrigger(p => p + 1); setActiveTab("pending"); setActiveCardFilter("Pending"); }} />}
          </TabsContent>
        )}

        <TabsContent value="pending" forceMount>
          {activeTab === "pending" && <PendingRequisitions onChanged={fetchStats} externalFilter={activeCardFilter} refreshTrigger={refreshTrigger} />}
        </TabsContent>

        <TabsContent value="history" forceMount>
          {activeTab === "history" && <RequisitionHistory externalFilter={activeCardFilter} refreshTrigger={refreshTrigger} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const RequisitionForm = ({ onSubmitted }) => {
  const [formData, setFormData] = useState({
    position: "",
    department: "",
    jobType: "",
    numberOfPositions: 1,
    minSalary: "",
    maxSalary: "",
    jobDescription: "",
    requirements: "",
    reason: "",
    urgency: "normal",
    applicationDeadline: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalPositions = Number(formData.numberOfPositions) || 1

  const getSalaryError = () => {
    const minVal = formData.minSalary;
    const maxVal = formData.maxSalary;
    if (minVal !== "" && maxVal !== "" && minVal !== undefined && maxVal !== undefined) {
      const minNum = Number(minVal);
      const maxNum = Number(maxVal);
      if (!isNaN(minNum) && !isNaN(maxNum) && maxNum < minNum) {
        return "Maximum salary must be greater than or equal to minimum salary.";
      }
    }
    return "";
  };

  const salaryError = getSalaryError();

  const getNumberOfPositionsError = () => {
    const val = formData.numberOfPositions;
    if (val === "" || val === undefined) {
      return "";
    }
    const num = Number(val);
    if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
      return "Number of positions must be at least 1.";
    }
    return "";
  };

  const numberOfPositionsError = getNumberOfPositionsError();

  const handleKeyDownPositions = (e) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleKeyDownSalary = (e) => {
    if (["e", "E", "-", "+"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === "numberOfPositions") {
      if (value === "") {
        setFormData((prev) => ({
          ...prev,
          numberOfPositions: ""
        }));
        return;
      }
      const cleanValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        numberOfPositions: cleanValue === "" ? "" : parseInt(cleanValue, 10)
      }));
      return;
    }
    if (name === "minSalary" || name === "maxSalary") {
      const cleanValue = value.replace(/[^0-9.]/g, "");
      const parts = cleanValue.split(".");
      const formattedValue = parts.length > 2 
        ? parts[0] + "." + parts.slice(1).join("") 
        : cleanValue;
      setFormData((prev) => ({
        ...prev,
        [name]: formattedValue
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayStr = getTodayString();

  const getDeadlineError = () => {
    const val = formData.applicationDeadline;
    if (!val) {
      return "Application deadline is required.";
    }
    const selectedDate = new Date(val);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return "Application deadline cannot be in the past.";
    }
    return "";
  };
  const deadlineError = getDeadlineError();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.position || !formData.department) {
      toast.error("Please fill required fields");
      return;
    }

    if (formData.numberOfPositions === "") {
      toast.error("Number of Positions is required");
      return;
    }
    if (numberOfPositionsError) {
      toast.error(numberOfPositionsError);
      return;
    }

    if (salaryError) {
      return;
    }

    if (deadlineError) {
      toast.error(deadlineError);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/requisitions", {
        position: formData.position,
        department: formData.department,
        experience: formData.jobType,
        salaryRange: `${formData.minSalary}-${formData.maxSalary}`,
        jobDescription: formData.jobDescription,
        requirements: formData.requirements,
        reason: formData.reason,
        urgency: formData.urgency,
        numberOfPositions: totalPositions,
        applicationDeadline: formData.applicationDeadline,
        hiringRoles: [],
      });

      toast.success("Requisition submitted successfully");
      onSubmitted?.()

      setFormData({
        position: "",
        department: "",
        jobType: "",
        numberOfPositions: 1,
        minSalary: "",
        maxSalary: "",
        jobDescription: "",
        requirements: "",
        reason: "",
        urgency: "normal",
        applicationDeadline: "",
      });

    } catch {
      toast.error("Failed to submit requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-[16px] border border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pt-6 pb-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <FileEdit className="w-5 h-5 text-primary" />
          </div>
          <div>
        <CardTitle className="text-[28px] font-bold text-foreground tracking-tight">Create Staff Requisition</CardTitle>
        <CardDescription className="text-[14px] mt-1 text-muted-foreground">Submit a new staff requisition for approval</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">
                Job Opening <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                name="position"
                type="text"
                placeholder="Enter job opening"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Input
                id="department"
                name="department"
                type="text"
                placeholder="Enter department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobType">
                Job Type <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.jobType} onValueChange={(value) => handleSelectChange("jobType", value)} required>
                <SelectTrigger id="jobType">
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfPositions">Number of Positions</Label>
              <Input
                id="numberOfPositions"
                name="numberOfPositions"
                type="number"
                min="1"
                value={formData.numberOfPositions !== "" ? String(formData.numberOfPositions) : ""}
                onChange={handleChange}
                onKeyDown={handleKeyDownPositions}
                required
              />
              {numberOfPositionsError && (
                <p className="text-red-500 text-sm mt-1">{numberOfPositionsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={formData.urgency} onValueChange={(value) => handleSelectChange("urgency", value)}>
                <SelectTrigger id="urgency">
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSalary">Minimum Salary</Label>
              <Input
                id="minSalary"
                name="minSalary"
                type="number"
                placeholder="Enter minimum salary"
                value={formData.minSalary}
                onChange={handleChange}
                onKeyDown={handleKeyDownSalary}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxSalary">Maximum Salary</Label>
              <Input
                id="maxSalary"
                name="maxSalary"
                type="number"
                placeholder="Enter maximum salary"
                value={formData.maxSalary}
                onChange={handleChange}
                onKeyDown={handleKeyDownSalary}
              />
              {salaryError && (
                <p className="text-red-500 text-sm mt-1">{salaryError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">
                Application Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="applicationDeadline"
                name="applicationDeadline"
                type="date"
                min={todayStr}
                placeholder="Select application deadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                onKeyDown={(e) => e.preventDefault()}
                required
              />
              {deadlineError && (
                <p className="text-red-500 text-sm mt-1">{deadlineError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Requisition <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.reason} onValueChange={(value) => handleSelectChange("reason", value)} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new-position">New Position</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                  <SelectItem value="additional-headcount">Additional Headcount</SelectItem>
                  <SelectItem value="project-based">Project Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea
              id="jobDescription"
              name="jobDescription"
              placeholder="Enter job description"
              value={formData.jobDescription}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              name="requirements"
              placeholder="Enter job requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={4}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Requisition"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const PendingRequisitions = ({ onChanged, externalFilter }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReq, setSelectedReq] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [recommendation, setRecommendation] = useState("")
  const [savingRecommendation, setSavingRecommendation] = useState(false)
  const [actionStatus, setActionStatus] = useState(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterDate, setFilterDate] = useState("all")
  
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isHR = role === "HR_OFFICER" || role === "HR_MANAGER"
  const isCEO = role === "CEO"
  const canRecommend = isHR
  const canApprove = true // user?.can?.("recruitment", "approve") || isCEO

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get("/requisitions/pending")
      setData(res || [])
    } catch (err) {
      toast.error("Failed to fetch pending requisitions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = useMemo(() => {
    return data.filter(req => {
      const q = searchQuery.toLowerCase()
      const reqIdMatch = req.reqId?.toLowerCase().includes(q) || `REQ-2026-${req._id.slice(-4).toLowerCase()}`.includes(q)
      const matchesSearch = req.position?.toLowerCase().includes(q) || req.department?.toLowerCase().includes(q) || reqIdMatch
      const matchesDept = filterDepartment === "all" || req.department === filterDepartment
      const matchesPriority = filterPriority === "all" || req.priority === filterPriority
      
      let matchesDate = true
      if (filterDate !== "all") {
        const reqDate = new Date(req.createdAt)
        const now = new Date()
        const diffTime = Math.abs(now - reqDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (filterDate === "today") matchesDate = diffDays <= 1
        else if (filterDate === "week") matchesDate = diffDays <= 7
        else if (filterDate === "month") matchesDate = diffDays <= 30
      }
      return matchesSearch && matchesDept && matchesPriority && matchesDate
    })
  }, [data, searchQuery, filterDepartment, filterPriority, filterDate])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleAction = async (id, status) => {
    if (!id || isActionLoading) return
    setIsActionLoading(true)
    try {
      await apiClient.put(`/requisitions/${id}/status`, { status, notes: "Status updated" })
      toast.success(`Requisition ${status} successfully`)
      await fetchData()
      if (onChanged) onChanged()
      setIsDetailsOpen(false)
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} requisition`)
    } finally {
      setIsActionLoading(false)
      setActionStatus(null)
    }
  }

  const submitRecommendation = async () => {
    if (!selectedReq || !recommendation.trim()) return
    setSavingRecommendation(true)
    try {
      await apiClient.post(`/requisitions/${selectedReq._id}/recommend`, { recommendation })
      toast.success("Recommendation added")
      setRecommendation("")
      await fetchData()
      const updatedReq = data.find((r) => r._id === selectedReq._id)
      if (updatedReq) setSelectedReq({ ...updatedReq, recommendations: [...(updatedReq.recommendations || []), { text: recommendation, createdByRole: role, createdAt: new Date() }] })
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add recommendation")
    } finally {
      setSavingRecommendation(false)
    }
  }
  
  const getBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "rejected": return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "published": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "draft": return "bg-slate-500/10 text-slate-600 dark:text-slate-400"
      default: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    }
  }
  
  const departments = [...new Set(data.map(req => req.department))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-[64px] bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-amber-500" />
            Pending Requisitions
            <span className="bg-amber-500/10 text-amber-600 text-xs py-0.5 px-2.5 rounded-full font-medium ml-2">
              {filteredData.length} Action{filteredData.length !== 1 ? 's' : ''} Needed
            </span>
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requisitions..."
                className="pl-9 bg-background w-full h-[40px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[160px] h-[40px] bg-background">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px] h-[40px] bg-background">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[140px] h-[40px] bg-background">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden lg:block w-full">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="w-[20%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Job Details</TableHead>
                <TableHead className="w-[15%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Department</TableHead>
                <TableHead className="w-[10%] px-6 h-[52px] align-middle text-center text-[14px] font-semibold text-foreground">Positions</TableHead>
                <TableHead className="w-[15%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Requested By</TableHead>
                <TableHead className="w-[10%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-center">Priority</TableHead>
                <TableHead className="w-[12%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Request Date</TableHead>
                <TableHead className="w-[10%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-center">Status</TableHead>
                <TableHead className="w-[13%] px-6 h-[52px] align-middle text-center text-[14px] font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 opacity-50" />
                      </div>
                      <p className="text-[14px] font-medium text-foreground">No Pending Approvals</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((req) => (
                  <TableRow key={req._id} className="hover:bg-muted/20 transition-all duration-200 h-[64px] border-b border-border/50">
                    <TableCell className="px-6 py-3 align-middle text-left">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="text-[12px] font-semibold text-muted-foreground mb-0.5">
                          {req.reqId || `REQ-2026-${req._id.slice(-4).toUpperCase()}`}
                        </span>
                        <span className="font-semibold text-[14px] text-foreground truncate" title={req.position}>
                          {req.position}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-3 align-middle text-[13px] text-muted-foreground truncate max-w-[150px]" title={req.department}>
                      {req.department}
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center text-[14px] font-medium text-foreground">
                      {req.numberOfPositions || 1}
                    </TableCell>

                    {/* Merged Requested By */}
                    <TableCell className="px-6 py-3 align-middle text-left">
                      <div className="flex flex-col max-w-[150px]">
                        <span className="font-medium text-[14px] text-foreground truncate" title={req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}>
                          {req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate" title={req.requestedBy?.designation || "Hiring Manager"}>
                          {req.requestedBy?.designation || "Hiring Manager"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center">
                        <PriorityDot priority={req.priority} />
                      </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-[14px] font-medium text-foreground text-left whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[12px] rounded-full font-medium ${getBadgeColor(req.status)}`}>
                        {req.status || "Pending"}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center whitespace-nowrap">
                      <div className="flex justify-center gap-2 items-center">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => { setSelectedReq(req); setIsDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canApprove && (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => { setActionStatus('Approved'); setSelectedReq(req); setIsDetailsOpen(true); }}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-500/10 hover:text-red-600" onClick={() => { setActionStatus('Rejected'); setSelectedReq(req); setIsDetailsOpen(true); }}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden p-4 space-y-4">
          {paginatedData.length === 0 ? (
            <div className="py-12 text-center border rounded-2xl border-dashed border-border">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500/30 mb-3" />
              <h3 className="text-[15px] font-medium">No pending requisitions</h3>
            </div>
          ) : (
            paginatedData.map(req => (
              <div key={req._id} className="p-4 rounded-xl border border-border/50 bg-background space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-muted-foreground mb-0.5">
                      {req.reqId || `REQ-2026-${req._id.slice(-4).toUpperCase()}`}
                    </span>
                    <h4 className="font-semibold text-[15px] text-foreground">{req.position}</h4>
                    <span className="text-[13px] text-muted-foreground">{req.department}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[12px] rounded-full font-medium ${getBadgeColor(req.status)}`}>
                    {req.status || "Pending"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-border/50">
                  <div>
                    <span className="text-[12px] text-muted-foreground block mb-1">Positions</span>
                    <span className="text-[14px] font-medium text-foreground">{req.numberOfPositions || 1}</span>
                  </div>
                  <div>
                      <span className="text-[12px] text-muted-foreground block mb-1">Priority</span>
                      <PriorityDot priority={req.priority} className="w-auto justify-start" />
                    </div>
                  <div className="col-span-2">
                    <span className="text-[12px] text-muted-foreground block mb-1">Requested By</span>
                    <span className="text-[14px] font-medium text-foreground">
                      {req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}
                      <span className="text-muted-foreground font-normal ml-1">({req.requestedBy?.designation || "Hiring Manager"})</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
                  <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg flex-1" onClick={() => { setSelectedReq(req); setIsDetailsOpen(true); }}>
                    <Eye className="h-4 w-4 mr-2" /> View
                  </Button>
                  {canApprove && (
                    <>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-emerald-600 border-emerald-600/20 bg-emerald-500/5 hover:bg-emerald-500/10" onClick={() => { setActionStatus('Approved'); setSelectedReq(req); setIsDetailsOpen(true); }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg text-red-600 border-red-600/20 bg-red-500/5 hover:bg-red-500/10" onClick={() => { setActionStatus('Rejected'); setSelectedReq(req); setIsDetailsOpen(true); }}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Professional Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-background/50 rounded-b-xl">
            <div className="text-[13px] text-muted-foreground font-medium hidden sm:block">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 rounded-lg text-[13px]" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1) {
                    return (
                      <Button key={p} variant={currentPage === p ? "default" : "ghost"} className={`h-8 w-8 p-0 rounded-lg text-[13px] font-medium ${currentPage !== p ? "hover:bg-muted" : ""}`} onClick={() => setCurrentPage(p)}>
                        {p}
                      </Button>
                    )
                  }
                  if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 text-muted-foreground text-xs">...</span>
                  return null
                })}
              </div>
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 rounded-lg text-[13px]" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDetailsOpen} onOpenChange={(open) => { setIsDetailsOpen(open); if (!open) setActionStatus(null); }}>
        <DialogContent className="sm:max-w-[600px] border-border/50 bg-background p-0 rounded-xl overflow-hidden">
          {selectedReq ? (
            <>
              <div className="p-6 border-b border-border/50 bg-muted/10 relative">
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedReq.position}</h3>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      {selectedReq.reqId || `REQ-2026-${selectedReq._id.slice(-4).toUpperCase()}`} • {selectedReq.department}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-[13px] rounded-full font-medium whitespace-nowrap ${getBadgeColor(selectedReq.status)}`}>
                    {selectedReq.status || "Pending"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Positions</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.numberOfPositions || 1}</span>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Requested By</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.requestedBy?.firstName ? `${selectedReq.requestedBy.firstName} ${selectedReq.requestedBy.lastName}` : "System"}</span>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                      <span className="text-[12px] font-medium text-muted-foreground block mb-1">Priority</span>
                      <PriorityDot priority={selectedReq.priority} className="w-auto justify-start" />
                    </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Target Hire Date</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.targetHireDate ? new Date(selectedReq.targetHireDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {actionStatus && canApprove && (
                  <div className={`p-4 rounded-xl border ${actionStatus === 'Approved' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <h4 className={`text-[14px] font-medium mb-2 ${actionStatus === 'Approved' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      Confirm {actionStatus}
                    </h4>
                    <p className="text-[13px] text-muted-foreground mb-4">
                      Are you sure you want to {actionStatus.toLowerCase()} this requisition? This action cannot be easily undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setActionStatus(null)}>Cancel</Button>
                      <Button size="sm" className={actionStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} onClick={() => handleAction(selectedReq._id, actionStatus)} disabled={isActionLoading}>
                        {isActionLoading ? "Processing..." : `Yes, ${actionStatus}`}
                      </Button>
                    </div>
                  </div>
                )}
                
                {Array.isArray(selectedReq.recommendations) && selectedReq.recommendations.length > 0 && (
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="text-[14px] font-semibold">Recommendations</div>
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                      {selectedReq.recommendations.slice().reverse().slice(0, 10).map((r, idx) => (
                        <div key={idx} className="bg-muted/10 rounded-lg p-3 border border-border/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-medium text-foreground">{(r.createdByRole || "System").toString()}</span>
                            <span className="text-[11px] text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : ""}</span>
                          </div>
                          <div className="text-[13px] text-muted-foreground whitespace-pre-wrap">{r.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canRecommend && !actionStatus && (
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="text-[14px] font-semibold">Add Recommendation</div>
                    <Textarea
                      rows={2}
                      className="resize-none text-[13px] bg-background"
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      placeholder="Write your operational recommendation..."
                    />
                    <div className="flex justify-end">
                      <Button size="sm" onClick={submitRecommendation} disabled={savingRecommendation || !recommendation.trim()}>
                        {savingRecommendation ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[14px] text-muted-foreground">Loading details...</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

const RequisitionHistory = ({ externalFilter }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReq, setSelectedReq] = useState(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  useEffect(() => { if (externalFilter && externalFilter !== "all" && externalFilter !== "Pending") setFilterStatus(externalFilter); else if (externalFilter === "all") setFilterStatus("all"); }, [externalFilter])
  const [filterDate, setFilterDate] = useState("all")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiClient.get("/requisitions/history")
      setData(res || [])
    } catch (err) {
      toast.error("Failed to fetch requisition history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredData = useMemo(() => {
    return data.filter(req => {
      const q = searchQuery.toLowerCase()
      const reqIdMatch = req.reqId?.toLowerCase().includes(q) || `REQ-2026-${req._id.slice(-4).toLowerCase()}`.includes(q)
      const matchesSearch = req.position?.toLowerCase().includes(q) || req.department?.toLowerCase().includes(q) || reqIdMatch
      const matchesDept = filterDepartment === "all" || req.department === filterDepartment
      const matchesStatus = filterStatus === "all" || req.status === filterStatus
      
      let matchesDate = true
      if (filterDate !== "all") {
        const reqDate = new Date(req.createdAt)
        const now = new Date()
        const diffTime = Math.abs(now - reqDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (filterDate === "today") matchesDate = diffDays <= 1
        else if (filterDate === "week") matchesDate = diffDays <= 7
        else if (filterDate === "month") matchesDate = diffDays <= 30
      }
      return matchesSearch && matchesDept && matchesStatus && matchesDate
    })
  }, [data, searchQuery, filterDepartment, filterStatus, filterDate])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      case "rejected": return "bg-red-500/10 text-red-600 dark:text-red-400"
      case "published": return "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      case "draft": return "bg-slate-500/10 text-slate-600 dark:text-slate-400"
      default: return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
    }
  }

  const departments = [...new Set(data.map(req => req.department))].filter(Boolean)

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 pt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-[64px] bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/10 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Requisition History
            <span className="bg-emerald-500/10 text-emerald-600 text-xs py-0.5 px-2.5 rounded-full font-medium ml-2">
              {filteredData.length} Total
            </span>
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-9 bg-background w-full h-[40px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[160px] h-[40px] bg-background">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-[40px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="w-[140px] h-[40px] bg-background">
              <SelectValue placeholder="Date Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="hidden lg:block w-full">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/50">
                <TableHead className="w-[20%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Job Details</TableHead>
                <TableHead className="w-[15%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Department</TableHead>
                <TableHead className="w-[12%] px-6 h-[52px] align-middle text-center text-[14px] font-semibold text-foreground">Positions</TableHead>
                <TableHead className="w-[18%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Requested By</TableHead>
                <TableHead className="w-[15%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-left">Request Date</TableHead>
                <TableHead className="w-[13%] px-6 h-[52px] align-middle text-[14px] font-semibold text-foreground text-center">Status</TableHead>
                <TableHead className="w-[12%] px-6 h-[52px] align-middle text-center text-[14px] font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                        <Search className="h-8 w-8 opacity-50 text-muted-foreground" />
                      </div>
                      <p className="text-[14px] font-medium text-foreground">No Requisition History Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((req) => (
                  <TableRow key={req._id} className="hover:bg-muted/20 transition-all duration-200 h-[64px] border-b border-border/50 cursor-default">
                    {/* Merged Job Details */}
                    <TableCell className="px-6 py-3 align-middle text-left">
                      <div className="flex flex-col max-w-[300px]">
                        <span className="text-[12px] font-semibold text-muted-foreground mb-0.5">
                          {req.reqId || `REQ-2026-${req._id.slice(-4).toUpperCase()}`}
                        </span>
                        <span className="font-semibold text-[14px] text-foreground truncate" title={req.position}>
                          {req.position}
                        </span>
</div>
                    </TableCell>
                      <TableCell className="px-6 py-3 align-middle text-[13px] text-muted-foreground truncate max-w-[150px]" title={req.department}>
                        {req.department}
                      </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center text-[14px] font-medium text-foreground">
                      {req.numberOfPositions || 1}
                    </TableCell>

                    {/* Merged Requested By */}
                    <TableCell className="px-6 py-3 align-middle text-left">
                      <div className="flex flex-col max-w-[180px]">
                        <span className="font-medium text-[14px] text-foreground truncate" title={req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}>
                          {req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}
                        </span>
                        <span className="text-[12px] text-muted-foreground truncate" title={req.requestedBy?.designation || "Hiring Manager"}>
                          {req.requestedBy?.designation || "Hiring Manager"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-[14px] font-medium text-foreground text-left whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 text-[12px] rounded-full font-medium ${getBadgeColor(req.status)}`}>
                        {req.status || "History"}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-3 align-middle text-center whitespace-nowrap">
                      <div className="flex justify-center items-center w-full">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => { setSelectedReq(req); setIsDetailsOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden p-4 space-y-4">
          {paginatedData.length === 0 ? (
            <div className="py-12 text-center border rounded-2xl border-dashed border-border">
              <Search className="h-12 w-12 mx-auto text-emerald-500/30 mb-3" />
              <h3 className="text-[15px] font-medium">No history found</h3>
            </div>
          ) : (
            paginatedData.map(req => (
              <div key={req._id} className="p-4 rounded-xl border border-border/50 bg-background space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-muted-foreground mb-0.5">
                      {req.reqId || `REQ-2026-${req._id.slice(-4).toUpperCase()}`}
                    </span>
                    <h4 className="font-semibold text-[15px] text-foreground">{req.position}</h4>
                    <span className="text-[13px] text-muted-foreground">{req.department}</span>
                  </div>
                  <span className={`px-2.5 py-1 text-[12px] rounded-full font-medium ${getBadgeColor(req.status)}`}>
                    {req.status || "History"}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-3 border-t border-border/50">
                  <div>
                    <span className="text-[12px] text-muted-foreground block mb-1">Positions</span>
                    <span className="text-[14px] font-medium text-foreground">{req.numberOfPositions || 1}</span>
                  </div>
                  <div>
                    <span className="text-[12px] text-muted-foreground block mb-1">Date</span>
                    <span className="text-[14px] font-medium text-foreground">
                      {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[12px] text-muted-foreground block mb-1">Requested By</span>
                    <span className="text-[14px] font-medium text-foreground">
                      {req.requestedBy?.firstName ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : "System"}
                      <span className="text-muted-foreground font-normal ml-1">({req.requestedBy?.designation || "Hiring Manager"})</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex">
                  <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg flex-1" onClick={() => { setSelectedReq(req); setIsDetailsOpen(true); }}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Professional Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-background/50 rounded-b-xl">
            <div className="text-[13px] text-muted-foreground font-medium hidden sm:block">
              Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 rounded-lg text-[13px]" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1) {
                    return (
                      <Button key={p} variant={currentPage === p ? "default" : "ghost"} className={`h-8 w-8 p-0 rounded-lg text-[13px] font-medium ${currentPage !== p ? "hover:bg-muted" : ""}`} onClick={() => setCurrentPage(p)}>
                        {p}
                      </Button>
                    )
                  }
                  if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 text-muted-foreground text-xs">...</span>
                  return null
                })}
              </div>
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 rounded-lg text-[13px]" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] border-border/50 bg-background p-0 rounded-xl overflow-hidden">
          {selectedReq ? (
            <>
              <div className="p-6 border-b border-border/50 bg-muted/10 relative">
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedReq.position}</h3>
                    <p className="text-[14px] text-muted-foreground mt-1">
                      {selectedReq.reqId || `REQ-2026-${selectedReq._id.slice(-4).toUpperCase()}`} • {selectedReq.department}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-[13px] rounded-full font-medium whitespace-nowrap ${getBadgeColor(selectedReq.status)}`}>
                    {selectedReq.status || "History"}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Positions</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.numberOfPositions || 1}</span>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Requested By</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.requestedBy?.firstName ? `${selectedReq.requestedBy.firstName} ${selectedReq.requestedBy.lastName}` : "System"}</span>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Date Created</span>
                    <span className="text-[15px] font-medium text-foreground">{new Date(selectedReq.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg border border-border/50">
                    <span className="text-[12px] font-medium text-muted-foreground block mb-1">Target Hire Date</span>
                    <span className="text-[15px] font-medium text-foreground">{selectedReq.targetHireDate ? new Date(selectedReq.targetHireDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {Array.isArray(selectedReq.recommendations) && selectedReq.recommendations.length > 0 && (
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <div className="text-[14px] font-semibold">Recommendations & Notes</div>
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                      {selectedReq.recommendations.slice().reverse().slice(0, 10).map((r, idx) => (
                        <div key={idx} className="bg-muted/10 rounded-lg p-3 border border-border/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[12px] font-medium text-foreground">{(r.createdByRole || "System").toString()}</span>
                            <span className="text-[11px] text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'}) : ""}</span>
                          </div>
                          <div className="text-[13px] text-muted-foreground whitespace-pre-wrap">{r.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-[14px] text-muted-foreground">Loading details...</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}


export default StaffRequisition
