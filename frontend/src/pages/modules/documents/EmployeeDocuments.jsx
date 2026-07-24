import { useState, useEffect, useRef } from "react"
import apiClient from "@/services/apiClient"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Download, ShieldCheck, GraduationCap, Briefcase, User, Loader2, FolderOpen, Eye, FileDigit, Clock, XCircle, CheckCircle2, ZoomIn, ZoomOut, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const getDocumentIcon = (category) => {
  switch (category) {
    case 'Personal': return <User className="h-8 w-8 text-green-500" />
    case 'Education': return <GraduationCap className="h-8 w-8 text-purple-500" />
    case 'Employment': return <Briefcase className="h-8 w-8 text-orange-500" />
    case 'Onboarding': return <ShieldCheck className="h-8 w-8 text-blue-500" />
    case 'Payroll': return <FileDigit className="h-8 w-8 text-indigo-500" />
    case 'Requested': return <FileText className="h-8 w-8 text-rose-500" />
    default: return <FileText className="h-8 w-8 text-gray-500" />
  }
}

const getStatusBadge = (status) => {
  if (status === 'Verified' || status === 'Approved') {
    return <span className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><CheckCircle2 className="h-3 w-3"/> Approved</span>
  }
  if (status === 'Rejected') {
    return <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><XCircle className="h-3 w-3"/> Rejected</span>
  }
  return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><Clock className="h-3 w-3"/> Pending</span>
}

const getFileUrl = (url) => {
  if (!url) return "#";
  return url.startsWith("http") ? url : `http://localhost:5001${url}`;
};

const forceCloudinaryDownload = (url) => {
  if (!url) return "#"
  const finalUrl = getFileUrl(url)
  const parts = finalUrl.split('/upload/')
  if (parts.length === 2) {
    return `${parts[0]}/upload/fl_attachment/${parts[1]}`
  }
  return finalUrl
}

const isImageFile = (doc) => {
  if (!doc) return false
  if (doc.fileType && doc.fileType.startsWith('image/')) return true
  if (doc.filePath && /\.(jpg|jpeg|png|gif|webp)$/i.test(doc.filePath)) return true
  return false
}

const isPdfFile = (doc) => {
  if (!doc) return false
  if (doc.fileType && doc.fileType === 'application/pdf') return true
  if (doc.filePath && doc.filePath.toLowerCase().includes('.pdf')) return true
  return false
}

