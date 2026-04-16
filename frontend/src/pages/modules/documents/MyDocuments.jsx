import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/services/apiClient"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, ShieldCheck, GraduationCap, Briefcase, User, Loader2, FolderOpen, Eye, FileDigit, Clock, XCircle, CheckCircle2, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

const getDocumentIcon = (category) => {
  switch (category) {
    case 'Personal': return <User className="h-8 w-8 text-green-500" />
    case 'Education': return <GraduationCap className="h-8 w-8 text-purple-500" />
    case 'Employment': return <Briefcase className="h-8 w-8 text-orange-500" />
    case 'Onboarding': return <ShieldCheck className="h-8 w-8 text-blue-500" />
    case 'Payroll': return <FileDigit className="h-8 w-8 text-indigo-500" />
    default: return <FileText className="h-8 w-8 text-gray-500" />
  }
}

const getStatusBadge = (status) => {
  if (status === 'Verified') {
    return <span className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><CheckCircle2 className="h-3 w-3"/> Verified</span>
  }
  if (status === 'Rejected') {
    return <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><XCircle className="h-3 w-3"/> Rejected</span>
  }
  return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><Clock className="h-3 w-3"/> Pending</span>
}

const forceCloudinaryDownload = (url) => {
  if (!url) return "#"
  const parts = url.split('/upload/')
  if (parts.length === 2) {
    return `${parts[0]}/upload/fl_attachment/${parts[1]}`
  }
  return url
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

const MyDocuments = () => {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [activeTab, setActiveTab] = useState("All")
  const [zoomLevel, setZoomLevel] = useState(1)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['myUploadedDocuments'],
    queryFn: () => apiClient.get('/documents/my-documents'),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Retrieving your secure documents...</p>
      </div>
    )
  }

  const docs = Array.isArray(documents) ? documents : []
  const categories = ["All", ...new Set(docs.map(d => d.category).filter(Boolean))]
  
  const filteredDocs = activeTab === "All" ? docs : docs.filter(d => d.category === activeTab)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Documents</h1>
        <p className="text-muted-foreground">Securely view and download your uploaded compliance records.</p>
      </div>

      {docs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No Documents Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              You have no documents uploaded to your vault yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex flex-wrap h-auto">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="px-4 py-2">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocs.map((doc) => (
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
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
          </TabsContent>
        </Tabs>
      )}

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
                src={selectedDoc.filePath} 
                alt={selectedDoc.originalName}
                className="max-w-full max-h-full object-contain rounded-md shadow-sm transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
              />
            ) : selectedDoc && isPdfFile(selectedDoc) ? (
              <iframe 
                src={`${selectedDoc.filePath}#view=FitH`} 
                className="w-full h-full border-0 bg-white"
                title={selectedDoc.originalName}
              />
            ) : selectedDoc ? (
              <div 
                className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center', width: '100%', height: '100%' }}
              >
                <iframe 
                  src={selectedDoc.filePath} 
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

export default MyDocuments