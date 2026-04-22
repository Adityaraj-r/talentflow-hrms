import { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Check, X, Loader2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

const HRDocumentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  const [selectedReq, setSelectedReq] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [employeeData, setEmployeeData] = useState(null); 
  
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);
  const [viewingPurpose, setViewingPurpose] = useState("");

  const [manualInputs, setManualInputs] = useState({
    lastWorkingDate: "",
    passportNumber: "",
    destinationCountry: "",
    leaveStartDate: "",
    leaveEndDate: "",
    financialYear: "2025-2026"
  });

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/document-requests/all");
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

  const handleReviewClick = async (req) => {
    setSelectedReq(req);
    setModalOpen(true);
    try {
      const res = await apiClient.get(`/employees/${req.employeeId}`);
      setEmployeeData(res);
    } catch (error) {
      toast.error("Could not fetch employee details for template generation.");
      setModalOpen(false);
    }
  };

  const handleGenerateAndApprove = async () => {
    if (!employeeData) return toast.error("Employee data missing.");
    setIsGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setTextColor(29, 78, 216);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("InternsLand HRMS", 15, 20);

      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Chhatrapati Sambhajinagar, Maharashtra, India | contact@internsland.com", 15, 28);

      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(15, 32, 195, 32);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 195, 45, { align: "right" });

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const title = selectedReq.documentType.toUpperCase();
      pdf.text(title, 105, 60, { align: "center" });
      const titleWidth = pdf.getTextWidth(title);
      pdf.setLineWidth(0.3);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(105 - titleWidth / 2, 62, 105 + titleWidth / 2, 62);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      let cursorY = 80;

      if (selectedReq.documentType === "Bonafide Certificate") {
        const text = `This is to certify that ${employeeData.firstName} ${employeeData.lastName} (Employee ID: ${employeeData.employeeCode}) is a bona fide employee of InternsLand HRMS. They have been working with us in the capacity of ${employeeData.designation} in the ${employeeData.department} department since ${new Date(employeeData.joiningDate).toLocaleDateString()}.`;
        pdf.text(pdf.splitTextToSize(text, 175), 15, cursorY);
      } 
      else if (selectedReq.documentType === "Experience Certificate") {
        const text = `This is to certify that ${employeeData.firstName} ${employeeData.lastName} (Employee ID: ${employeeData.employeeCode}) was employed with InternsLand HRMS from ${new Date(employeeData.joiningDate).toLocaleDateString()} to ${new Date(manualInputs.lastWorkingDate || Date.now()).toLocaleDateString()}. During this tenure, their designation was ${employeeData.designation}. We found them to be diligent and hardworking.`;
        pdf.text(pdf.splitTextToSize(text, 175), 15, cursorY);
      } 
      else if (selectedReq.documentType === "Salary Certificate") {
        const p1 = `This is to certify that ${employeeData.firstName} ${employeeData.lastName} (Employee ID: ${employeeData.employeeCode}) is an employee of InternsLand HRMS working as a ${employeeData.designation}.`;
        pdf.text(pdf.splitTextToSize(p1, 175), 15, cursorY);
        cursorY += 15;
        const p2 = `As per our records, their current monthly salary structure is as follows:`;
        pdf.text(pdf.splitTextToSize(p2, 175), 15, cursorY);
        cursorY += 15;

        pdf.setFont("helvetica", "bold");
        pdf.text(`• Basic Salary: ${employeeData.salary?.currency || 'INR'} ${employeeData.salary?.basic || 0}`, 25, cursorY);
        cursorY += 10;
        pdf.text(`• Allowances: ${employeeData.salary?.currency || 'INR'} ${(employeeData.salary?.allowances?.hra || 0) + (employeeData.salary?.allowances?.transport || 0)}`, 25, cursorY);
        cursorY += 10;
        pdf.text(`• Gross Deductions: ${employeeData.salary?.currency || 'INR'} ${(employeeData.salary?.deductions?.tax || 0) + (employeeData.salary?.deductions?.pf || 0)}`, 25, cursorY);
      } 
      else if (selectedReq.documentType === "Visa NOC") {
        const text = `This is to certify that ${employeeData.firstName} ${employeeData.lastName} holding Passport Number ${manualInputs.passportNumber} is employed with InternsLand HRMS as a ${employeeData.designation}. We have no objection to them traveling to ${manualInputs.destinationCountry}. Their approved leave dates are from ${manualInputs.leaveStartDate} to ${manualInputs.leaveEndDate}, after which they will resume their duties.`;
        pdf.text(pdf.splitTextToSize(text, 175), 15, cursorY);
      } 
      else if (selectedReq.documentType === "Relieving Letter") {
        const text = `Dear ${employeeData.firstName},\n\nThis is to acknowledge that your resignation has been accepted and you are being relieved from the services of InternsLand HRMS at the close of working hours on ${new Date(manualInputs.lastWorkingDate || Date.now()).toLocaleDateString()}. We confirm that your full and final settlement has been cleared.`;
        pdf.text(pdf.splitTextToSize(text, 175), 15, cursorY);
      }
      else {
        pdf.text(`Official Document for ${selectedReq.documentType}`, 15, cursorY);
      }

      pdf.setFont("helvetica", "normal");
      pdf.text("For InternsLand HRMS,", 15, 240);
      pdf.setDrawColor(156, 163, 175);
      pdf.line(15, 255, 65, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text("Authorized Signatory", 15, 262);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      pdf.text("Human Resources Department", 15, 268);

      const pdfBlob = pdf.output("blob");
      const file = new File([pdfBlob], `${selectedReq.documentType.replace(/\s+/g, "_")}.pdf`, { type: "application/pdf" });

      const formData = new FormData();
      formData.append("file", file);

      await apiClient.post(`/document-requests/fulfill/${selectedReq._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Document Generated & Approved Successfully!");
      setModalOpen(false);
      fetchRequests();
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate and approve document.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReject = async (id) => {
    if(!window.confirm("Are you sure you want to reject this request?")) return;
    try {
      toast.success("Request rejected.");
      fetchRequests();
    } catch (error) {
      toast.error("Failed to reject.");
    }
  };

  const pendingRequests = requests.filter(r => r.status === "Pending" || r.status === "Processing");
  const historyRequests = requests.filter(r => r.status === "Completed" || r.status === "Rejected");

  const displayedRequests = (activeTab === "pending" ? pendingRequests : historyRequests).filter(r => 
    r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.documentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Requests</h1>
          <p className="text-muted-foreground">Review, generate, and fulfill employee document requests.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-900/30 dark:bg-slate-900/50 p-1 w-fit rounded-lg border dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'pending' ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
        >
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
        >
          Request History
        </button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">{activeTab === "pending" ? "Pending Queue" : "Completed Requests"}</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employee or type..."
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
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Document Type</th>
                  <th className="px-4 py-3 font-medium w-[250px]">Purpose</th>
                  <th className="px-4 py-3 font-medium">Timeline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : displayedRequests.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">No records found.</td></tr>
                ) : (
                  displayedRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{req.employeeName} <span className="block text-xs text-muted-foreground">{req.employeeId}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" />{req.documentType}</div></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate max-w-[180px]">{req.purpose}</span>
                          {req.purpose.length > 25 && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => { setViewingPurpose(req.purpose); setPurposeModalOpen(true); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <div className="text-blue-600 font-medium">Req: {new Date(req.requestDate).toLocaleDateString()}</div>
                          {req.actionedAt && (
                            <div className={req.status === 'Completed' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {req.status === 'Completed' ? 'Appr' : 'Rej'}: {new Date(req.actionedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${req.status === 'Completed' ? 'bg-green-100 text-green-700' : req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === "Pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200" onClick={() => handleReviewClick(req)}>
                              Review & Generate
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => handleReject(req._id)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs font-medium">Action Taken</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={purposeModalOpen} onOpenChange={setPurposeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Request Purpose</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm leading-relaxed text-foreground bg-muted/30 p-4 rounded-md border mt-2">
            {viewingPurpose}
          </div>
          <DialogFooter>
            <Button onClick={() => setPurposeModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate {selectedReq?.documentType}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted/30 p-3 rounded-md text-sm border">
              <strong>Employee:</strong> {selectedReq?.employeeName} ({selectedReq?.employeeId})<br/>
              <strong>Purpose:</strong> {selectedReq?.purpose}
            </div>

            {(selectedReq?.documentType === "Experience Certificate" || selectedReq?.documentType === "Relieving Letter") && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Working Date *</label>
                <Input type="date" value={manualInputs.lastWorkingDate} onChange={e => setManualInputs({...manualInputs, lastWorkingDate: e.target.value})} />
              </div>
            )}

            {selectedReq?.documentType === "Visa NOC" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Passport Number *</label>
                  <Input placeholder="e.g., A1234567" value={manualInputs.passportNumber} onChange={e => setManualInputs({...manualInputs, passportNumber: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Destination Country *</label>
                  <Input placeholder="e.g., United Arab Emirates" value={manualInputs.destinationCountry} onChange={e => setManualInputs({...manualInputs, destinationCountry: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leave Start *</label>
                  <Input type="date" value={manualInputs.leaveStartDate} onChange={e => setManualInputs({...manualInputs, leaveStartDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leave End *</label>
                  <Input type="date" value={manualInputs.leaveEndDate} onChange={e => setManualInputs({...manualInputs, leaveEndDate: e.target.value})} />
                </div>
              </div>
            )}

            {selectedReq?.documentType === "Form 16" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Financial Year *</label>
                <Input placeholder="e.g., 2025-2026" value={manualInputs.financialYear} onChange={e => setManualInputs({...manualInputs, financialYear: e.target.value})} />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              Clicking generate will automatically draw the company letterhead, inject the employee's data, and upload the official PDF to their Digital Locker.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateAndApprove} disabled={isGenerating}>
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isGenerating ? "Generating PDF..." : "Generate & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDocumentRequests;