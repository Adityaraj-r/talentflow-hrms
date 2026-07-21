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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.documentType.trim() || !formData.purpose.trim()) {
      return toast.error("Please fill all required fields");
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/document-requests/create", formData);
      toast.success("Request submitted successfully");
      setFormData({ documentType: "", purpose: "", additionalNotes: "" });
      fetchRequests();
    } catch (error) {
      toast.error(error.error || error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
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
                <Input
                  placeholder="e.g., Experience Letter, Salary Slip"
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="e.g., Required for bank loan application"
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
                            {req.status === "Approved" && (req.documentPaths?.length > 0 || req.documentPath) ? (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-green-600 hover:text-green-700 border-green-200 bg-green-50"
                                onClick={() => {
                                  const downloadUrl = req.documentPaths && req.documentPaths.length > 0 ? req.documentPaths[0] : req.documentPath;
                                  window.open(forceCloudinaryDownload(downloadUrl), "_blank");
                                }}
                              >
                                <Download className="w-4 h-4" />
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
                    <strong>Document Type:</strong> {selectedRequest.documentType}
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
              {selectedRequest.status === "Approved" && ((selectedRequest.documentPaths && selectedRequest.documentPaths.length > 0) || selectedRequest.documentPath) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-1 text-slate-700 dark:text-slate-300">Uploaded Documents</h3>
                  <div className="space-y-2">
                    {selectedRequest.documentPaths && selectedRequest.documentPaths.length > 0 ? (
                      selectedRequest.documentPaths.map((path, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 border rounded-lg text-xs">
                          <span className="truncate max-w-[280px]" title={getFileName(path)}>
                            {idx + 1}. {getFileName(path)}
                          </span>
                          <div className="flex gap-1.5 shrink-0">
                            <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(path), "_blank")}>
                              View
                            </Button>
                            <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(path), "_blank")}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2.5 border rounded-lg text-xs">
                        <span className="truncate max-w-[280px]">
                          1. {getFileName(selectedRequest.documentPath)}
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => window.open(getFileUrl(selectedRequest.documentPath), "_blank")}>
                            View
                          </Button>
                          <Button size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => window.open(forceCloudinaryDownload(selectedRequest.documentPath), "_blank")}>
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t pt-3 mt-2">
            <Button onClick={() => setSelectedRequest(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestDocument;