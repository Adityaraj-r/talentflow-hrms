"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { useUser } from "@/contexts/UserContext"
import apiClient from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Clock3, PlusCircle, XCircle } from "lucide-react"
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
  const [stats, setStats] = useState({ totalOpen: 0, pending: 0, approved: 0, rejected: 0 })

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
      <RecruitmentPageHeader
        title="Staff Requisition"
        subtitle="Request staffing needs, review approvals, and keep hiring demand visible."
        summary={canCreateRequisition ? "Create requisitions and monitor approval movement" : "Approval queue and requisition history"}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RecruitmentKpiCard title="New Requests" value={totalRequisitions} icon={PlusCircle} trend={percentOfTotal(totalRequisitions)} trendLabel="of requisitions" helper={`${totalRequisitions} total requests`} updated="Live data" accent="sky" />
        <RecruitmentKpiCard title="Pending" value={stats.pending} icon={Clock3} trend={percentOfTotal(stats.pending)} trendLabel="of requisitions" helper={`${stats.pending} awaiting approval`} updated="Live data" accent="amber" />
        <RecruitmentKpiCard title="Approved" value={stats.approved} icon={CheckCircle2} trend={percentOfTotal(stats.approved)} trendLabel="of requisitions" helper={`${stats.approved} ready for hiring`} updated="Live data" accent="emerald" />
        <RecruitmentKpiCard title="Rejected" value={stats.rejected} icon={XCircle} trend={-percentOfTotal(stats.rejected)} trendLabel="of requisitions" helper={`${stats.rejected} returned with decision`} updated="Live data" accent="rose" />
      </div>

      <Tabs defaultValue={canCreateRequisition ? "create" : "pending"}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
          {canCreateRequisition && <TabsTrigger value="create">Create Requisition</TabsTrigger>}
          <TabsTrigger value="pending" className="cursor-pointer">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">Requisition History</TabsTrigger>
        </TabsList>

        {canCreateRequisition && (
          <TabsContent value="create">
            <RequisitionForm onSubmitted={fetchStats} />
          </TabsContent>
        )}

        <TabsContent value="pending">
          <PendingRequisitions onChanged={fetchStats} />
        </TabsContent>

        <TabsContent value="history">
          <RequisitionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const RequisitionForm = ({ onSubmitted }) => {
  const emptyHiringRole = { roleName: "", openings: 1, minSalary: "", maxSalary: "", experience: "", skills: "" }
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
    hiringType: "single",
    hiringRoles: [{ ...emptyHiringRole }],
    applicationDeadline: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalPositions = useMemo(() => {
    if (formData.hiringType === "single") {
      return Number(formData.numberOfPositions) || 1
    }
    return formData.hiringRoles.reduce((sum, role) => sum + (Number(role.openings) || 0), 0)
  }, [formData.hiringType, formData.numberOfPositions, formData.hiringRoles])

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
    if (formData.hiringType === "multiple") return "";
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

  const updateHiringRole = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      hiringRoles: prev.hiringRoles.map((role, roleIndex) => {
        if (roleIndex !== index) return role
        if (field === "openings") {
          const cleanValue = value.toString().replace(/[^0-9]/g, "")
          return { ...role, openings: cleanValue === "" ? "" : parseInt(cleanValue, 10) }
        }
        if (field === "minSalary" || field === "maxSalary") {
          const cleanValue = value.toString().replace(/[^0-9.]/g, "")
          const parts = cleanValue.split(".");
          const formattedValue = parts.length > 2 
            ? parts[0] + "." + parts.slice(1).join("") 
            : cleanValue;
          return { ...role, [field]: formattedValue }
        }
        return { ...role, [field]: value }
      }),
    }))
  }

  const addHiringRole = () => {
    setFormData((prev) => ({
      ...prev,
      hiringRoles: [...prev.hiringRoles, { ...emptyHiringRole }],
    }))
  }

  const removeHiringRole = (index) => {
    setFormData((prev) => ({
      ...prev,
      hiringRoles: prev.hiringRoles.length === 1
        ? prev.hiringRoles
        : prev.hiringRoles.filter((_, roleIndex) => roleIndex !== index),
    }))
  }

  const getHiringBreakdownError = () => {
    if (formData.hiringType === "single") return ""
    if (!formData.hiringRoles.length) return "At least one hiring role is required."
    
    const roleNames = new Set()
    for (let i = 0; i < formData.hiringRoles.length; i++) {
      const role = formData.hiringRoles[i]
      const nameTrimmed = (role.roleName || "").trim()
      
      if (!nameTrimmed) {
        return "Every hiring role must have a role name."
      }
      
      if (roleNames.has(nameTrimmed.toLowerCase())) {
        return `Duplicate role name found: "${nameTrimmed}". Every hiring role must have a unique role name.`
      }
      roleNames.add(nameTrimmed.toLowerCase())

      const openings = Number(role.openings)
      if (isNaN(openings) || !Number.isInteger(openings) || openings < 1) {
        return `Openings for role "${nameTrimmed}" must be positive whole numbers.`
      }

      if (role.minSalary === "" || role.minSalary === undefined) {
        return `Minimum salary is required for role "${nameTrimmed}".`
      }
      const min = Number(role.minSalary)
      if (isNaN(min) || min <= 0) {
        return `Minimum salary for role "${nameTrimmed}" must be greater than zero.`
      }

      if (role.maxSalary === "" || role.maxSalary === undefined) {
        return `Maximum salary is required for role "${nameTrimmed}".`
      }
      const max = Number(role.maxSalary)
      if (isNaN(max) || max < min) {
        return `Maximum salary for role "${nameTrimmed}" must be greater than or equal to minimum salary.`
      }
    }
    return ""
  }

  const hiringBreakdownError = getHiringBreakdownError()

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

    if (formData.hiringType === "single") {
      if (formData.numberOfPositions === "") {
        toast.error("Number of Positions is required");
        return;
      }
      if (numberOfPositionsError) {
        toast.error(numberOfPositionsError);
        return;
      }
    } else {
      if (hiringBreakdownError) {
        toast.error(hiringBreakdownError);
        return;
      }
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
        hiringRoles: formData.hiringType === "multiple"
          ? formData.hiringRoles.map((role) => ({
              roleName: role.roleName.trim(),
              openings: Number(role.openings),
              minSalary: Number(role.minSalary),
              maxSalary: Number(role.maxSalary),
              experience: role.experience.trim(),
              skills: role.skills.trim(),
            }))
          : [],
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
        hiringType: "single",
        hiringRoles: [{ ...emptyHiringRole }],
        applicationDeadline: "",
      });

    } catch {
      toast.error("Failed to submit requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Staff Requisition</CardTitle>
        <CardDescription>Submit a new staff requisition for approval</CardDescription>
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
                value={formData.hiringType === "single" ? (formData.numberOfPositions !== "" ? String(formData.numberOfPositions) : "") : String(totalPositions)}
                disabled={formData.hiringType === "multiple"}
                className={formData.hiringType === "multiple" ? "bg-muted/40 text-muted-foreground cursor-not-allowed" : ""}
                onChange={formData.hiringType === "single" ? handleChange : undefined}
                onKeyDown={formData.hiringType === "single" ? handleKeyDownPositions : undefined}
                required
              />
              {formData.hiringType === "single" && numberOfPositionsError && (
                <p className="text-red-500 text-sm mt-1">{numberOfPositionsError}</p>
              )}
            </div>

            {/* HIRING TYPE */}
            <div className="space-y-2">
              <Label>Hiring Type</Label>
              <div className="flex items-center gap-6 pt-1.5">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="hiringType"
                    value="single"
                    checked={formData.hiringType === "single"}
                    onChange={(e) => handleSelectChange("hiringType", e.target.value)}
                    className="accent-violet-600 h-4 w-4 cursor-pointer"
                  />
                  <span>Single Role</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="hiringType"
                    value="multiple"
                    checked={formData.hiringType === "multiple"}
                    onChange={(e) => handleSelectChange("hiringType", e.target.value)}
                    className="accent-violet-600 h-4 w-4 cursor-pointer"
                  />
                  <span>Multiple Roles</span>
                </label>
              </div>
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

            {formData.hiringType === "single" && (
              <>
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
              </>
            )}

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

          {formData.hiringType === "multiple" && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-muted/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Hiring Breakdown</h3>
                  <p className="text-xs text-muted-foreground">Define the roles included in this single requisition.</p>
                </div>
                <div className="text-sm font-medium">Total Positions: {totalPositions}</div>
              </div>

              <div className="space-y-3">
                {formData.hiringRoles.map((role, index) => (
                  <div key={index} className="grid gap-3 rounded-md border border-white/10 bg-background/70 p-3 md:grid-cols-12">
                    <div className="space-y-1 md:col-span-2">
                      <Label>Role Name</Label>
                      <Input
                        value={role.roleName}
                        onChange={(e) => updateHiringRole(index, "roleName", e.target.value)}
                        placeholder="Frontend Engineer"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <Label>Openings</Label>
                      <Input
                        type="number"
                        min="1"
                        value={role.openings}
                        onChange={(e) => updateHiringRole(index, "openings", e.target.value)}
                        onKeyDown={handleKeyDownPositions}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Min Salary</Label>
                      <Input
                        type="number"
                        value={role.minSalary}
                        onChange={(e) => updateHiringRole(index, "minSalary", e.target.value)}
                        onKeyDown={handleKeyDownSalary}
                        placeholder="Min"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Max Salary</Label>
                      <Input
                        type="number"
                        value={role.maxSalary}
                        onChange={(e) => updateHiringRole(index, "maxSalary", e.target.value)}
                        onKeyDown={handleKeyDownSalary}
                        placeholder="Max"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Experience</Label>
                      <Input
                        value={role.experience}
                        onChange={(e) => updateHiringRole(index, "experience", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Skills/Requirements</Label>
                      <Input
                        value={role.skills}
                        onChange={(e) => updateHiringRole(index, "skills", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex items-end md:col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeHiringRole(index)}
                        disabled={formData.hiringRoles.length === 1}
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {hiringBreakdownError && (
                <p className="text-sm text-red-500">{hiringBreakdownError}</p>
              )}

              <Button type="button" variant="outline" onClick={addHiringRole}>
                + Add Role
              </Button>
            </div>
          )}
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

const PendingRequisitions = ({ onChanged }) => {
  const [searchParams] = useSearchParams()
  const deptFilter = searchParams.get("department")
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const canWriteRecruitment = user?.can?.("recruitment", "write")
  const canApproveRecruitment = canWriteRecruitment && role === "HR_MANAGER"
  const canRecommend = canWriteRecruitment && (role === "HR_OFFICER" || role === "HR_MANAGER")
  const [pendingRequisitions, setPendingRequisitions] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [recommendation, setRecommendation] = useState("")
  const [savingRecommendation, setSavingRecommendation] = useState(false)

  const fetchPending = async () => {
    try {
      const data = await apiClient.get("/requisitions/pending");
      setPendingRequisitions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const visiblePending = useMemo(() => {
    if (!deptFilter) return pendingRequisitions
    return pendingRequisitions.filter((r) => r.department === deptFilter)
  }, [pendingRequisitions, deptFilter])

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/requisitions/${id}/approve`);
      toast.success("Requisition approved successfully");
      fetchPending();
      onChanged?.()
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/requisitions/${id}/reject`);
      toast.success("Requisition rejected successfully");
      fetchPending();
      onChanged?.()
    } catch {
      toast.error("Rejection failed");
    }
  };

  const submitRecommendation = async () => {
    if (!selectedReq?._id) return
    const text = recommendation.trim()
    if (!text) return

    setSavingRecommendation(true)
    try {
      const updated = await apiClient.patch(`/requisitions/${selectedReq._id}/recommendations`, { text })
      setSelectedReq(updated)
      setRecommendation("")
      toast.success("Recommendation saved")
      fetchPending()
    } catch {
      toast.error("Failed to save recommendation")
    } finally {
      setSavingRecommendation(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Pending Requisition Approvals ({visiblePending.length}
          {deptFilter ? ` · ${deptFilter}` : ""})
        </CardTitle>
        <CardDescription>
            {canWriteRecruitment
              ? "Review and approve staff requisitions"
              : "View mode only. Approvals are handled by authorized roles."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
          {visiblePending.length === 0 ? (
        <RecruitmentEmptyState
          title="No pending requisitions"
          description="Approved requisitions and new staffing requests will appear here when they need review."
        />
        ) : (
          visiblePending.map((req) => (
            <div
              key={req._id}
              className="rounded-lg border border-white/10 bg-card/80 p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:shadow-lg">           
            <div className="flex justify-between items-start">
            <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              {req.position}
            </h3>
            <p className="text-sm text-muted-foreground">
              {req.department} • {new Date(req.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-2">
              <RecruitmentStatusBadge status={req.status} />
              <span
                className={`px-2 py-1 text-xs rounded-full border ${
                  req.urgency === "High"
                    ? "border-red-400/30 bg-red-500/10 text-red-300"
                    : req.urgency === "Normal"
                    ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
                    : "border-green-400/30 bg-green-500/10 text-green-300"
                }`}
              >
                {req.urgency}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedReq(req)
                  setViewOpen(true)
                }}
                className="cursor-pointer"
              >
                View
              </Button>
            {canApproveRecruitment && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                  onClick={() => handleApprove(req._id)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => handleReject(req._id)}
                >
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    ))
  )}
</CardContent>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setSelectedReq(null)
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
            <DialogDescription>
              Review staff requisition information.
            </DialogDescription>
          </DialogHeader>

          {selectedReq ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Position</div>
                <div className="font-medium">{selectedReq.position}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="font-medium">{selectedReq.department}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Urgency</div>
                  <div className="font-medium">{selectedReq.urgency || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{selectedReq.status}</div>
                </div>
              </div>
              {selectedReq.salaryRange && (
                <div>
                  <div className="text-xs text-muted-foreground">Salary Range</div>
                  <div className="font-medium">{selectedReq.salaryRange}</div>
                </div>
              )}
              {selectedReq.experience && (
                <div>
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className="font-medium">{selectedReq.experience}</div>
                </div>
              )}
              {selectedReq.reason && (
                <div>
                  <div className="text-xs text-muted-foreground">Reason</div>
                  <div className="font-medium whitespace-pre-wrap">{selectedReq.reason}</div>
                </div>
              )}
              <div className="pt-2 text-xs text-muted-foreground">
                Created:{" "}
                {selectedReq.createdAt ? new Date(selectedReq.createdAt).toLocaleString() : "N/A"}
              </div>

              {Array.isArray(selectedReq.approvalHistory) && selectedReq.approvalHistory.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Approval history</div>
                  <div className="space-y-2">
                    {selectedReq.approvalHistory
                      .slice()
                      .reverse()
                      .slice(0, 15)
                      .map((h, idx) => (
                        <div key={idx} className="rounded-md border p-2 text-xs">
                          <span className="font-medium capitalize">{h.action}</span>
                          {h.role ? ` · ${h.role}` : ""}
                          {h.at ? ` · ${new Date(h.at).toLocaleString()}` : ""}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedReq.recommendations) && selectedReq.recommendations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Recommendations</div>
                  <div className="space-y-2">
                    {selectedReq.recommendations
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((r, idx) => (
                        <div key={idx} className="rounded-md border p-2">
                          <div className="text-xs text-muted-foreground">
                            {(r.createdByRole || "").toString()}{" "}
                            {r.createdAt ? `· ${new Date(r.createdAt).toLocaleString()}` : ""}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{r.text}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {canRecommend && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Add recommendation</div>
                  <Textarea
                    rows={3}
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Write your operational recommendation"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={submitRecommendation}
                      disabled={savingRecommendation || !recommendation.trim()}
                    >
                      {savingRecommendation ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No requisition selected.</div>
          )}
        </DialogContent>
      </Dialog>

    </Card>
  );
};

const RequisitionHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const canWriteRecruitment = user?.can?.("recruitment", "write")
  const canRecommend = canWriteRecruitment && (role === "HR_OFFICER" || role === "HR_MANAGER")
  const [recommendation, setRecommendation] = useState("")
  const [savingRecommendation, setSavingRecommendation] = useState(false)

  const fetchHistory = async () => {
    try {
      const data = await apiClient.get("/requisitions/history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const submitRecommendation = async () => {
    if (!selectedReq?._id) return
    const text = recommendation.trim()
    if (!text) return

    setSavingRecommendation(true)
    try {
      const updated = await apiClient.patch(`/requisitions/${selectedReq._id}/recommendations`, { text })
      setSelectedReq(updated)
      setRecommendation("")
      toast.success("Recommendation saved")
      fetchHistory()
    } catch {
      toast.error("Failed to save recommendation")
    } finally {
      setSavingRecommendation(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requisition History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <RecruitmentEmptyState
            title="No requisition history"
            description="Completed approvals and rejected requests will be listed here with decision context."
          />
        ) : history.map((req) => (
          <div key={req._id} className="flex justify-between gap-3 rounded-lg border border-white/10 bg-card/70 p-3 transition-colors hover:bg-muted/20">
            <div>
              <p className="font-medium">{req.position}</p>
              <p className="text-sm text-muted-foreground">
                {req.department}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RecruitmentStatusBadge status={req.status} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedReq(req)
                  setViewOpen(true)
                }}
                className="cursor-pointer"
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open)
          if (!open) setSelectedReq(null)
        }}
      >
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Requisition Details</DialogTitle>
            <DialogDescription>
              Review staff requisition information.
            </DialogDescription>
          </DialogHeader>

          {selectedReq ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Position</div>
                <div className="font-medium">{selectedReq.position}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="font-medium">{selectedReq.department}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Urgency</div>
                  <div className="font-medium">{selectedReq.urgency || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{selectedReq.status}</div>
                </div>
              </div>
              {selectedReq.salaryRange && (
                <div>
                  <div className="text-xs text-muted-foreground">Salary Range</div>
                  <div className="font-medium">{selectedReq.salaryRange}</div>
                </div>
              )}
              {selectedReq.experience && (
                <div>
                  <div className="text-xs text-muted-foreground">Experience</div>
                  <div className="font-medium">{selectedReq.experience}</div>
                </div>
              )}
              {selectedReq.reason && (
                <div>
                  <div className="text-xs text-muted-foreground">Reason</div>
                  <div className="font-medium whitespace-pre-wrap">{selectedReq.reason}</div>
                </div>
              )}
              <div className="pt-2 text-xs text-muted-foreground">
                Created:{" "}
                {selectedReq.createdAt ? new Date(selectedReq.createdAt).toLocaleString() : "N/A"}
              </div>

              {Array.isArray(selectedReq.approvalHistory) && selectedReq.approvalHistory.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Approval history</div>
                  <div className="space-y-2">
                    {selectedReq.approvalHistory
                      .slice()
                      .reverse()
                      .slice(0, 15)
                      .map((h, idx) => (
                        <div key={idx} className="rounded-md border p-2 text-xs">
                          <span className="font-medium capitalize">{h.action}</span>
                          {h.role ? ` · ${h.role}` : ""}
                          {h.at ? ` · ${new Date(h.at).toLocaleString()}` : ""}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedReq.recommendations) && selectedReq.recommendations.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Recommendations</div>
                  <div className="space-y-2">
                    {selectedReq.recommendations
                      .slice()
                      .reverse()
                      .slice(0, 10)
                      .map((r, idx) => (
                        <div key={idx} className="rounded-md border p-2">
                          <div className="text-xs text-muted-foreground">
                            {(r.createdByRole || "").toString()}{" "}
                            {r.createdAt ? `· ${new Date(r.createdAt).toLocaleString()}` : ""}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{r.text}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {canRecommend && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Add recommendation</div>
                  <Textarea
                    rows={3}
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    placeholder="Write your operational recommendation"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={submitRecommendation}
                      disabled={savingRecommendation || !recommendation.trim()}
                    >
                      {savingRecommendation ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No requisition selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StaffRequisition
