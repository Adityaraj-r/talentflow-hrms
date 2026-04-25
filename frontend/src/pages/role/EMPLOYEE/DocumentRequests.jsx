import { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RequestDocument = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "",
    purpose: ""
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/document-requests/my-requests");
      setRequests(res.data || []);
    } catch (error) {
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.documentType || !formData.purpose.trim()) {
      return toast.error("Please fill all fields");
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/document-requests/create", formData);
      toast.success("Request submitted successfully");
      setFormData({ documentType: "", purpose: "" });
      fetchRequests();
    } catch (error) {
      toast.error(error.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === "Completed") return <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Completed</span>;
    if (status === "Rejected") return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Rejected</span>;
    if (status === "Processing") return <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Loader2 className="w-3 h-3 animate-spin" /> Processing</span>;
    return <span className="bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pending</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request Document</h1>
        <p className="text-muted-foreground">Submit a request to HR for official company documents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>New Request</CardTitle>
            <CardDescription>Select the document type and provide a reason.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type</label>
                <Select value={formData.documentType} onValueChange={(val) => setFormData({ ...formData, documentType: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary Certificate">Salary Certificate</SelectItem>
                    <SelectItem value="Form 16">Form 16 / Tax Summary</SelectItem>
                    <SelectItem value="Bonafide Certificate">Bonafide / Employment Certificate</SelectItem>
                    <SelectItem value="Experience Certificate">Experience / Service Certificate</SelectItem>
                    <SelectItem value="Relieving Letter">Relieving Letter</SelectItem>
                    <SelectItem value="Visa NOC">Visa NOC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <Textarea
                  placeholder="e.g., Required for bank loan application"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="min-h-[100px]"
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
                    <th className="px-4 py-3 font-medium">Document Type</th>
                    <th className="px-4 py-3 font-medium">Date Requested</th>
                    <th className="px-4 py-3 font-medium">Purpose</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {isLoading ? (
                    <tr><td colSpan="4" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                  ) : requests.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-muted-foreground">No requests found.</td></tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req._id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium flex items-center gap-2 whitespace-nowrap">
                          <FileText className="w-4 h-4 text-blue-500" />
                          {req.documentType}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(req.requestDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 max-w-[200px] truncate" title={req.purpose}>{req.purpose}</td>
                        <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestDocument;