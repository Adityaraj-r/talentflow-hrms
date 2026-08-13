"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Download, FileText, Eye, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
import { UploadedDocumentsModal, DocumentPreviewDialog, getAttachments, getFileUrl, forceCloudinaryDownload, getFileName, formatFileSize, downloadFile } from "@/components/ui/DocumentViewer";

const DocumentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  
  // Modals
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [remarkModalOpen, setRemarkModalOpen] = useState(false);
  
  // Form State
  const [supervisorRemark, setSupervisorRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);
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

  const handleOpenAddRemark = (req) => {
    setSelectedReq(req);
    setSupervisorRemark("");
    setRemarkModalOpen(true);
  };

  const handleRemarkSubmit = async (e) => {
    e.preventDefault();
    if (!supervisorRemark.trim()) {
      toast.error("Remark text is required.");
      return;
    }

    setSavingRemark(true);
    try {
      const res = await apiClient.post(`/document-requests/supervisor-remark/${selectedReq._id}`, {
        remark: supervisorRemark.trim()
      });

      toast.success("Supervisor Remark added successfully!");
      setRemarkModalOpen(false);
      
      // Update selected request in details modal if open
      if (viewDetailsOpen && selectedReq && selectedReq._id === res.data.data._id) {
        setSelectedReq({
          ...selectedReq,
          remarks: res.data.data.remarks
        });
      }

      fetchRequests();
    } catch (error) {
      toast.error(error.error || error.message || "Failed to add remark");
    } finally {
      setSavingRemark(false);
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
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-blue-100 dark:border-blue-800/40"
          >
            {type}
          </span>
        ))}
      </div>
    );
  };





  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Document Requests (HR Manager Supervision)</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Monitor and supervise employee document requests</p>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle>Request History</CardTitle>
            <CardDescription>View status and history of all requests</CardDescription>
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
            <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                  <TableHead className="px-4 py-3 font-medium">Request ID</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Employee</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Document Type</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Request Date</TableHead>
                  <TableHead className="px-4 py-3 font-medium">Status</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan="6" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : historyRequestsList.length === 0 ? (
                  <TableRow><TableCell colSpan="6" className="text-center py-8 text-muted-foreground">No document requests found.</TableCell></TableRow>
                ) : (
                  historyRequestsList.map((req) => (
                    <TableRow key={req._id} className="hover:bg-muted/10 group">
                      <TableCell className="px-4 py-3 font-bold">{req.requestId || "N/A"}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{req.employeeName}</div>
                        <div className="text-xs text-muted-foreground">ID: {req.employeeId}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3 whitespace-nowrap">{req.documentType}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="px-4 py-3">{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-85 group-hover:opacity-100 transition-opacity duration-150">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={req.status !== "Approved" || getAttachments(req).length === 0}
                                    className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-indigo-200 bg-indigo-50/55 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 text-indigo-700 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                                    onClick={() => {
                                      if (req.status === "Approved" && getAttachments(req).length > 0) {
                                        setActiveReqAttachments(req);
                                        setAttachmentsModalOpen(true);
                                      }
                                    }}
                                  >
                                    <span className="flex items-center gap-1">
                                      <span>📎</span>
                                      <span>{getAttachments(req).length}</span>
                                    </span>
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {req.status !== "Approved" ? "Request is not approved yet" :
                                   getAttachments(req).length === 0 ? "No documents uploaded yet" :
                                   "View Attachments"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-8 w-8 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 shrink-0"
                                  onClick={() => handleOpenViewDetails(req)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>View Details</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    disabled={req.status === "Rejected"}
                                    className="h-8 w-8 border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => {
                                      if (req.status !== "Rejected") handleOpenAddRemark(req);
                                    }}
                                  >
                                    <MessageSquarePlus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{req.status === "Rejected" ? "Request is already rejected" : "Add Remark"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Request Details (HR Manager)</DialogTitle>
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
                <div className="flex justify-between items-center border-b pb-1">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Remarks History</h3>
                  {selectedReq.status !== "Rejected" && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-blue-600 hover:text-blue-700" onClick={() => handleOpenAddRemark(selectedReq)}>
                      + Add Supervisor Remark
                    </Button>
                  )}
                </div>
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
                            <div className="p-2.5 bg-indigo-500/10 text-indigo-505 dark:text-indigo-400 rounded-lg shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col min-w-0 text-left justify-center">
                              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate" title={doc.originalName}>
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
                              className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

      {/* Add Supervisor Remark Dialog */}
      <Dialog open={remarkModalOpen} onOpenChange={setRemarkModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Supervisor Remark</DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <form onSubmit={handleRemarkSubmit} className="space-y-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-900 border p-3 rounded-lg text-sm space-y-1">
                <div><strong>Employee:</strong> {selectedReq.employeeName}</div>
                <div><strong>Document:</strong> {selectedReq.documentType}</div>
                <div><strong>Current Status:</strong> {selectedReq.status}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorRemarkText">Supervisor Remarks <span className="text-red-500">*</span></Label>
                <Textarea
                  id="supervisorRemarkText"
                  placeholder="Provide guidance or instructions..."
                  value={supervisorRemark}
                  onChange={(e) => setSupervisorRemark(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <DialogFooter className="border-t pt-3">
                <Button type="button" variant="outline" onClick={() => setRemarkModalOpen(false)} disabled={savingRemark}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={savingRemark}>
                  {savingRemark && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Remark
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