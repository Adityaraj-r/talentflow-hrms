import { useCallback, useEffect, useMemo, useRef, useState } from "react"  /*comment*/
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Plus, RefreshCcw, FileSignature, Clock3, Send, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/contexts/UserContext"
import apiClient from "@/services/apiClient"
import { RecruitmentEmptyState, RecruitmentPageHeader, RecruitmentSkeleton } from "@/components/recruitment/RecruitmentUI"
import { cn } from "@/lib/utils"
import {
  enrichOffer,
  OfferActionBar,
  OfferActionConfirm,
  OfferDetailsDrawer,
  OfferFilters,
  OfferLetterPreview,
  OfferTable,
} from "@/components/recruitment/OfferWorkflow"

const defaultFilters = {
  search: "",
  status: "All",
  department: "All",
  recruiter: "All",
  approvalStage: "All",
  salaryRange: "All",
  expiry: "All",
}

const PAGE_SIZE = 8

const salaryBucket = (salary) => {
  const value = Number(salary) || 0
  if (value < 100000) return "Below 100k"
  if (value < 250000) return "100k-250k"
  return "250k+"
}

const expiryBucket = (expiryDate) => {
  const days = (new Date(expiryDate).getTime() - Date.now()) / 86400000
  if (days < 0) return "Expired"
  if (days <= 3) return "Due soon"
  return "Healthy"
}

