"use client"

import { useEffect, useMemo, useState } from "react"  /*comment*/
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import {
  createDisciplinaryCase,
  getDisciplinaryCases,
  getDisciplinaryEmployees,
  getEmployee,
  updateDisciplinaryCase,
  updateDisciplinaryStatus,
} from "@/services/disciplinaryService"

const STATUSES = ["Pending Review", "In Progress", "Completed"]
const HR_OFFICER_ROLES = ["HR_OFFICER", "ADMIN", "SUPER_ADMIN"]
const HR_MANAGER_ROLES = ["HR_MANAGER"]
const REPORTING_ROLES = ["DEPARTMENT_MANAGER", "DIRECT_MANAGER"]
const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "")

const normalizeRole = (role) => (role || "").toUpperCase().replace(/\s+/g, "_")
const getName = (employee) =>
  employee?.name ||
  [employee?.firstName, employee?.MiddleName, employee?.lastName].filter(Boolean).join(" ") ||
  "-"
const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : "-")
const getCaseKey = (item) => item?._id || item?.caseId
const getAttachmentUrl = (attachment) =>
  attachment?.startsWith("http") ? attachment : `${API_ORIGIN}${attachment || ""}`

const DisciplinaryActions = () => {
  const { user } = useAuth()
  const role = normalizeRole(user?.role)
  const isHrOfficer = HR_OFFICER_ROLES.includes(role)
  const isHrManager = HR_MANAGER_ROLES.includes(role)
  const isHr = isHrOfficer || isHrManager
  const isReportingManager = REPORTING_ROLES.includes(role)
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [showCreateCase, setShowCreateCase] = useState(false)

  const loadCases = async () => {
    setLoading(true)
    try {
      const res = await getDisciplinaryCases()
      setCases(res.data || [])
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to load disciplinary cases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase()
    return cases.filter((item) => {
      const matchesSearch =
        !term ||
        item.caseId?.toLowerCase().includes(term) ||
        getName(item.employee).toLowerCase().includes(term)
      const matchesStatus = statusFilter === "All" || item.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [cases, search, statusFilter])

  const counts = useMemo(
    () =>
      STATUSES.reduce((acc, status) => {
        acc[status] = cases.filter((item) => item.status === status).length
        return acc
      }, {}),
    [cases]
  )

  const updateCaseInList = (updated) => {
    setSelectedCase(updated)
    setCases((prev) => prev.map((item) => (getCaseKey(item) === getCaseKey(updated) ? updated : item)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disciplinary</h1>
        <p className="text-muted-foreground">
          {isHr ? "Review disciplinary cases and track case status" : "Report incidents and view submitted cases"}
        </p>
      </div>

      <Tabs defaultValue={isHr ? "dashboard" : "report"}>
        <TabsList>
          {isHr ? (
            <>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="cases">All Cases</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="report">Report Incident</TabsTrigger>
              <TabsTrigger value="cases">My Cases</TabsTrigger>
            </>
          )}
        </TabsList>

        {isHr && (
          <TabsContent value="dashboard">
            <HrDashboard
              cases={cases}
              counts={counts}
              isHrManager={isHrManager}
              onView={setSelectedCase}
              loading={loading}
            />
          </TabsContent>
        )}

        {!isHr && (
          <TabsContent value="report">
            <ReportIncidentForm user={user} canSelectEmployee={isReportingManager} onCreated={loadCases} />
          </TabsContent>
        )}

        <TabsContent value="cases">
          <AllCases
            cases={filteredCases}
            isHr={isHr}
            isHrOfficer={isHrOfficer}
            loading={loading}
            search={search}
            statusFilter={statusFilter}
            showCreateCase={showCreateCase}
            onToggleCreate={() => setShowCreateCase((value) => !value)}
            onCreated={() => {
              setShowCreateCase(false)
              loadCases()
            }}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onView={setSelectedCase}
            user={user}
          />
        </TabsContent>

        {isHr && (
          <TabsContent value="reports">
            <Reports counts={counts} total={cases.length} />
          </TabsContent>
        )}
      </Tabs>

      {selectedCase && (
        <CaseDetails
          item={selectedCase}
          role={role}
          isHrOfficer={isHrOfficer}
          isHrManager={isHrManager}
          onClose={() => setSelectedCase(null)}
          onUpdated={updateCaseInList}
        />
      )}
    </div>
  )
}

const ReportIncidentForm = ({ user, canSelectEmployee, onCreated, compact = false }) => {
  const [formData, setFormData] = useState({
    employeeId: canSelectEmployee ? "" : user?.employeeCode || "",
    category: "",
    incidentDate: "",
    description: "",
  })
  const [employees, setEmployees] = useState([])
  const [employee, setEmployee] = useState(null)
  const [attachment, setAttachment] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (canSelectEmployee) {
      getDisciplinaryEmployees()
        .then((res) => setEmployees(res.data || []))
        .catch(() => setEmployees([]))
    } else if (user?.employeeCode) {
      loadEmployee(user.employeeCode)
    }
  }, [canSelectEmployee, user?.employeeCode])

  const loadEmployee = async (employeeId = formData.employeeId) => {
    if (!employeeId) return
    try {
      const res = await getEmployee(employeeId)
      setEmployee(res.data || res)
    } catch {
      setEmployee(null)
      if (canSelectEmployee) toast.error("Employee details could not be loaded")
    }
  }

  const selectEmployee = (employeeCode) => {
    const selected = employees.find((item) => item.employeeCode === employeeCode)
    setFormData((prev) => ({ ...prev, employeeId: employeeCode }))
    setEmployee(selected || null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category || !formData.incidentDate || !formData.description || (canSelectEmployee && !formData.employeeId)) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value))
      if (attachment) payload.append("attachment", attachment)

      await createDisciplinaryCase(payload)
      toast.success("Incident reported successfully")
      setFormData({ employeeId: canSelectEmployee ? "" : user?.employeeCode || "", category: "", incidentDate: "", description: "" })
      setEmployee(null)
      setAttachment(null)
      onCreated()
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to report incident")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{compact ? "Create Case" : "Report Incident"}</CardTitle>
        <CardDescription>Submitted cases move to Pending Review for HR</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
              {canSelectEmployee && employees.length > 0 ? (
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => selectEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((item) => (
                    <option key={item._id || item.employeeCode} value={item.employeeCode}>
                      {item.employeeCode} - {getName(item)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="employeeId"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    onBlur={() => canSelectEmployee && loadEmployee()}
                    placeholder="Enter employee ID"
                    readOnly={!canSelectEmployee}
                    required
                  />
                  {canSelectEmployee && <Button type="button" variant="outline" onClick={() => loadEmployee()}>Load</Button>}
                </div>
              )}
            </div>
            <ReadonlyField label="Employee Name" value={employee ? getName(employee) : `${user?.firstName || ""} ${user?.lastName || ""}`.trim()} />
            <ReadonlyField label="Department" value={employee?.department || user?.department} />
            <ReadonlyField label="Designation" value={employee?.designation || user?.designation} />
            <div className="space-y-2">
              <Label htmlFor="category">Incident Category <span className="text-red-500">*</span></Label>
              <Input id="category" name="category" value={formData.category} onChange={handleChange} placeholder="Enter category" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="incidentDate">Incident Date <span className="text-red-500">*</span></Label>
              <Input id="incidentDate" name="incidentDate" type="date" value={formData.incidentDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} placeholder="Describe the incident" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachment">Attachments</Label>
            <Input id="attachment" type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Submit Incident"}</Button>
      </CardFooter>
    </Card>
  )
}

const ReadonlyField = ({ label, value }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <Input value={value || "-"} readOnly />
  </div>
)

const HrDashboard = ({ cases, counts, isHrManager, onView, loading }) => {
  const awaitingReview = cases.filter((item) => item.managerReviewRequested && item.status !== "Completed")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((status) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardDescription>{status}</CardDescription>
              <CardTitle className="text-3xl">{counts[status] || 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      {isHrManager && (
        <CasesTable
          title="Cases Awaiting Manager Review"
          description="Cases where HR Officer requested manager review"
          cases={awaitingReview}
          onView={onView}
          loading={loading}
        />
      )}
      <CasesTable title="Recent Cases" description="Latest submitted incidents" cases={cases.slice(0, 5)} onView={onView} loading={loading} />
    </div>
  )
}

const AllCases = ({
  cases,
  isHr,
  isHrOfficer,
  loading,
  search,
  statusFilter,
  showCreateCase,
  onToggleCreate,
  onCreated,
  onSearch,
  onStatusFilter,
  onView,
  user,
}) => (
  <div className="space-y-4">
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{isHr ? "All Cases" : "My Cases"}</CardTitle>
            <CardDescription>{isHr ? "Search and review disciplinary cases" : "View submitted incidents"}</CardDescription>
          </div>
          {isHrOfficer && (
            <Button type="button" size="sm" onClick={onToggleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Case
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search employee or case ID" className="pl-8 w-full md:w-[300px]" />
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", ...STATUSES].map((status) => (
              <Button key={status} type="button" variant={statusFilter === status ? "default" : "outline"} size="sm" onClick={() => onStatusFilter(status)}>
                {status}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CasesGrid cases={cases} isHr={isHr} onView={onView} loading={loading} />
      </CardContent>
    </Card>
    {showCreateCase && <ReportIncidentForm user={user} canSelectEmployee compact onCreated={onCreated} />}
  </div>
)

const CasesTable = ({ title, description, cases, onView, loading }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <CasesGrid cases={cases} isHr onView={onView} loading={loading} />
    </CardContent>
  </Card>
)

const CasesGrid = ({ cases, isHr, onView, loading }) => (
  <div className="rounded-md border overflow-x-auto">
    <div className={`grid min-w-[680px] ${isHr ? "grid-cols-6" : "grid-cols-5"} bg-muted/50 p-3 text-sm font-medium`}>
      <div>Case ID</div>
      {isHr && <div>Employee</div>}
      <div>Category</div>
      <div>Status</div>
      <div>Created Date</div>
      <div>Action</div>
    </div>
    <div className="divide-y min-w-[680px]">
      {loading ? (
        <div className="p-3 text-sm text-muted-foreground">Loading cases...</div>
      ) : cases.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground">No cases found.</div>
      ) : (
        cases.map((item) => (
          <div key={getCaseKey(item)} className={`grid ${isHr ? "grid-cols-6" : "grid-cols-5"} p-3 text-sm items-center`}>
            <div className="font-medium">{item.caseId}</div>
            {isHr && <div>{getName(item.employee)}</div>}
            <div>{item.category}</div>
            <div><StatusBadge status={item.status} /></div>
            <div>{formatDate(item.createdAt)}</div>
            <div>
              <Button variant="ghost" size="icon" onClick={() => onView(item)}>
                <FileText className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

const CaseDetails = ({ item, isHrOfficer, isHrManager, onClose, onUpdated }) => {
  const [hrRemarks, setHrRemarks] = useState(item.hrRemarks || "")
  const [managerReview, setManagerReview] = useState(item.managerReview || "")
  const [saving, setSaving] = useState(false)
  const isCompleted = item.status === "Completed"

  useEffect(() => {
    setHrRemarks(item.hrRemarks || "")
    setManagerReview(item.managerReview || "")
  }, [item])

  const saveProgress = async (payload, message = "Progress saved") => {
    setSaving(true)
    try {
      const res = await updateDisciplinaryCase(getCaseKey(item), payload)
      onUpdated(res.data)
      toast.success(message)
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to save progress")
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (status) => {
    setSaving(true)
    try {
      const res = await updateDisciplinaryStatus(getCaseKey(item), status)
      onUpdated(res.data)
      toast.success("Status updated")
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Case Details</h2>
          <p className="text-muted-foreground">{item.caseId}</p>
        </div>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Employee Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Info label="Employee Name" value={getName(item.employee)} />
          <Info label="Employee ID" value={item.employee?.employeeCode || item.employeeId} />
          <Info label="Department" value={item.employee?.department} />
          <Info label="Designation" value={item.employee?.designation} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Incident Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Info label="Category" value={item.category} />
          <Info label="Incident Date" value={formatDate(item.incidentDate)} />
          <Info label="Description" value={item.description} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Attachments</CardTitle></CardHeader>
        <CardContent>
          {item.attachment ? (
            <div className="flex gap-2">
              <Button variant="outline" asChild><a href={getAttachmentUrl(item.attachment)} target="_blank" rel="noreferrer">View</a></Button>
              <Button variant="outline" asChild><a href={getAttachmentUrl(item.attachment)} download><Download className="h-4 w-4 mr-2" />Download</a></Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attachment uploaded.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HR Review</CardTitle>
          {item.managerReviewRequested && <CardDescription>Manager review requested</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>HR Remarks <span className="text-red-500">*</span></Label>
            <Textarea value={hrRemarks} onChange={(e) => setHrRemarks(e.target.value)} rows={5} readOnly={!isHrOfficer || isCompleted} placeholder="HR remarks" />
          </div>
          <div className="space-y-2">
            <Label>Manager Review</Label>
            <Textarea value={managerReview} onChange={(e) => setManagerReview(e.target.value)} rows={4} readOnly={!isHrManager || isCompleted} placeholder="Manager review" />
          </div>
          <div className="flex flex-wrap gap-2">
            {isHrOfficer && !isCompleted && (
              <Button onClick={() => saveProgress({ hrRemarks })} disabled={saving}>Save Progress</Button>
            )}
            {isHrManager && !isCompleted && (
              <Button onClick={() => saveProgress({ managerReview }, "Manager review saved")} disabled={saving}>Save Manager Review</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <StatusBadge status={item.status} />
          {isHrOfficer && item.status === "Pending Review" && <Button onClick={() => changeStatus("In Progress")} disabled={saving}>Start Investigation</Button>}
          {isHrOfficer && item.status === "In Progress" && (
            <>
              <Button variant="outline" onClick={() => saveProgress({ hrRemarks }, "Progress saved")} disabled={saving}>Save Progress</Button>
              <Button
                variant="outline"
                onClick={() => saveProgress({ hrRemarks, managerReviewRequested: true }, "Manager review requested")}
                disabled={saving || item.managerReviewRequested}
              >
                Request Manager Review
              </Button>
              <Button onClick={() => changeStatus("Completed")} disabled={saving || !hrRemarks.trim()}>Mark Completed</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const Reports = ({ total, counts }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <ReportCard title="Total Cases" value={total} />
    {STATUSES.map((status) => <ReportCard key={status} title={status} value={counts[status] || 0} />)}
  </div>
)

const ReportCard = ({ title, value }) => (
  <Card>
    <CardHeader>
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-3xl">{value}</CardTitle>
    </CardHeader>
  </Card>
)

const Info = ({ label, value }) => (
  <div>
    <div className="text-muted-foreground">{label}</div>
    <div className="font-medium">{value || "-"}</div>
  </div>
)

const StatusBadge = ({ status }) => {
  const variant = status === "Completed" ? "success" : status === "In Progress" ? "default" : "warning"
  return <Badge variant={variant}>{status}</Badge>
}

export default DisciplinaryActions