const EmployeeDocuments = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [aggregatedData, setAggregatedData] = useState(null)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [activeTab, setActiveTab] = useState("All")
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  const dropdownRef = useRef(null)

  // Handle click outside search dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle employee search as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await apiClient.get(`/documents/employee-documents/search?query=${encodeURIComponent(searchQuery)}`)
        setSearchResults(Array.isArray(results) ? results : [])
        setShowDropdown(true)
      } catch (err) {
        console.error("Search failed:", err)
      } finally {
        setIsSearching(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSelectEmployee = async (emp) => {
    setSelectedEmployee(emp)
    setSearchQuery(`${emp.firstName} ${emp.lastName || ""}`.trim())
    setShowDropdown(false)
    setIsLoadingDocs(true)
    setActiveTab("All")
    
    try {
      const data = await apiClient.get(`/documents/employee-documents/aggregate/${emp.employeeCode || emp._id}`)
      setAggregatedData(data)
    } catch (err) {
      console.error("Failed to load aggregated documents:", err)
      setAggregatedData(null)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  // Map backend arrays to category keys
  const onboardingDocs = aggregatedData?.onboardingDocs || []
  const employmentDocs = aggregatedData?.employmentDocs || []
  const requestedDocs = aggregatedData?.requestedDocs || []
  const otherDocs = aggregatedData?.otherDocs || []

  const totalCount = onboardingDocs.length + employmentDocs.length + requestedDocs.length + otherDocs.length

  const renderDocumentGrid = (docsList) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {docsList.map((doc) => (
        <Card key={doc._id} className="flex flex-col overflow-hidden transition-all hover:shadow-md border-muted">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border">
                {getDocumentIcon(doc.category)}
              </div>
              {getStatusBadge(doc.status)}
            </div>
            <CardTitle className="text-base mt-4 line-clamp-1" title={doc.originalName}>
              {doc.originalName}
            </CardTitle>
            <div className="flex flex-col gap-0.5 mt-2">
              <p className="text-[11px] text-muted-foreground">
                Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Category: {doc.category}
              </p>
              {doc.uploadedBy && (
                <p className="text-[11px] text-slate-400">
                  Source: {doc.uploadedBy}
                </p>
              )}
            </div>
          </CardHeader>
          <CardFooter className="p-4 mt-auto grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setSelectedDoc(doc)}
            >
              <Eye className="h-4 w-4" /> View
            </Button>
            <Button 
              variant="default" 
              className="w-full flex items-center justify-center gap-2"
              onClick={() => window.open(forceCloudinaryDownload(doc.filePath), '_blank')}
            >
              <Download className="h-4 w-4" /> Save
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Documents</h1>
        <p className="text-muted-foreground">Search and view compliance and employment documents across all modules.</p>
      </div>

      {/* Search Section */}
      <Card className="border border-muted relative z-30">
        <CardContent className="pt-6">
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search employee by Employee ID, Email, or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Dropdown menu */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-muted rounded-md shadow-lg max-h-60 overflow-y-auto z-50 custom-scrollbar">
                {searchResults.map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="flex flex-col px-4 py-2.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-muted last:border-0"
                  >
                    <span className="font-semibold text-sm text-foreground">
                      {emp.firstName} {emp.lastName || ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ID: {emp.employeeCode || "N/A"} | Email: {emp.email || emp.workEmail || "N/A"} | Dept: {emp.department || "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {showDropdown && searchResults.length === 0 && searchQuery.trim() && !isSearching && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-muted rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground z-50">
                No matching employees found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading Docs Indicator */}
      {isLoadingDocs && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading employee documents...</p>
        </div>
      )}

      {/* Selected Employee Info & Documents */}
      {!isLoadingDocs && selectedEmployee && aggregatedData && (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-muted bg-slate-50/50 dark:bg-slate-900/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block uppercase font-semibold">Name</span>
                  <span className="font-medium text-foreground text-base">
                    {aggregatedData.employee.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block uppercase font-semibold">Employee ID</span>
                  <span className="font-medium text-foreground text-base">
                    {aggregatedData.employee.employeeCode || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block uppercase font-semibold">Email</span>
                  <span className="font-medium text-foreground text-base truncate block" title={aggregatedData.employee.email}>
                    {aggregatedData.employee.email || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block uppercase font-semibold">Department</span>
                  <span className="font-medium text-foreground text-base">
                    {aggregatedData.employee.department}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block uppercase font-semibold">Designation</span>
                  <span className="font-medium text-foreground text-base">
                    {aggregatedData.employee.designation}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Aggregation Viewer */}
          {totalCount === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold">No Documents Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  No documents found for this employee.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 flex flex-wrap h-auto">
                <TabsTrigger value="All" className="px-4 py-2">
                  All Populated ({totalCount})
                </TabsTrigger>
                <TabsTrigger value="Onboarding" className="px-4 py-2">
                  Onboarding Documents ({onboardingDocs.length})
                </TabsTrigger>
                <TabsTrigger value="Employment" className="px-4 py-2">
                  Employment Documents ({employmentDocs.length})
                </TabsTrigger>
                <TabsTrigger value="Requested" className="px-4 py-2">
                  Requested Documents ({requestedDocs.length})
                </TabsTrigger>
                <TabsTrigger value="Other" className="px-4 py-2">
                  Other Documents ({otherDocs.length})
                </TabsTrigger>
              </TabsList>

              {/* All tab: Stacked view showing only populated sections */}
              <TabsContent value="All" className="mt-0 space-y-8">
                {onboardingDocs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-500" /> Onboarding Documents
                    </h3>
                    {renderDocumentGrid(onboardingDocs)}
                  </div>
                )}

                {employmentDocs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-orange-500" /> Employment Documents
                    </h3>
                    {renderDocumentGrid(employmentDocs)}
                  </div>
                )}

                {requestedDocs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-rose-500" /> Requested Documents (Approved)
                    </h3>
                    {renderDocumentGrid(requestedDocs)}
                  </div>
                )}

                {otherDocs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-green-500" /> Other Documents
                    </h3>
                    {renderDocumentGrid(otherDocs)}
                  </div>
                )}
              </TabsContent>

              {/* Onboarding Category Tab */}
              <TabsContent value="Onboarding" className="mt-0">
                {onboardingDocs.length > 0 ? (
                  renderDocumentGrid(onboardingDocs)
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No documents available.
                  </div>
                )}
              </TabsContent>

              {/* Employment Category Tab */}
              <TabsContent value="Employment" className="mt-0">
                {employmentDocs.length > 0 ? (
                  renderDocumentGrid(employmentDocs)
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No documents available.
                  </div>
                )}
              </TabsContent>

              {/* Requested Category Tab */}
              <TabsContent value="Requested" className="mt-0">
                {requestedDocs.length > 0 ? (
                  renderDocumentGrid(requestedDocs)
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No documents available.
                  </div>
                )}
              </TabsContent>

              {/* Other Category Tab */}
              <TabsContent value="Other" className="mt-0">
                {otherDocs.length > 0 ? (
                  renderDocumentGrid(otherDocs)
                ) : (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    No documents available.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* Initial Empty State before searching */}
      {!selectedEmployee && !isLoadingDocs && (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
            <h3 className="text-lg font-semibold">Select an Employee</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Use the search bar above to query an employee by ID, Email, or Name to aggregate their documents.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document View Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => {
        if (!open) {
          setSelectedDoc(null)
          setZoomLevel(1)
        }
      }}>
        <DialogContent className={cn(
          "flex flex-col p-0 overflow-hidden bg-background",
          selectedDoc && isPdfFile(selectedDoc) ? "max-w-[98vw] w-[98vw] h-[102vh] max-h-[110vh]" : "sm:max-w-4xl md:max-w-[80vw] h-[85vh]"
        )}>
          <DialogHeader className={cn(
            "border-b bg-muted/30 flex-shrink-0",
            selectedDoc && isPdfFile(selectedDoc) ? "px-4 py-2" : "p-4"
          )}>
           <DialogTitle className="flex justify-between items-center pr-6">
            <span className={cn("truncate pr-4", selectedDoc && isPdfFile(selectedDoc) && "text-base")}>
              {selectedDoc?.originalName}
            </span>
            <div className="flex items-center gap-4">
              {selectedDoc && !isPdfFile(selectedDoc) && (
                <div className="flex items-center gap-1 bg-background border rounded-md px-1 py-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} title="Zoom Out">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <span className="text-xs font-medium w-9 text-center">{Math.round(zoomLevel * 100)}%</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} title="Zoom In">
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}
              {selectedDoc && getStatusBadge(selectedDoc.status)}
            </div>
          </DialogTitle>
          </DialogHeader>
          
          <div className={cn(
            "flex-1 bg-muted/10 relative",
            selectedDoc && isPdfFile(selectedDoc) ? "w-full h-full" : "flex items-center justify-center p-4 overflow-auto custom-scrollbar"
          )}>
            {selectedDoc && isImageFile(selectedDoc) ? (
              <img 
                src={getFileUrl(selectedDoc.filePath)} 
                alt={selectedDoc.originalName}
                className="max-w-full max-h-full object-contain rounded-md shadow-sm transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              />
            ) : selectedDoc && isPdfFile(selectedDoc) ? (
              <iframe 
                src={`${getFileUrl(selectedDoc.filePath)}#view=FitH`} 
                className="w-full h-full border-0 bg-white"
                title={selectedDoc.originalName}
              />
            ) : selectedDoc ? (
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', width: '100%', height: '100%' }}
              >
                <iframe 
                  src={getFileUrl(selectedDoc.filePath)} 
                  className="w-full h-full border-0 bg-white shadow-sm"
                  title={selectedDoc.originalName}
                />
              </div>
            ) : null}
          </div>
          
          <div className={cn(
            "border-t bg-muted/30 flex justify-end flex-shrink-0",
            selectedDoc && isPdfFile(selectedDoc) ? "px-4 py-2" : "p-4"
          )}>
            <Button 
              size={selectedDoc && isPdfFile(selectedDoc) ? "sm" : "default"} 
              onClick={() => window.open(forceCloudinaryDownload(selectedDoc?.filePath), '_blank')} 
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" /> Download Original File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EmployeeDocuments