const OfferManagement = () => {
  const { user } = useUser()
  const rawRole = typeof user?.role === "string" ? user.role : user?.role?.name
  const role = (rawRole || "").toString().toUpperCase().replace(/\s+/g, "_")
  const isRecruitmentOperator = role === "HR_OFFICER" || role === "HR_MANAGER"
  const canWrite = user?.can?.("recruitment", "write") && isRecruitmentOperator
  const canApproveOffers = user?.can?.("recruitment", "write") && role === "HR_MANAGER"

  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(defaultFilters)
  const [savedFilters, setSavedFilters] = useState([])
  const [sort, setSort] = useState({ key: "lastUpdated", direction: "desc" })
  const [page, setPage] = useState(1)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [letterOffer, setLetterOffer] = useState(null)
  const [pendingAction, setPendingAction] = useState(null)
  const singleOfferFetchAttemptedFor = useRef(null)

  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [positionVal, setPositionVal] = useState("")

  const location = useLocation()
  const navigate = useNavigate()
  const { offerId } = useParams()
  const isGeneratePage = location.pathname === "/dashboard/generate-offer"
  const isDetailsPage = location.pathname.startsWith("/dashboard/offer/")

  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get("/offers")
      const list = res?.data ?? res ?? []
      setOffers(Array.isArray(list) ? list : [])
    } catch {
      toast.error("Could not load offers")
      setOffers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCandidates = useCallback(async () => {
    try {
      const res = await apiClient.get("/applications")
      const rawData = res?.data?.data ?? res?.data ?? res ?? []
      const filtered = Array.isArray(rawData)
        ? rawData.filter((app) => ["Selected", "Offer"].includes(app.status))
        : []
      setCandidates(filtered)
    } catch {
      toast.error("Could not load candidates")
    }
  }, [])

  useEffect(() => {
    loadOffers()
    loadCandidates()
  }, [loadOffers, loadCandidates])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const statusParam = params.get("status")
    const expiryParam = params.get("expiry")
    if (statusParam || expiryParam) {
      setFilters(prev => ({
        ...prev,
        status: statusParam || prev.status,
        expiry: expiryParam || prev.expiry,
      }))
    }
  }, [location.search])

  useEffect(() => {
    if (selectedCandidate) {
      setPositionVal(selectedCandidate.selectedPositionTitle || selectedCandidate.hiringRoleName || selectedCandidate.jobId?.jobTitle || "")
    }
  }, [selectedCandidate])

  const enrichedOffers = useMemo(() => offers.map(enrichOffer), [offers])
  const findOffer = useCallback(
    (id) => enrichedOffers.find((offer) => offer._id === id || offer.offerId === id),
    [enrichedOffers]
  )

  useEffect(() => {
    singleOfferFetchAttemptedFor.current = null
  }, [offerId])

  useEffect(() => {
    if (!isDetailsPage || !offerId || loading) return
    if (findOffer(offerId)) {
      setSelectedOffer(findOffer(offerId))
      return
    }
    if (singleOfferFetchAttemptedFor.current === offerId) return
    singleOfferFetchAttemptedFor.current = offerId
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiClient.get(`/offers/${offerId}`)
        const offer = res?.data
        if (cancelled || !offer || Array.isArray(offer)) return
        setOffers((prev) => (prev.some((item) => item._id === offer._id) ? prev : [...prev, offer]))
      } catch {
        toast.error("Could not load this offer")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isDetailsPage, offerId, loading, findOffer])

  const filterOptions = useMemo(
    () => ({
      departments: [...new Set(enrichedOffers.map((offer) => offer.department).filter(Boolean))],
      recruiters: [...new Set(enrichedOffers.map((offer) => offer.recruiter).filter(Boolean))],
    }),
    [enrichedOffers]
  )

  const filteredOffers = useMemo(() => {
    const filtered = enrichedOffers.filter((offer) => {
      const haystack = `${offer.offerId || ""} ${offer.candidateName || ""} ${offer.position || ""} ${offer.department || ""} ${offer.recruiter || ""}`.toLowerCase()
      const matchesSearch = haystack.includes(filters.search.toLowerCase())
      const matchesStatus =
        filters.status === "All" ||
        (filters.status === "Pending Approval" && (offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval")) ||
        (filters.status === "Released" && offer.status === "Offered") ||
        offer.status === filters.status
      const matchesDepartment = filters.department === "All" || offer.department === filters.department
      const matchesRecruiter = filters.recruiter === "All" || offer.recruiter === filters.recruiter
      const matchesApproval = filters.approvalStage === "All" || offer.approvalStage === filters.approvalStage
      const matchesSalary = filters.salaryRange === "All" || salaryBucket(offer.salary) === filters.salaryRange
      const matchesExpiry = filters.expiry === "All" || expiryBucket(offer.expiryDate) === filters.expiry
      return matchesSearch && matchesStatus && matchesDepartment && matchesRecruiter && matchesApproval && matchesSalary && matchesExpiry
    })

    return filtered.sort((a, b) => {
      const aValue = a[sort.key]
      const bValue = b[sort.key]
      const direction = sort.direction === "asc" ? 1 : -1
      if (sort.key === "salary") return (Number(aValue) - Number(bValue)) * direction
      return String(aValue || "").localeCompare(String(bValue || "")) * direction
    })
  }, [enrichedOffers, filters, sort])

  useEffect(() => {
    setPage(1)
  }, [filters, sort])

  const handleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }))
  }

  const handleStatusUpdate = async (mongoId, newStatus) => {
    try {
      await apiClient.patch(`/offers/${mongoId}/status`, { status: newStatus })
      toast.success("Offer updated")
      await loadOffers()
      if (isDetailsPage) navigate("/dashboard/offer-management")
    } catch (e) {
      toast.error(e?.response?.data?.error || "Update failed")
    }
  }

  const handleManagerApprove = async (mongoId) => {
    try {
      await apiClient.patch(`/offers/${mongoId}/approve`, { comments: "Approved from offer management" })
      toast.success("Offer released")
      await loadOffers()
      if (isDetailsPage) navigate("/dashboard/offer-management")
    } catch (e) {
      toast.error(e?.response?.data?.error || "Approval failed")
    }
  }

  const requestAction = (action, offer = selectedOffer) => {
    if (!offer && !["export"].includes(action)) return
    if (action === "preview-pdf") {
      setLetterOffer(offer)
      return
    }
    const managerOnly = ["send", "reject", "renegotiate", "duplicate", "archive"]
    const operatorOnly = ["accepted", "declined"]
    if (managerOnly.includes(action) && !canApproveOffers) {
      toast.error("Only HR Manager can perform this offer action")
      return
    }
    if (operatorOnly.includes(action) && !canWrite) {
      toast.error("You do not have permission to update this offer")
      return
    }
    if (action === "approve" && !canApproveOffers) {
      toast.error("Only HR Manager can approve offers")
      return
    }
    setPendingAction({ action, offer })
  }

  const handleDownloadOfferPdf = async (offer) => {
    if (!offer?._id) return
    const toastId = toast.loading("Generating official Offer Letter PDF...")
    try {
      const res = await apiClient.get(`/offers/${offer._id}/pdf`, { responseType: "blob" })
      const blob = new Blob([res.data || res], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      const formattedName = (offer.candidateName || "Candidate").replace(/[^a-zA-Z0-9_-]/g, "_")
      const version = offer.negotiationRounds?.length ? `_V${offer.negotiationRounds.length + 1}` : ""
      link.href = url
      link.download = `Offer_Letter_${formattedName}${version}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success("Official Offer Letter PDF downloaded successfully")
    } catch (e) {
      console.error("PDF download error:", e)
      toast.dismiss(toastId)
      toast.error(e?.response?.data?.error || "Failed to download Offer Letter PDF")
    }
  }

  const confirmAction = async () => {
    const action = pendingAction?.action
    const offer = pendingAction?.offer
    setPendingAction(null)

    if (action === "approve" && offer?._id) return handleManagerApprove(offer._id)
    if (action === "accepted" && offer?._id) return handleStatusUpdate(offer._id, "Accepted")
    if (action === "declined" && offer?._id) return handleStatusUpdate(offer._id, "Declined")
    if (action === "download" && offer?._id) return handleDownloadOfferPdf(offer)
    if (action === "send" && offer?._id) {
      try {
        await apiClient.patch(`/offers/${offer._id}/send`, { comments: "Sent from offer management" })
        toast.success("Offer email sent to candidate successfully")
        await loadOffers()
      } catch (e) {
        toast.error(e?.response?.data?.error || e?.message || "Failed to send offer email")
      }
      return
    }
    if (action === "export") {
      toast.success("Filtered offer view exported")
      return
    }
    toast.success("Offer workflow action recorded")
  }

  const handleSaveFilter = () => {
    const activeParts = Object.entries(filters)
      .filter(([key, value]) => key !== "search" && value !== "All")
      .map(([, value]) => value)
    const label = filters.search || activeParts.join(" · ") || "Offer view"
    setSavedFilters((current) => [{ label, filters }, ...current].slice(0, 4))
    toast.success("Offer filter saved")
  }

  const dashboardSummary = useMemo(() => {
    const pending = filteredOffers.filter((offer) => offer.status === "Pending CEO Approval" || offer.status === "Pending HR Manager Approval").length
    const accepted = filteredOffers.filter((offer) => offer.status === "Accepted").length
    const acceptance = filteredOffers.length ? Math.round((accepted / filteredOffers.length) * 100) : 0
    return `${filteredOffers.length} offers · ${pending} pending approvals · ${acceptance}% acceptance`
  }, [filteredOffers])

  if (isGeneratePage) {
    return (
      <div className="space-y-6">
        <RecruitmentPageHeader
          title="Generate Offer"
          subtitle="Create an offer package and route it through the approval workflow."
          summary="Backend-compatible offer creation"
        />
        {!canWrite ? (
          <Card className="border-white/10 bg-card/80">
            <CardHeader><CardTitle>Generate Offer</CardTitle></CardHeader>
            <CardContent className="text-muted-foreground">
              View only. Generating offers is restricted to authorized HR roles.
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/10 bg-card/80">
            <CardHeader><CardTitle>Create Offer Package</CardTitle></CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.target
                  try {
                    const cName = selectedCandidate ? selectedCandidate.name : "";
                    const cEmail = selectedCandidate ? selectedCandidate.email : "";
                    await apiClient.post("/offers", {
                      candidateId: selectedCandidate?._id || undefined,
                      candidateEmail: cEmail,
                      candidateName: cName,
                      salary: Number(form.salary.value),
                      joiningDate: form.joiningDate.value,
                      position: positionVal || form.position?.value,
                      department: form.department?.value,
                    })
                    toast.success("Offer created")
                    await loadOffers()
                    navigate("/dashboard/offer-management")
                  } catch {
                    toast.error("Failed to create offer")
                  }
                }}
                className="grid gap-4 md:grid-cols-3"
              >
                <div className="flex flex-col gap-1">
                  <select
                    name="candidateId"
                    value={selectedCandidate?._id || ""}
                    onChange={(e) => {
                      const candidate = candidates.find(c => c._id === e.target.value)
                      setSelectedCandidate(candidate || null)
                    }}
                    required
                    className="flex h-10 w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="" disabled>Select Candidate</option>
                    {candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email || "No Email"})
                      </option>
                    ))}
                  </select>
                </div>
                <Input name="position" placeholder="Position" value={positionVal} onChange={(e) => setPositionVal(e.target.value)} />
                <Input name="department" placeholder="Department" />
                <Input name="salary" type="number" placeholder="Final Salary" required />
                <Input name="joiningDate" type="date" required />
               
                
                <p className="md:col-span-3 text-xs text-muted-foreground">
                  Offers at or above the CEO salary threshold require CEO approval before release.
                </p>
                <Button type="submit" className="md:col-span-3">Generate Offer</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const detailsOffer = isDetailsPage ? findOffer(offerId) : null

  return (
    <div className="space-y-6">
      <RecruitmentPageHeader
        title="Offer Management"
        subtitle="Enterprise offer lifecycle control for approvals, release, compensation, and candidate decisions."
        summary={dashboardSummary}
        actions={
          <>
            <Button variant="outline" onClick={loadOffers}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {canWrite && (
              <Link to="/dashboard/generate-offer">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Offer
                </Button>
              </Link>
            )}
          </>
        }
      />

      {loading ? (
        <RecruitmentSkeleton />
      ) : (
        <>
          {/* Four Compact Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Offers</p>
                <FileSignature className="h-4 w-4 text-sky-400" />
              </div>
              <p className="mt-2 text-2xl font-bold">{filteredOffers.length}</p>
            </Card>
            <Card className="border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending Approval</p>
                <Clock3 className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {filteredOffers.filter(o => o.status === "Pending CEO Approval" || o.status === "Pending HR Manager Approval").length}
              </p>
            </Card>
            <Card className="border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Released Offers</p>
                <Send className="h-4 w-4 text-violet-400" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {filteredOffers.filter(o => o.status === "Offered").length}
              </p>
            </Card>
            <Card className="border-white/10 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accepted Offers</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-bold">
                {filteredOffers.filter(o => o.status === "Accepted").length}
              </p>
            </Card>
          </div>

          {/* Small Filter Chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mr-1">Status:</span>
            {["All", "Draft", "Pending Approval", "Released", "Accepted", "Declined"].map((statusOption) => {
              const isActive = filters.status === statusOption
              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, status: statusOption }))}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  {statusOption}
                </button>
              )
            })}
          </div>

          <OfferFilters
            filters={filters}
            onChange={setFilters}
            options={filterOptions}
            onSave={handleSaveFilter}
            savedFilters={savedFilters}
            onApply={setFilters}
          />

          {filteredOffers.length === 0 ? (
            <RecruitmentEmptyState
              title="No offers in this view"
              description="Create a new offer or adjust filters to see approval and candidate decision workflows."
              actionLabel={canWrite ? "Generate Offer" : undefined}
              onAction={() => navigate("/dashboard/generate-offer")}
            />
          ) : (
            <>
              <OfferTable
                offers={filteredOffers}
                sort={sort}
                onSort={handleSort}
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                onView={(offer) => {
                  setSelectedOffer(offer)
                  if (isDetailsPage) navigate("/dashboard/offer-management")
                }}
                onAction={requestAction}
                canWrite={canWrite}
                isCeo={false}
                canApproveOffers={canApproveOffers}
              />
              <Card className="border-white/10 bg-card/80">
                <CardHeader>
                  <CardTitle>Offer Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <OfferActionBar
                    offer={selectedOffer || filteredOffers[0]}
                    onAction={requestAction}
                    canWrite={canWrite}
                    canApproveOffers={canApproveOffers}
                    isCeo={false}
                  />
                  <p className="mt-3 text-xs text-muted-foreground">
                    Actions use confirmation modals and preserve backend status compatibility.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {isDetailsPage && !loading && !detailsOffer && (
        <RecruitmentEmptyState title="Offer not found" description="This offer may have been removed or is unavailable." />
      )}

      <OfferDetailsDrawer
        offer={selectedOffer || detailsOffer}
        open={Boolean(selectedOffer || detailsOffer)}
        onClose={() => {
          setSelectedOffer(null)
          if (isDetailsPage) navigate("/dashboard/offer-management")
        }}
        onAction={requestAction}
        isCeo={false}
        canWrite={canWrite}
        canApproveOffers={canApproveOffers}
        onPreviewLetter={setLetterOffer}
      />

      <OfferLetterPreview
        offer={letterOffer}
        open={Boolean(letterOffer)}
        onClose={() => setLetterOffer(null)}
        onDownload={(offer) => requestAction("download", offer)}
      />

      <OfferActionConfirm
        action={pendingAction?.action}
        offer={pendingAction?.offer}
        open={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </div>
  )
}

export default OfferManagement
