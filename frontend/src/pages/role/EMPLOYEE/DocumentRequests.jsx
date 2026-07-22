import { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Clock, CheckCircle, XCircle, Loader2, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import JSZip from "jszip";

const RequestDocument = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    documentType: "",
    purpose: "",
    additionalNotes: ""
  });
  const [docTypes, setDocTypes] = useState([]);
  const [currentDocType, setCurrentDocType] = useState("");
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [activeReqAttachments, setActiveReqAttachments] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/document-requests/my-requests");
      setRequests(res.data || []);
    } catch (error) {
      toast.error(error.error || error.message || "Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAddDocType = () => {
    const val = currentDocType.trim();
    if (!val) return;

    if (docTypes.length >= 10) {
      toast.error("Maximum of 10 requested documents reached.");
      return;
    }

    if (docTypes.some(tag => tag.toLowerCase() === val.toLowerCase())) {
      toast.error("This document type has already been added.");
      return;
    }

    setDocTypes((prev) => [...prev, val]);
    setCurrentDocType("");
  };

  const handleRemoveDocType = (index) => {
    setDocTypes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddDocType();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalDocTypes = [...docTypes];
    const currentVal = currentDocType.trim();
    if (currentVal) {
      if (!finalDocTypes.some(tag => tag.toLowerCase() === currentVal.toLowerCase()) && finalDocTypes.length < 10) {
        finalDocTypes.push(currentVal);
      }
    }

    if (finalDocTypes.length === 0) {
      return toast.error("Please add at least one document type.");
    }
    if (!formData.purpose.trim()) {
      return toast.error("Please specify a purpose for your request.");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        documentType: finalDocTypes.join(", ")
      };
      await apiClient.post("/document-requests/create", payload);
      toast.success("Request submitted successfully");
      setDocTypes([]);
      setCurrentDocType("");
      setFormData({ documentType: "", purpose: "", additionalNotes: "" });
      fetchRequests();
    } catch (error) {
      toast.error(error.error || error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
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

  const getStatusBadge = (status) => {
    if (status === "Approved") return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Approved</span>;
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

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Document Requests</h1>
        <p className="text-muted-foreground">Submit a request to HR for official company documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Specify the document and reason for your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter document type..."
                    value={currentDocType}
                    onChange={(e) => setCurrentDocType(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button type="button" variant="outline" onClick={handleAddDocType}>
                    Add
                  </Button>
                </div>
                
                {docTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 p-2 bg-slate-50 dark:bg-slate-900 border rounded-lg max-h-[120px] overflow-y-auto w-full">
                    {docTypes.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-blue-100 dark:border-blue-800/20"
                      >
                        {tag}
                        <button
                          type="button"
                          className="hover:text-blue-900 dark:hover:text-blue-200 ml-1 text-slate-400 font-bold focus:outline-none cursor-pointer text-sm"
                          onClick={() => handleRemoveDocType(idx)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="Enter purpose of request..."
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="min-h-[80px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes (Optional)</label>
                <Textarea
                  placeholder="Enter any additional instructions or notes..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>My Request History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">Request ID</th>
                    <th className="px-4 py-3 font-medium">Document Type</th>
                    <th className="px-4 py-3 font-medium">Date Requested</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No requests found.</td></tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req._id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">{req.requestId || "N/A"}</td>
                        <td className="px-4 py-3 font-medium flex items-center gap-2 whitespace-nowrap">
                          <FileText className="w-4 h-4 text-blue-500" />
                          {req.documentType}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => setSelectedRequest(req)}>
                              <Eye className="w-4 h-4" />
                            </Button>
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
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-5 py-2">
              <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedRequest.requestId || "N/A"}</span>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Employee Name</span>
                    <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Employee ID</span>
                    <span className="font-medium">{user?.employeeCode || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Department</span>
                    <span className="font-medium">{user?.department || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Request Information</h3>
                <div className="space-y-2 text-sm leading-relaxed">
                  <div>
                    <strong>Document Type:</strong> {renderDocumentTypes(selectedRequest.documentType)}
                  </div>
                  <div>
                    <strong>Purpose:</strong>
                    <p className="bg-muted/40 p-2.5 rounded-lg border text-slate-600 dark:text-slate-300 mt-1">{selectedRequest.purpose}</p>
                  </div>
                  {selectedRequest.additionalNotes && (
                    <div>
                      <strong>Additional Notes:</strong>
                      <p className="bg-muted/40 p-2.5 rounded-lg border text-slate-600 dark:text-slate-300 mt-1">{selectedRequest.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Remarks History</h3>
                {selectedRequest.remarks && selectedRequest.remarks.length > 0 ? (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {selectedRequest.remarks.map((r, index) => (
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
              {selectedRequest.status === "Approved" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Uploaded Documents</h3>
                  {((selectedRequest.uploadedDocuments && selectedRequest.uploadedDocuments.length > 0) ||
                    (selectedRequest.documentPaths && selectedRequest.documentPaths.length > 0) ||
                    selectedRequest.documentPath) ? (
                    <div className="space-y-2">
                      {selectedRequest.uploadedDocuments && selectedRequest.uploadedDocuments.length > 0 ? (
                        selectedRequest.uploadedDocuments.map((doc, idx) => (
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
                      ) : selectedRequest.documentPaths && selectedRequest.documentPaths.length > 0 ? (
                        selectedRequest.documentPaths.map((path, idx) => (
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
                            <span className="font-medium text-slate-700 dark:text-slate-300 block truncate" title={getFileName(selectedRequest.documentPath)}>
                              1. {getFileName(selectedRequest.documentPath)}
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(selectedRequest.documentPath), "_blank")}>
                              View
                            </Button>
                            <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(selectedRequest.documentPath), "_blank")}>
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

          <DialogFooter className="border-t pt-3 mt-2">
            <Button onClick={() => setSelectedRequest(null)}>Close</Button>
          </DialogFooter>
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

export default RequestDocument;