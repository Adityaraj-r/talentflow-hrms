import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/services/apiClient"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, ShieldCheck, GraduationCap, Briefcase, User, Loader2, FolderOpen, Eye, FileDigit, Clock, XCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentPreviewDialog, forceCloudinaryDownload } from "@/components/ui/DocumentViewer"

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
  if (status === 'Verified' || status === 'Approved') {
    return <span className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><CheckCircle2 className="h-3 w-3"/> Approved</span>
  }
  if (status === 'Rejected') {
    return <span className="flex items-center gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><XCircle className="h-3 w-3"/> Rejected</span>
  }
  return <span className="flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider"><Clock className="h-3 w-3"/> Pending</span>
}



const MyDocuments = () => {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [activeTab, setActiveTab] = useState("All")

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
  const categories = ["All", "Onboarding"]
  
  const filteredDocs = activeTab === "All" ? docs : docs.filter(d => d.category === activeTab)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">My Documents</h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Securely view and download your uploaded compliance records.</p>
      </div>

      {docs.length === 0 ? (
        <Card className="border border-dashed border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 bg-muted/30">
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
                <Card key={doc._id} className="flex flex-col overflow-hidden transition-all border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900">
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

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog
        previewDoc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  )
}

export default MyDocuments