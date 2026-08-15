"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Search, Loader2, Eye, CheckCircle2, XCircle, Clock, Download, X, Check } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
import { UploadedDocumentsModal, DocumentPreviewDialog, getAttachments, getFileUrl, forceCloudinaryDownload, getFileName, formatFileSize, downloadFile } from "@/components/ui/DocumentViewer";

const DocumentRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Modals
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  
  // Form States
  const [uploadFiles, setUploadFiles] = useState([]);
  const [hrRemark, setHrRemark] = useState("");
  const [actioning, setActioning] = useState(false);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [activeReqAttachments, setActiveReqAttachments] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/document-requests/all");
      setRequests(res.data || []);
    } catch (error) {
      toast.error(error.error || error.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const counts = useMemo(() => {
    return requests.reduce((acc, req) => {
      if (req.status === "Pending") acc.pending++;
      else if (req.status === "Approved") acc.approved++;
      else if (req.status === "Rejected") acc.rejected++;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });
  }, [requests]);

  const pendingRequestsList = useMemo(() => {
    return requests.filter(r => r.status === "Pending");
  }, [requests]);

  const historyRequestsList = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return requests.filter(r => {
      const matchesSearch = !term || 
        r.requestId?.toLowerCase().includes(term) || 
        r.employeeName?.toLowerCase().includes(term) ||
        r.employeeId?.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [requests, searchQuery]);

  const handleOpenViewDetails = (req) => {
    setSelectedReq(req);
    setViewDetailsOpen(true);
  };

  const handleOpenApprove = (req) => {
    setSelectedReq(req);
    setUploadFiles([]);
    setHrRemark("");
    setApproveModalOpen(true);
  };

  const handleOpenReject = (req) => {
    setSelectedReq(req);
    setHrRemark("");
    setRejectModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles((prev) => {
      const merged = [...prev];
      for (const file of files) {
        const isDuplicate = merged.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        );
        if (!isDuplicate) {
          merged.push(file);
        }
      }
      return merged;
    });
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setUploadFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      toast.error("Please upload at least one document.");
      return;
    }

    setActioning(true);
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append("files", file);
      });
      if (hrRemark.trim()) {
        formData.append("hrRemark", hrRemark.trim());
      }

      const res = await apiClient.post(`/document-requests/approve/${selectedReq._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Document request approved successfully!");
      setApproveModalOpen(false);
      if (viewDetailsOpen && selectedReq && selectedReq._id === res.data.data._id) {
        setSelectedReq(res.data.data);
      }
      fetchRequests();
    } catch (error) {
      toast.error(error.error || error.message || "Failed to approve request");
    } finally {
      setActioning(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!hrRemark.trim()) {
      toast.error("HR Remark (rejection reason) is mandatory.");
      return;
    }

    setActioning(true);
    try {
      await apiClient.post(`/document-requests/reject/${selectedReq._id}`, {
        hrRemark: hrRemark.trim()
      });

      toast.success("Document request rejected.");
      setRejectModalOpen(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.error || error.message || "Failed to reject request");
    } finally {
      setActioning(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Approved") return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
    if (status === "Rejected") return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</span>;
    return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
  };



  const renderDocumentTypes = (docTypeStr) => {
    if (!docTypeStr) return null;
    const list = docTypeStr.split(',').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {list.map((type, idx) => (
          <span
            key={idx}
            className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-purple-100 dark:border-purple-800/40"
          >
            {type}
          </span>
        ))}
      </div>
    );
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">Document Requests (HR Officer)</h1>
        <p className="text-muted-foreground">Manage employee requests for official documents</p>
      </div>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-yellow-600 dark:text-yellow-400">Pending Requests</CardDescription>
                <CardTitle className="text-3xl">{counts.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-green-600 dark:text-green-400">Approved Requests</CardDescription>
                <CardTitle className="text-3xl">{counts.approved}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="font-semibold text-red-600 dark:text-red-400">Rejected Requests</CardDescription>
                <CardTitle className="text-3xl">{counts.rejected}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Pending Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Queue</CardTitle>
              <CardDescription>Document requests awaiting action</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Request ID</th>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Document Type</th>
                      <th className="px-4 py-3 font-medium">Purpose</th>
                      <th className="px-4 py-3 font-medium">Request Date</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                    ) : pendingRequestsList.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No pending requests.</td></tr>
                    ) : (
                      pendingRequestsList.map((req) => (
                        <tr key={req._id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                          <td className="px-4 py-3 font-bold">{req.requestId || "N/A"}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{req.employeeName}</div>
                            <div className="text-xs text-muted-foreground">ID: {req.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{req.documentType}</td>
                          <td className="px-4 py-3 max-w-[200px] truncate" title={req.purpose}>{req.purpose}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1.5 opacity-85 group-hover:opacity-100 transition-opacity duration-150">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                onClick={() => handleOpenViewDetails(req)}> <span title="View" className="flex items-center justify-center w-full h-full text-slate-600 hover:text-slate-800"><Eye className="h-4 w-4" /><span className="sr-only">View</span></span></Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-semibold bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400 dark:hover:bg-green-900/40 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                                onClick={() => handleOpenApprove(req)}> <span title="Approve" className="flex items-center justify-center w-full h-full text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /><span className="sr-only">Approve</span></span></Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-semibold bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                                onClick={() => handleOpenReject(req)}> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Request History</CardTitle>
                <CardDescription>All processed and pending document requests</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by ID, name..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Request ID</th>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Document Type</th>
                      <th className="px-4 py-3 font-medium">Request Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan="6" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                    ) : historyRequestsList.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No matching requests found.</td></tr>
                    ) : (
                      historyRequestsList.map((req) => (
                        <tr key={req._id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                          <td className="px-4 py-3 font-bold">{req.requestId || "N/A"}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{req.employeeName}</div>
                            <div className="text-xs text-muted-foreground">ID: {req.employeeId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{req.documentType}</td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end items-center gap-2 opacity-85 group-hover:opacity-100 transition-opacity duration-150">
                              {req.status === "Approved" && (
                                <>
                                  {getAttachments(req).length === 0 ? (
                                    <span className="text-xs text-muted-foreground italic">No documents uploaded yet.</span>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-purple-200 bg-purple-50/55 hover:bg-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-400 dark:hover:bg-purple-900/40 text-purple-700 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                      onClick={() => {
                                        setActiveReqAttachments(req);
                                        setAttachmentsModalOpen(true);
                                      }}
                                    >
                                      {getAttachments(req).length === 1 ? (
                                        <span>📄</span>
                                      ) : (
                                        <span className="flex items-center gap-1">
                                          <span>📎</span>
                                          <span>{getAttachments(req).length}</span>
                                        </span>
                                      )}
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
                                onClick={() => handleOpenViewDetails(req)}
                              >
                                View Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedReq && (
            <div className="space-y-5 py-2">
              <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReq.requestId || "N/A"}</span>
                  {getStatusBadge(selectedReq.status)}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-medium">
                  <Info label="Employee Name" value={selectedReq.employeeName} />
                  <Info label="Employee ID" value={selectedReq.employeeId} />
                  <div className="col-span-2">
                    <Info label="Department" value={selectedReq.department} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Request Information</h3>
                <div className="space-y-2 text-sm leading-relaxed">
                  <div><strong>Document Type:</strong> {renderDocumentTypes(selectedReq.documentType)}</div>
                  <div>
                    <strong>Purpose:</strong>
                    <p className="bg-muted/40 p-2.5 rounded-lg border text-slate-600 dark:text-slate-300 mt-1">{selectedReq.purpose}</p>
                  </div>
                  {selectedReq.additionalNotes && (
                    <div>
                      <strong>Additional Notes:</strong>
                      <p className="bg-muted/40 p-2.5 rounded-lg border text-slate-600 dark:text-slate-300 mt-1">{selectedReq.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Remarks History</h3>
                {selectedReq.remarks && selectedReq.remarks.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedReq.remarks.map((r, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-800 border p-2.5 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between items-center font-semibold text-slate-700 dark:text-slate-300">
                          <span>{r.addedBy} ({r.role})</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 break-words">{r.remark}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No remarks added yet.</p>
                )}
              </div>

              {/* Uploaded Documents List */}
              {selectedReq.status === "Approved" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Uploaded Documents</h3>
                  {getAttachments(selectedReq).length > 0 ? (
                    <div className="space-y-2">
                      {getAttachments(selectedReq).map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/55 dark:bg-slate-900/30 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 bg-purple-500/10 text-purple-505 dark:text-purple-400 rounded-lg shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0 text-left justify-center">
                              <span className="font-semibold text-sm text-slate-805 dark:text-slate-200 truncate" title={doc.originalName}>
                                {doc.originalName}
                              </span>
                              {doc.fileSize > 0 && (
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                              onClick={() => setPreviewDoc(doc)}> <span title="View" className="flex items-center justify-center w-full h-full text-slate-600 hover:text-slate-800"><Eye className="h-4 w-4" /><span className="sr-only">View</span></span></Button>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-150 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none flex items-center gap-1"
                              onClick={() => downloadFile(doc)}> <span title="Download" className="flex items-center justify-center w-full h-full "><Download className="h-4 w-4" /><span className="sr-only">Download</span></span></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30 font-medium">
                      Documents are being prepared by HR.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-3">
            <Button onClick={() => setViewDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Modal (Approve + Upload multiple documents of any format) */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[760px] max-h-[92vh] overflow-y-auto p-0 rounded-xl shadow-xl">
          <DialogHeader className="px-7 py-6 border-b border-slate-200 dark:border-slate-800">
            <DialogTitle className="text-2xl font-bold tracking-tight pr-8">Approve Document Request</DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <form onSubmit={handleApproveSubmit} className="px-7 py-6 space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Request Information</h3>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Employee</div>
                      <div className="font-semibold leading-6 text-slate-900 dark:text-slate-100 break-words">{selectedReq.employeeName}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground">Requested Documents</div>
                      <div className="font-semibold leading-6 text-slate-900 dark:text-slate-100 break-words">{selectedReq.documentType}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                <div className="space-y-1">
                  <Label htmlFor="documentFiles" className="text-sm font-semibold text-slate-800 dark:text-slate-200">Upload Documents <span className="text-red-500">*</span></Label>
                  <p className="text-xs text-muted-foreground">Select one or more documents (PDF, JPG, PNG, DOCX, etc.) for this employee.</p>
                </div>
                <div className="w-full">
                  <Input
                    id="documentFiles"
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className={uploadFiles.length > 0 ? "sr-only" : "h-12 w-full cursor-pointer rounded-lg border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors file:mr-4 file:h-8 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:text-sm file:font-semibold file:text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-slate-700 dark:bg-slate-950 dark:file:bg-slate-800 dark:file:text-slate-200 dark:hover:bg-slate-900"}
                    required={uploadFiles.length === 0}
                  />
                </div>
                {uploadFiles && uploadFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <span className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Selected Files</span>
                      {uploadFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:ring-slate-800">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span className="min-w-0 flex-1 break-words font-medium" title={file.name}>{file.name}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">({formatFileSize(file.size)})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 shrink-0 rounded-md px-2 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-500"
                            onClick={() => handleRemoveFile(idx)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-full rounded-lg text-xs font-semibold transition-all hover:bg-slate-50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500 dark:hover:bg-slate-900"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      + Add More Files
                    </Button>
                  </div>
                )}
              </section>

              <section className="space-y-3 border-t border-slate-200 pt-6 dark:border-slate-800">
                <Label htmlFor="hrApproveRemark" className="text-sm font-semibold text-slate-800 dark:text-slate-200">HR Remarks (Optional)</Label>
                <Textarea
                  id="hrApproveRemark"
                  placeholder="Enter any optional approval notes..."
                  value={hrRemark}
                  onChange={(e) => setHrRemark(e.target.value)}
                  rows={5}
                  className="min-h-[140px] w-full resize-y rounded-lg border-slate-300 p-4 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-slate-700"
                />
              </section>

              <DialogFooter className="border-t border-slate-200 pt-6 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setApproveModalOpen(false)}
                  disabled={actioning}
                  className="h-11 min-w-[120px] rounded-lg font-semibold transition-all hover:bg-slate-50 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500 dark:hover:bg-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 min-w-[170px] rounded-lg bg-green-600 font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md focus-visible:ring-2 focus-visible:ring-green-500"
                  disabled={actioning}
                >
                  {actioning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Approve and Send
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Request Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reject Document Request</DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <form onSubmit={handleRejectSubmit} className="space-y-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg text-sm space-y-1">
                <div><strong>Employee:</strong> {selectedReq.employeeName}</div>
                <div><strong>Document:</strong> {selectedReq.documentType}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hrRejectRemark">HR Remarks / Rejection Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  id="hrRejectRemark"
                  placeholder="Provide the reason for rejection (mandatory)..."
                  value={hrRemark}
                  onChange={(e) => setHrRemark(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <DialogFooter className="border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setRejectModalOpen(false)} disabled={actioning}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={actioning}>
                  {actioning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reject Request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Uploaded Documents List Modal */}
      <UploadedDocumentsModal
        open={attachmentsModalOpen}
        onOpenChange={(open) => {
          setAttachmentsModalOpen(open);
          if (!open) setActiveReqAttachments(null);
        }}
        activeRequest={activeReqAttachments}
        onViewFile={(file) => setPreviewDoc(file)}
      />

      {/* Document Preview Dialog */}
      <DocumentPreviewDialog
        previewDoc={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-semibold text-slate-800 dark:text-slate-200">{value || "-"}</div>
  </div>
);

export default DocumentRequests;
