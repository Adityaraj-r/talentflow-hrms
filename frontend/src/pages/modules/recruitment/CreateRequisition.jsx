"use client"

import { useState, useEffect} from "react"
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


const CreateRequisition = () => {


  
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canCreateRequisition = user?.can?.("recruitment", "write") && isRecruitmentOperator

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staff Requisition</h1>
        <p className="text-muted-foreground">Request and manage staff requisitions</p>
      </div>

      <Tabs defaultValue={canCreateRequisition ? "create" : "pending"}>
        <TabsList>
          {canCreateRequisition && <TabsTrigger value="create">Create Requisition</TabsTrigger>}
           <TabsTrigger value="history" className="cursor-pointer">Requisition History</TabsTrigger>

        </TabsList>

        {canCreateRequisition && (
          <TabsContent value="create">
            <RequisitionForm />
          </TabsContent>
        )}
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
    location: ""
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.position || !formData.department) {
      toast.error("Position and department are required")
      return
    }

    try {
      setLoading(true)

      const payload = {
  position: formData.position,
  department: formData.department,
  experience: formData.jobType,
  salaryRange: `${formData.minSalary}-${formData.maxSalary}`,
  reason: formData.reason,
  urgency: formData.urgency
}

      await apiClient.post("/requisitions", payload)

      toast.success("Requisition created")

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
        location: ""
      })

    } catch (err) {
      console.error(err)
      toast.error(err?.message || "Error creating requisition")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Staff Requisition</CardTitle>
        <CardDescription>
          Submit a new staff requisition for approval
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* POSITION */}
            <div className="space-y-2">
              <Label>Job Opening *</Label>
              <Input
                name="position"
                type="text"
                placeholder="Enter job opening"
                value={formData.position}
                onChange={handleChange}
                required
              />
            </div>

            {/* DEPARTMENT */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input
                name="department"
                type="text"
                placeholder="Enter department"
                value={formData.department}
                onChange={handleChange}
                required
              />
            </div>

            {/* JOB TYPE */}
            <div className="space-y-2">
              <Label>Job Type</Label>
              <Select
                value={formData.jobType}
                onValueChange={(val) => handleSelectChange("jobType", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time">Full Time</SelectItem>
                  <SelectItem value="Part-Time">Part Time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* POSITIONS */}
            <div className="space-y-2">
              <Label>Number of Positions</Label>
              <Input
                type="number"
                name="numberOfPositions"
                value={formData.numberOfPositions}
                onChange={handleChange}
              />
            </div>

            {/* SALARY */}
            <div className="space-y-2">
              <Label>Min Salary</Label>
              <Input name="minSalary" value={formData.minSalary} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Max Salary</Label>
              <Input name="maxSalary" value={formData.maxSalary} onChange={handleChange} />
            </div>

            {/* URGENCY */}
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(val) => handleSelectChange("urgency", val)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label>Job Description</Label>
            <Textarea
              name="jobDescription"
              value={formData.jobDescription}
              onChange={handleChange}
            />
          </div>

          {/* REQUIREMENTS */}
          <div className="space-y-2">
            <Label>Requirements</Label>
            <Textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
            />
          </div>

          {/* REASON */}
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select
              value={formData.reason}
              onValueChange={(val) => handleSelectChange("reason", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New Position</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </form>
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : "Submit Requisition"}
        </Button>
      </CardFooter>
    </Card>
  )
}


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

export default CreateRequisition
