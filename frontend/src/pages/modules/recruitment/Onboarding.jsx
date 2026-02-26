import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, Upload, CreditCard, Building, FileText, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

const Onboarding = () => {
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Combined State precisely matching the merged Employee.model.ts
  const [formData, setFormData] = useState({
    firstName: "",
    MiddleName: "", // Fixed casing to lowercase 'm'
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
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:5001/api/onboarding/${formData.email}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            // NORMALIZATION LOGIC ---
            const fetchedData = { ...response.data.data };

            if (fetchedData.gender) {
              fetchedData.gender = fetchedData.gender.charAt(0).toUpperCase() +
                fetchedData.gender.slice(1).toLowerCase();
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

  const handleSubmit = async () => {
    if (!isTabValid("documents")) {
      toast.error("Please upload all mandatory documents and confirm the declaration.");
      return;
    }

    // Call your existing save progress function with 'Completed' status
    await handleSaveProgress("Completed");
  };

  // Add this at the beginning of your return statement
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
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value } // Brackets [] added
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (field, file) => {
    if (file) {
      // Check file size (5MB limit to match backend configuration)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      // Verify allowed types to match backend filter
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPG, and PNG files are allowed.");
        return;
      }

      // Store the actual file object in the state
      setFormData(prev => ({ ...prev, [field]: file }));
      toast.success(`${file.name} selected!`);
    }
  };

  // helper logic to validate required fields before saving
  const isTabValid = (tab) => {
    if (tab === "personal") {
      const { firstName, MiddleName, lastName, dateOfBirth, gender, email, phoneNumber, currentAddress } = formData;
      const isDateValid = dateOfBirth && dateOfBirth.length >= 8;
      return (
        firstName.trim() !== "" &&
        MiddleName.trim() !== "" &&
        lastName.trim() !== "" &&
        isDateValid &&
        gender !== "" &&
        email.trim() !== "" &&
        phoneNumber.length === 10 &&
        currentAddress.trim() !== ""
      );
    }
    //  logic for employment tab validation
    if (tab === "employment") {
      const { employeeCode, joiningDate, designation, department, reportingManager } = formData;
      return (
        // Use optional chaining so .trim() only runs if employeeCode is a string
        (employeeCode?.trim() ?? "") !== "" &&
        joiningDate !== "" &&
        (designation?.trim() ?? "") !== "" &&
        (department !== "" && department !== "Select Department") &&
        (reportingManager?.trim() ?? "") !== ""
      );
    }
    // logic for banking tab validation
    if (tab === "banking") {
      const { bankDetails, kycDetails } = formData;

      // Real-world logic to validate bank and KYC details
      const isAccountValid = /^\d{9,18}$/.test(bankDetails?.accountNumber);
      const isIfscValid = /^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankDetails?.ifscCode);
      const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycDetails?.panNumber);
      const isAadharValid = /^\d{12}$/.test(kycDetails?.aadharNumber);
      const isUanValid = /^\d{12}$/.test(kycDetails?.uan);
      const isPfValid = (kycDetails?.pfNumber?.length ?? 0) >= 15;

      return (
        (bankDetails?.accountHolderName?.trim() ?? "") !== "" &&
        (bankDetails?.bankName?.trim() ?? "") !== "" &&
        isAccountValid &&
        isIfscValid &&
        isPanValid &&
        isAadharValid &&
        isUanValid &&
        isPfValid
      );
    }

    if (tab === "documents") {
      const mandatoryDocs = ['aadharCard', 'panCard', 'resume', 'passportPhoto'];
      const allDocsUploaded = mandatoryDocs.every(doc => formData[doc]);

      return allDocsUploaded && isConfirmed;
    }
    return true;
  };

  // Function to ensure the date always looks like DD-MM-YYYY for the user
  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";

    // Extract just the date part if it's a full ISO string (e.g., 2026-02-01T00:00:00.000Z)
    const cleanDate = dateString.split('T')[0];

    // If the date is in YYYY-MM-DD (standard DB/Calendar format)
    if (cleanDate.includes("-") && cleanDate.split("-")[0].length === 4) {
      const [y, m, d] = cleanDate.split("-");
      return `${d}-${m}-${y}`;
    }

    return cleanDate; // Returns DD-MM-YYYY if already in that format
  };

  const handleSaveProgress = async (nextTab) => {
    if (!isTabValid(activeTab)) {
      toast.error("Please fill all compulsory fields marked with * correctly.");
      return;
    }
    if (!formData.email) {
      toast.error("Please enter a Personal Email to save progress.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();

      // 1. Append basic fields and onboarding status
      data.append('email', formData.email);
      data.append('onboardingStatus', activeTab.charAt(0).toUpperCase() + activeTab.slice(1));

      // 2. Append text fields (filtering out empty strings)
      Object.keys(formData).forEach(key => {
        if (
          typeof formData[key] !== 'object' &&
          formData[key] !== "" &&
          key !== 'email' &&
          key !== 'onboardingStatus'
        ) {
          data.append(key, formData[key]);
        }
      });

      // 3. Append Nested Objects
      data.append('bankDetails', JSON.stringify(formData.bankDetails));
      data.append('kycDetails', JSON.stringify(formData.kycDetails));

      // 4. Append Files from the Documents Tab
      if (formData.aadharCard) data.append('aadharCard', formData.aadharCard);
      if (formData.panCard) data.append('panCard', formData.panCard);
      if (formData.resume) data.append('resume', formData.resume);
      if (formData.educationDocs) data.append('educationDocs', formData.educationDocs);
      if (formData.passportPhoto) data.append('passportPhoto', formData.passportPhoto);
      if (formData.relievingLetter) data.append('relievingLetter', formData.relievingLetter);

      const response = await axios.post(
        "http://localhost:5001/api/onboarding/save",
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding & KYC</h1>
        <p className="text-muted-foreground">Complete employee master data creation.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-150">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger
            value="employment"
            disabled={!isTabValid("personal")}
          >
            Employment
          </TabsTrigger>
          <TabsTrigger
            value="banking"
            disabled={!isTabValid("personal") || !isTabValid("employment")}
          >
            Bank & Statutory
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            disabled={!isTabValid("personal") || !isTabValid("employment") ||
              !isTabValid("banking")}
          >
            Documents
          </TabsTrigger>
        </TabsList>
        

        {/* PERSONAL TAB */}
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
                    type="text"
                    placeholder="DD-MM-YYYY"
                    className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={formatDisplayDate(formData.dateOfBirth)}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => (e.target.type = "text")}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={formData.gender || ""}
                    onValueChange={(val) => handleChange("gender", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
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
                      if (cleaned.length <= 10) {
                        handleChange("phoneNumber", cleaned);
                      }
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

        {/* --- Employment, Banking, and Documents Tabs remain same as previous structure --- */}
        {/* EMPLOYMENT TAB */}
        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" /> Official Details
              </CardTitle>
              <CardDescription>
                Enter official identification and structural details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID *</Label>
                  <Input
                    value={formData.employeeCode || ""}
                    onChange={(e) => handleChange("employeeCode", e.target.value)}
                    placeholder="EMP-001"
                  />
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
                  <Input
                    value={formData.designation || ""}
                    onChange={(e) => handleChange("designation", e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select
                    value={formData.department || ""}
                    onValueChange={(val) => handleChange("department", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Input
                    value={formData.workLocation || ""}
                    onChange={(e) => handleChange("workLocation", e.target.value)}
                    placeholder="Chh. Sambhajinagar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Manager *</Label>
                  <Input
                    value={formData.reportingManager || ""}
                    onChange={(e) => handleChange("reportingManager", e.target.value)}
                    placeholder="Manager Name"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("personal")}>
                  Back to Personal
                </Button>
                <Button
                  disabled={loading}
                  onClick={() => {
                    if (isTabValid("employment")) {
                      handleSaveProgress("banking");
                    } else {
                      toast.error("Please fill all mandatory official details (*).");
                    }
                  }}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Next: Banking
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BANKING TAB */}
        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Bank & Statutory Details
              </CardTitle>
              <CardDescription>
                Enter bank account information and government ID details (KYC).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Bank Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Holder Name *</Label>
                    <Input
                      value={formData.bankDetails?.accountHolderName || ""}
                      onChange={(e) => handleChange("accountHolderName", e.target.value, "bankDetails")}
                      placeholder="As per bank records"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input
                      value={formData.bankDetails?.bankName || ""}
                      onChange={(e) => handleChange("bankName", e.target.value, "bankDetails")}
                      placeholder="e.g. HDFC Bank"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      value={formData.bankDetails?.accountNumber || ""}
                      placeholder="000012345678"
                      onChange={(e) => {
                        // Strips alphabets/symbols and limits to 18 digits (standard max for most banks)
                        const value = e.target.value.replace(/\D/g, "").slice(0, 18);
                        handleChange("accountNumber", value, "bankDetails");
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code *</Label>
                    {/* IFSC Code Field */}
                    <Input
                      value={formData.bankDetails?.ifscCode || ""}
                      placeholder="HDFC0001234"
                      className="uppercase" // Visual hint
                      onChange={(e) => handleChange("ifscCode", e.target.value.toUpperCase(), "bankDetails")}
                    />
                  </div>
                </div>
              </div>

              {/* Statutory / KYC Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Statutory (KYC) Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAN Number *</Label>
                    {/* PAN Number Field */}
                    <Input
                      value={formData.kycDetails?.panNumber || ""}
                      placeholder="ABCDE1234F"
                      className="uppercase"
                      onChange={(e) => handleChange("panNumber", e.target.value.toUpperCase(), "kycDetails")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Number *</Label>
                    {/* Aadhar Number Field (Numeric only) */}
                    <Input
                      value={formData.kycDetails?.aadharNumber || ""}
                      placeholder="123456789012"
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 12); // Remove non-digits, limit to 12
                        handleChange("aadharNumber", value, "kycDetails");
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UAN(Universal Account Number)</Label>
                    <Input
                      value={formData.kycDetails?.uan || ""}
                      onChange={(e) => handleChange("uan", e.target.value, "kycDetails")}
                      placeholder="100XXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PF Number *</Label>
                    <Input
                      value={formData.kycDetails?.pfNumber || ""}
                      onChange={(e) => handleChange("pfNumber", e.target.value, "kycDetails")}
                      placeholder="MH/BAN/0000000/000"
                    />
                  </div>
                </div>
              </div>

              {/* Corrected Back Button in Bank & Statutory Tab */}
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  type="button" // Ensure type is 'button' to avoid accidental form submission
                  onClick={() => setActiveTab("employment")}
                >
                  Back to Employment
                </Button>

                <Button
                  onClick={() => {
                    if (isTabValid("banking")) {
                      handleSaveProgress("documents");
                    } else {
                      toast.error("Please fill all compulsory fields marked with * correctly.");
                    }
                  }}
                >
                  Next: Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DOCUMENTS TAB */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Document Upload
              </CardTitle>
              <CardDescription>Upload clear scans of original documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 2-Column Grid matching Image Two */}
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

                    <input
                      type="file"
                      id={doc.id}
                      className="hidden"
                      onChange={(e) => handleFileChange(doc.id, e.target.files[0])}
                    />

                    {/* Selection indicator */}
                    {formData[doc.id] && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 text-green-600 text-xs font-bold bg-white px-2 py-1 rounded-full border">
                        <CheckCircle2 className="h-3 w-3" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 py-4">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                />
                <Label htmlFor="confirm" className="text-sm font-normal cursor-pointer">
                  I confirm that all provided details and documents are authentic. *
                </Label>
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