"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, CheckCircle2, XCircle, Clock, Download, FileText, Eye } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Requests (HR Manager Supervision)</h1>
        <p className="text-muted-foreground">Monitor and supervise employee document requests</p>
      </div>

      <Card>
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
                  <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No document requests found.</td></tr>
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
                                  className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-indigo-200 bg-indigo-50/55 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/40 text-indigo-700 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                            className="h-8 px-3 text-xs font-semibold border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80 rounded-lg transition-all duration-150 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            onClick={() => handleOpenViewDetails(req)}
                          >
                            View Details
                          </Button>
                          {req.status !== "Rejected" ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 rounded-lg transition-all duration-150 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              onClick={() => handleOpenAddRemark(req)}
                            >
                              Add Remark
                            </Button>
                          ) : null}
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
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-150 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none flex items-center gap-1"
                              onClick={() => downloadFile(doc)}
                            >
                              <Download className="h-3.5 w-3.5 mr-1" /> Download
                            </Button>
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