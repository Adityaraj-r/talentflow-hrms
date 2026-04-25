"use client"

import { useState, useEffect, useMemo } from "react"
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
import { FileText, Check, X, Search } from "lucide-react"
import { toast } from "sonner"

const StaffRequisition = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isOperationsManager = role === "OPERATIONS_MANAGER"
  const canCreateRequisition = user?.can?.("recruitment", "write") && !isOperationsManager

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Requisition</h1>
        <p className="text-muted-foreground">Request and manage staff requisitions</p>
      </div>

      <Tabs defaultValue={canCreateRequisition ? "create" : "pending"}>
        <TabsList>
          {canCreateRequisition && <TabsTrigger value="create">Create Requisition</TabsTrigger>}
          <TabsTrigger value="pending" className="cursor-pointer">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history" className="cursor-pointer">Requisition History</TabsTrigger>
        </TabsList>

        {canCreateRequisition && (
          <TabsContent value="create">
            <RequisitionForm />
          </TabsContent>
        )}

        <TabsContent value="pending">
          <PendingRequisitions />
        </TabsContent>

        <TabsContent value="history">
          <RequisitionHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const RequisitionForm = () => {
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
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

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.position || !formData.department) {
    toast.error("Please fill required fields");
    return;
  }

  setIsSubmitting(true);
  try {
    await apiClient.post("/requisitions", {
      position: formData.position,
      department: formData.department,
      experience: formData.jobType,
      salaryRange: `${formData.minSalary}-${formData.maxSalary}`,
      reason: formData.reason,
      urgency: formData.urgency,
    });

    toast.success("Requisition submitted successfully");

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
                Position Title <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => handleSelectChange("position", value)}
                required
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="software-engineer">Software Engineer</SelectItem>
                  <SelectItem value="project-manager">Project Manager</SelectItem>
                  <SelectItem value="hr-specialist">HR Specialist</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="sales-representative">Sales Representative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange("department", value)}
                required
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">Human Resources</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
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
                value={formData.numberOfPositions}
                onChange={handleChange}
              />
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
              />
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

const PendingRequisitions = () => {
  const [searchParams] = useSearchParams()
  const deptFilter = searchParams.get("department")
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isOperationsManager = role === "OPERATIONS_MANAGER"
  const canWriteRecruitment = user?.can?.("recruitment", "write")
  const canApproveRecruitment = canWriteRecruitment && !isOperationsManager
  const canRecommend = canWriteRecruitment && isOperationsManager
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
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await apiClient.put(`/requisitions/${id}/reject`);
      toast.success("Requisition rejected successfully");
      fetchPending();
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
        <div className="text-center py-10 text-muted-foreground">
          No pending requisitions
        </div>
        ) : (
          visiblePending.map((req) => (
            <div
              key={req._id}
              className="p-4 border rounded-lg hover:shadow-md transition bg-white dark:bg-gray-900">           
            <div className="flex justify-between items-start">
            <div className="space-y-1">
            <h3 className="font-semibold text-lg">
              {req.position}
            </h3>
            <p className="text-sm text-muted-foreground">
              {req.department} • {new Date(req.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
                {req.status}
              </span>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  req.urgency === "High"
                    ? "bg-red-100 text-red-700"
                    : req.urgency === "Normal"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
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
  const isOperationsManager = role === "OPERATIONS_MANAGER"
  const canWriteRecruitment = user?.can?.("recruitment", "write")
  const canRecommend = canWriteRecruitment && isOperationsManager
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
        {history.map((req) => (
          <div key={req._id} className="flex justify-between p-3 border-b">
            <div>
              <p className="font-medium">{req.position}</p>
              <p className="text-sm text-muted-foreground">
                {req.department}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 text-xs rounded ${
                  req.status === "Approved"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {req.status}
              </span>
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
