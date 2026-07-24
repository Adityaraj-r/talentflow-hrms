"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, Eye, CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
import JSZip from "jszip";

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

  const getFileUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `http://localhost:5001${url}`;
  };

  const forceCloudinaryDownload = (url) => {
    if (!url) return "#";
    const finalUrl = getFileUrl(url);
    const parts = finalUrl.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
    }
    return finalUrl;
  };

  const getFileName = (url) => {
    if (!url) return "";
    const filename = url.substring(url.lastIndexOf('/') + 1);
    return filename.split('?')[0]; // Remove query params if any
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

  const getAttachments = (req) => {
    if (!req) return [];
    if (req.uploadedDocuments && req.uploadedDocuments.length > 0) {
      return req.uploadedDocuments;
    }
    if (req.documentPaths && req.documentPaths.length > 0) {
      return req.documentPaths.map((path) => ({
        originalName: getFileName(path),
        filePath: path,
        fileSize: 0,
        mimeType: "",
        uploadedAt: req.updatedAt || req.createdAt
      }));
    }
    if (req.documentPath) {
      return [{
        originalName: getFileName(req.documentPath),
        filePath: req.documentPath,
        fileSize: 0,
        mimeType: "",
        uploadedAt: req.updatedAt || req.createdAt
      }];
    }
    return [];
  };

  const downloadAllAsZip = async (attachments, requestId) => {
    try {
      toast.loading("Generating ZIP file...", { id: "zip-download" });
      const zip = new JSZip();
      
      const fetchPromises = attachments.map(async (file) => {
        const fileUrl = forceCloudinaryDownload(file.filePath);
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`Failed to fetch ${file.originalName}`);
        const blob = await res.blob();
        zip.file(file.originalName, blob);
      });

      await Promise.all(fetchPromises);
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `documents_${requestId || "request"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success("ZIP downloaded successfully!", { id: "zip-download" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate ZIP. Please download files individually.", { id: "zip-download" });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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
                    <tr key={req._id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-bold">{req.requestId || "N/A"}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{req.employeeName}</div>
                        <div className="text-xs text-muted-foreground">ID: {req.employeeId}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{req.documentType}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {req.status === "Approved" && (
                            <>
                              {getAttachments(req).length === 0 ? (
                                <span className="text-xs text-muted-foreground italic">No documents uploaded yet.</span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-blue-200 bg-blue-50 hover:bg-blue-100/70 text-blue-700 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400"
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
                          <Button variant="outline" size="sm" onClick={() => handleOpenViewDetails(req)}>
                            View Details
                          </Button>
                          {req.status !== "Rejected" ? (
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => handleOpenAddRemark(req)}>
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
                  {((selectedReq.uploadedDocuments && selectedReq.uploadedDocuments.length > 0) ||
                    (selectedReq.documentPaths && selectedReq.documentPaths.length > 0) ||
                    selectedReq.documentPath) ? (
                    <div className="space-y-2">
                      {selectedReq.uploadedDocuments && selectedReq.uploadedDocuments.length > 0 ? (
                        selectedReq.uploadedDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 border rounded-lg text-xs">
                            <div className="space-y-0.5 truncate max-w-[280px]">
                              <span className="font-medium text-slate-700 dark:text-slate-300 block truncate" title={doc.originalName || getFileName(doc.filePath)}>
                                {idx + 1}. {doc.originalName || getFileName(doc.filePath)}
                              </span>
                              {doc.fileSize > 0 && (
                                <span className="text-[10px] text-muted-foreground block font-normal">
                                  {formatFileSize(doc.fileSize)}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(doc.filePath), "_blank")}>
                                View
                              </Button>
                              <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(doc.filePath), "_blank")}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : selectedReq.documentPaths && selectedReq.documentPaths.length > 0 ? (
                        selectedReq.documentPaths.map((path, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 border rounded-lg text-xs">
                            <div className="space-y-0.5 truncate max-w-[280px]">
                              <span className="font-medium text-slate-700 dark:text-slate-300 block truncate" title={getFileName(path)}>
                                {idx + 1}. {getFileName(path)}
                              </span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(path), "_blank")}>
                                View
                              </Button>
                              <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(path), "_blank")}>
                                <Download className="w-3.5 h-3.5 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 border rounded-lg text-xs">
                          <div className="space-y-0.5 truncate max-w-[280px]">
                            <span className="font-medium text-slate-700 dark:text-slate-300 block truncate" title={getFileName(selectedReq.documentPath)}>
                              1. {getFileName(selectedReq.documentPath)}
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(selectedReq.documentPath), "_blank")}>
                              View
                            </Button>
                            <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(selectedReq.documentPath), "_blank")}>
                              <Download className="w-3.5 h-3.5 mr-1" /> Download
                            </Button>
                          </div>
                        </div>
                      )}
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

      {/* Attachments List Modal */}
      <Dialog open={attachmentsModalOpen} onOpenChange={setAttachmentsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Uploaded Documents</DialogTitle>
          </DialogHeader>
          
          {activeReqAttachments && (
            <div className="space-y-4 py-2">
              <div className="space-y-3 divide-y border rounded-lg p-3 max-h-[300px] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                {getAttachments(activeReqAttachments).map((file, idx) => (
                  <div key={idx} className={`flex items-center justify-between gap-3 text-xs py-2.5 ${idx === 0 ? "pt-0" : ""}`}>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.originalName}>
                        ✓ {file.originalName}
                      </span>
                      {file.fileSize > 0 && (
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {formatFileSize(file.fileSize)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => window.open(getFileUrl(file.filePath), "_blank")}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => window.open(forceCloudinaryDownload(file.filePath), "_blank")}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {getAttachments(activeReqAttachments).length > 1 && (
                <Button
                  onClick={() => downloadAllAsZip(getAttachments(activeReqAttachments), activeReqAttachments.requestId)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download All (.zip)
                </Button>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t pt-3">
            <Button onClick={() => {
              setAttachmentsModalOpen(false);
              setActiveReqAttachments(null);
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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