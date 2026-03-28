import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import apiClient from "@/services/apiClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Upload, CreditCard, Building, FileText, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const ALLOWED_ROLES = ["ADMIN", "HR_MANAGER", "HR_OFFICER"]

const Onboarding = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    MiddleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    email: "",
    phoneNumber: "",
    currentAddress: "",
    employeeCode: "",
    joiningDate: "",
    designation: "",
    department: "",
    reportingManager: "",
    workLocation: "",
    bankDetails: {
      bankName: "", ifscCode: "", accountNumber: "", accountHolderName: ""
    },
    kycDetails: {
      panNumber: "", aadharNumber: "", uan: "", pfNumber: ""
    }
  })

  useEffect(() => {
    const fetchProgress = async () => {
      if (formData.email && activeTab !== "personal") {
        try {
          const response = await apiClient.get(`/onboarding/${formData.email}`);
          if (response.success) {
            const fetchedData = { ...response.data };
            if (fetchedData.gender) {
              fetchedData.gender = fetchedData.gender.charAt(0).toUpperCase() + fetchedData.gender.slice(1).toLowerCase();
            }
            if (fetchedData.dateOfBirth) {
              fetchedData.dateOfBirth = fetchedData.dateOfBirth.split('T')[0];
            }
            setFormData(prev => ({ ...prev, ...fetchedData }));
          }
        } catch (error) {
          console.error("Error resuming progress:", error);
        }
      }
    };
    fetchProgress();
  }, [activeTab, formData.email]);

  if (!ALLOWED_ROLES.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (activeTab === "Completed") {
    return (
      <Card className="max-w-md mx-auto mt-10 text-center p-10">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Profile Submitted!</h2>
        <p className="text-muted-foreground mt-2">
          The employee onboarding data has been successfully saved to the master database.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/dashboard/users'}>
          Back to User Management
        </Button>
      </Card>
    );
  }

  const handleChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (field, file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error("File size should be less than 5MB"); return; }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) { toast.error("Only PDF, JPG, and PNG files are allowed."); return; }
      setFormData(prev => ({ ...prev, [field]: file }));
      toast.success(`${file.name} selected!`);
    }
  };

  const getTabValidationError = (tab) => {
    if (tab === "personal") {
      const { firstName, MiddleName, lastName, dateOfBirth, gender, email, phoneNumber, currentAddress } = formData;
      if (firstName.trim() === "") return "First Name is required.";
      if (MiddleName.trim() === "") return "Middle Name is required.";
      if (lastName.trim() === "") return "Last Name is required.";
      if (!dateOfBirth || dateOfBirth.length < 8) return "Valid Date of Birth is required.";
      if (gender === "") return "Gender selection is required.";
      if (email.trim() === "") return "Personal Email is required.";
      if (phoneNumber.length !== 10) return "Mobile Number must be exactly 10 digits.";
      if (currentAddress.trim() === "") return "Current Address is required.";
    }
    if (tab === "employment") {
      const { employeeCode, joiningDate, designation, department, reportingManager } = formData;
      if ((employeeCode?.trim() ?? "") === "") return "Employee ID is required.";
      if (joiningDate === "") return "Date of Joining is required.";
      if ((designation?.trim() ?? "") === "") return "Designation is required.";
      if (department === "" || department === "Select Department") return "Department selection is required.";
      if ((reportingManager?.trim() ?? "") === "") return "Reporting Manager is required.";
    }
    if (tab === "banking") {
      const { bankDetails, kycDetails } = formData;
      if ((bankDetails?.accountHolderName?.trim() ?? "") === "") return "Account Holder Name is required.";
      if ((bankDetails?.bankName?.trim() ?? "") === "") return "Bank Name is required.";
      if (!/^\d{9,18}$/.test(bankDetails?.accountNumber)) return "Account Number must be between 9 and 18 digits.";
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails?.ifscCode)) return "Invalid IFSC Code. Format: HDFC0001234";
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycDetails?.panNumber)) return "Invalid PAN Number. Format: ABCDE1234F";
      if (!/^\d{12}$/.test(kycDetails?.aadharNumber)) return "Aadhar Number must be exactly 12 digits.";
      if (kycDetails?.uan && !/^\d{12}$/.test(kycDetails?.uan)) return "UAN must be exactly 12 digits.";
      if ((kycDetails?.pfNumber?.length ?? 0) < 15) return "PF Number is required (Min 15 chars).";
    }
    if (tab === "documents") {
      const mandatoryDocs = ['aadharCard', 'panCard', 'resume', 'passportPhoto'];
      const missing = mandatoryDocs.find(doc => !formData[doc]);
      if (missing) return "Please upload all mandatory documents (*).";
      if (!isConfirmed) return "Please confirm the authenticity declaration.";
    }
    return null;
  };

  const isTabValid = (tab) => getTabValidationError(tab) === null;

  const handleSaveProgress = async (nextTab) => {
    const errorMessage = getTabValidationError(activeTab);
    if (errorMessage) { toast.error(errorMessage); return; }
    if (!formData.email) { toast.error("Please enter a Personal Email to save progress."); return; }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('email', formData.email);
      data.append('onboardingStatus', activeTab.charAt(0).toUpperCase() + activeTab.slice(1));

      Object.keys(formData).forEach(key => {
        if (typeof formData[key] !== 'object' && formData[key] !== "" && key !== 'email' && key !== 'onboardingStatus') {
          data.append(key, formData[key]);
        }
      });

      data.append('bankDetails', JSON.stringify(formData.bankDetails));
      data.append('kycDetails', JSON.stringify(formData.kycDetails));

      if (formData.aadharCard) data.append('aadharCard', formData.aadharCard);
      if (formData.panCard) data.append('panCard', formData.panCard);
      if (formData.resume) data.append('resume', formData.resume);
      if (formData.educationDocs) data.append('educationDocs', formData.educationDocs);
      if (formData.passportPhoto) data.append('passportPhoto', formData.passportPhoto);
      if (formData.relievingLetter) data.append('relievingLetter', formData.relievingLetter);

      const response = await apiClient.post("/onboarding/save", data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.success) {
        toast.success(`${activeTab.toUpperCase()} details saved!`);
        if (nextTab) setActiveTab(nextTab);
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(error.response?.data?.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isTabValid("documents")) {
      toast.error("Please upload all mandatory documents and confirm the declaration.");
      return;
    }
    await handleSaveProgress("Completed");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding & KYC</h1>
        <p className="text-muted-foreground">Complete employee master data creation.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-150">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment" disabled={!isTabValid("personal")}>Employment</TabsTrigger>
          <TabsTrigger value="banking" disabled={!isTabValid("personal") || !isTabValid("employment")}>Bank & Statutory</TabsTrigger>
          <TabsTrigger value="documents" disabled={!isTabValid("personal") || !isTabValid("employment") || !isTabValid("banking")}>Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="Rahul" />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name *</Label>
                  <Input value={formData.MiddleName} onChange={(e) => handleChange("MiddleName", e.target.value)} placeholder="Kumar" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="Sharma" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={formData.gender || ""} onValueChange={(val) => handleChange("gender", val)}>
                    <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select onValueChange={(val) => handleChange("bloodGroup", val)}>
                    <SelectTrigger><SelectValue placeholder="Select Group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Personal Email *</Label>
                  <Input value={formData.email} onChange={(e) => handleChange("email", e.target.value)} type="email" placeholder="rahul@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      if (cleaned.length <= 10) handleChange("phoneNumber", cleaned);
                    }}
                    placeholder="7678988776"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Address *</Label>
                <Textarea value={formData.currentAddress} onChange={(e) => handleChange("currentAddress", e.target.value)} placeholder="Full Address" />
              </div>

              <div className="flex justify-end">
                <Button disabled={loading} onClick={() => handleSaveProgress("employment")}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Next: Employment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Official Details</CardTitle>
              <CardDescription>Enter official identification and structural details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input disabled value={formData.employeeCode || ""} onChange={(e) => handleChange("employeeCode", e.target.value)} placeholder="EMP-001" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Joining *</Label>
                  <Input
                    type="date"
                    className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3"
                    value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ""}
                    onChange={(e) => handleChange("joiningDate", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Designation *</Label>
                  <Input value={formData.designation || ""} onChange={(e) => handleChange("designation", e.target.value)} placeholder="Software Engineer" />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={formData.department || ""} onValueChange={(val) => handleChange("department", val)}>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operation</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Input value={formData.workLocation || ""} onChange={(e) => handleChange("workLocation", e.target.value)} placeholder="Chh. Sambhajinagar" />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Manager *</Label>
                  <Input value={formData.reportingManager || ""} onChange={(e) => handleChange("reportingManager", e.target.value)} placeholder="Manager Name" />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("personal")}>Back to Personal</Button>
                <Button
                  disabled={loading}
                  onClick={() => {
                    if (isTabValid("employment")) { handleSaveProgress("banking"); }
                    else { toast.error("Please fill all mandatory official details (*)."); }
                  }}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Next: Banking
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Bank & Statutory Details</CardTitle>
              <CardDescription>Enter bank account information and government ID details (KYC).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Bank Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name *</Label>
                    <Input value={formData.bankDetails?.accountHolderName || ""} onChange={(e) => handleChange("accountHolderName", e.target.value, "bankDetails")} placeholder="As per bank records" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input value={formData.bankDetails?.bankName || ""} onChange={(e) => handleChange("bankName", e.target.value, "bankDetails")} placeholder="e.g. HDFC Bank" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      value={formData.bankDetails?.accountNumber || ""}
                      placeholder="000012345678"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 18);
                        handleChange("accountNumber", value, "bankDetails");
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code *</Label>
                    <Input value={formData.bankDetails?.ifscCode || ""} placeholder="HDFC0001234" className="uppercase" onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase(), "bankDetails")} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Statutory (KYC) Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAN Number *</Label>
                    <Input value={formData.kycDetails?.panNumber || ""} placeholder="ABCDE1234F" className="uppercase" onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase(), "kycDetails")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Number *</Label>
                    <Input
                      value={formData.kycDetails?.aadharNumber || ""}
                      placeholder="123456789012"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                        handleChange("aadharNumber", value, "kycDetails");
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UAN(Universal Account Number)</Label>
                    <Input value={formData.kycDetails?.uan || ""} onChange={(e) => handleChange("uan", e.target.value, "kycDetails")} placeholder="100XXXXXXXXX" />
                  </div>
                  <div className="space-y-2">
                    <Label>PF Number *</Label>
                    <Input value={formData.kycDetails?.pfNumber || ""} onChange={(e) => handleChange("pfNumber", e.target.value, "kycDetails")} placeholder="MH/BAN/0000000/000" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" type="button" onClick={() => setActiveTab("employment")}>Back to Employment</Button>
                <Button onClick={() => handleSaveProgress("documents")}>Next: Documents</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Document Upload</CardTitle>
              <CardDescription>Upload clear scans of original documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "aadharCard", label: "Aadhar Card (Front & Back) *" },
                  { id: "panCard", label: "PAN Card *" },
                  { id: "resume", label: "Cancelled Cheque / Bank Proof *" },
                  { id: "passportPhoto", label: "Passport Photo *" },
                  { id: "relievingLetter", label: "Previous Relieving Letter " },
                  { id: "educationDocs", label: "Highest Education Certificate " },
                ].map((doc) => (
                  <div
                    key={doc.id}
                    className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors relative"
                    onClick={() => document.getElementById(doc.id).click()}
                  >
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="font-medium text-sm">{doc.label}</span>
                    <span className="text-xs text-slate-400">Click to upload or drag file</span>
                    <input type="file" id={doc.id} className="hidden" onChange={(e) => handleFileChange(doc.id, e.target.files[0])} />
                    {formData[doc.id] && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-green-600 text-xs font-bold bg-white px-2 py-1 rounded-full border">
                        <CheckCircle2 className="h-3 w-3" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 py-4">
                <input type="checkbox" id="confirm" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
                <Label htmlFor="confirm" className="text-sm font-normal cursor-pointer">I confirm that all provided details and documents are authentic. *</Label>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("banking")}>Back</Button>
                <Button
                  className={`${isConfirmed ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white`}
                  onClick={handleSubmit}
                  disabled={loading || !isConfirmed}
                >
                  {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Submit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Onboarding