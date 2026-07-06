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
const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/
const BANK_NAME_PATTERN = /^[A-Za-z]+(?:[ .&-]?[A-Za-z]+)*$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const PF_PATTERN = /^[A-Z]{2}\/[A-Z]{3}\/[0-9]{7}\/[0-9]{3}$/
const EMPLOYEE_CODE_PATTERN = /^EMP-\d{4,}$/
const ONBOARDING_TEXT_FIELDS = [
  "firstName",
  "MiddleName",
  "lastName",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "phoneNumber",
  "currentAddress",
  "employeeCode",
  "joiningDate",
  "designation",
  "department",
  "reportingManager",
  "reportingManagerId",
  "workLocation",
]

const onlyLettersAndSpaces = (value) =>
  value.replace(/[^A-Za-z ]/g, "").replace(/\s+/g, " ").replace(/^\s/, "")
const onlyDigits = (value, limit) => value.replace(/\D/g, "").slice(0, limit)
const alphaNumericUpper = (value, limit) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, limit)
const pfNumberValue = (value) => value.replace(/[^A-Za-z0-9/]/g, "").toUpperCase().slice(0, 18)
const trimTextStart = (value) => value.replace(/^\s+/, "").replace(/\s{2,}/g, " ")
const isValidDateString = (value) => Boolean(value) && !Number.isNaN(new Date(value).getTime())
const todayISO = () => new Date().toISOString().split("T")[0]

const FieldError = ({ message }) => (
  message ? <p className="text-xs text-destructive">{message}</p> : null
)

const getManagerName = (manager) =>
  [manager.firstName, manager.lastName].filter(Boolean).join(" ").trim() || manager.email || "Unnamed Manager"

const normalizeListResponse = (response) => {
  const data = response?.data ?? response
  return Array.isArray(data) ? data : data?.users ?? data?.data ?? []
}

const Onboarding = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("personal")
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [touchedFields, setTouchedFields] = useState({})

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
    reportingManagerId: "",
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

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoadingManagers(true)
        const [directManagers, departmentManagers] = await Promise.all([
          apiClient.get("/users", {
            params: { role: "DIRECT_MANAGER", isActive: true, limit: 100 },
          }),
          apiClient.get("/users", {
            params: { role: "DEPARTMENT_MANAGER", isActive: true, limit: 100 },
          }),
        ])

        const uniqueManagers = [...normalizeListResponse(directManagers), ...normalizeListResponse(departmentManagers)]
          .filter((manager, index, list) => list.findIndex((item) => item._id === manager._id) === index)
          .sort((a, b) => getManagerName(a).localeCompare(getManagerName(b)))

        setManagers(uniqueManagers)
      } catch (error) {
        console.error("Error loading reporting managers:", error)
        toast.error("Failed to load reporting managers")
      } finally {
        setLoadingManagers(false)
      }
    }

    fetchManagers()
  }, [])

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
    setTouchedFields(prev => ({ ...prev, [section ? `${section}.${field}` : field]: true }))
    if (section) {
      setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleReportingManagerChange = (managerId) => {
    const selectedManager = managers.find(manager => manager._id === managerId)
    setTouchedFields(prev => ({ ...prev, reportingManager: true }))
    setFormData(prev => ({
      ...prev,
      reportingManager: selectedManager ? getManagerName(selectedManager) : "",
      reportingManagerId: selectedManager?.employeeCode || selectedManager?._id || "",
    }))
  }

  const markTouched = (field, section = null) => {
    setTouchedFields(prev => ({ ...prev, [section ? `${section}.${field}` : field]: true }))
  }

  const getFieldError = (field, section = null) => {
    const value = section ? formData[section]?.[field] ?? "" : formData[field] ?? ""
    const trimmed = typeof value === "string" ? value.trim() : value

    if (field === "firstName") {
      if (!trimmed) return "First name is required."
      if (!NAME_PATTERN.test(trimmed)) return "Use alphabetic characters only."
    }
    if (field === "MiddleName" && trimmed && !NAME_PATTERN.test(trimmed)) return "Use alphabetic characters only."
    if (field === "lastName" && trimmed && !NAME_PATTERN.test(trimmed)) return "Use alphabetic characters only."
    if (field === "dateOfBirth") {
      if (!trimmed) return "Date of birth is required."
      if (!isValidDateString(trimmed)) return "Enter a valid date of birth."
      if (trimmed > todayISO()) return "Date of birth cannot be in the future."
    }
    if (field === "gender" && !trimmed) return "Gender is required."
    if (field === "email") {
      if (!trimmed) return "Personal email is required."
      if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address."
    }
    if (field === "phoneNumber") {
      if (!trimmed) return "Mobile number is required."
      if (!/^[6-9]\d{9}$/.test(trimmed)) return "Enter a valid 10-digit Indian mobile number."
    }
    if (field === "currentAddress") {
      if (!trimmed) return "Current address is required."
      if (trimmed.length < 10) return "Enter a complete address with at least 10 characters."
    }
    if (field === "employeeCode") {
      if (!trimmed) return "Employee ID is required."
      if (!EMPLOYEE_CODE_PATTERN.test(trimmed)) return "Employee ID must follow EMP-0001 format."
    }
    if (field === "joiningDate") {
      if (!trimmed) return "Date of joining is required."
      if (!isValidDateString(trimmed)) return "Enter a valid joining date."
    }
    if (field === "designation") {
      if (!trimmed) return "Designation is required."
      if (!/^[A-Za-z]+(?:[ A-Za-z.&/-]*[A-Za-z])?$/.test(trimmed)) return "Use letters and common title separators only."
    }
    if (field === "department" && (!trimmed || trimmed === "Select Department")) return "Department is required."
    if (field === "reportingManager") {
      if (!trimmed) return "Reporting manager is required."
      if (!NAME_PATTERN.test(trimmed)) return "Use alphabetic characters only."
    }
    if (field === "workLocation" && trimmed && !/^[A-Za-z0-9]+(?:[ A-Za-z0-9.,'-]*[A-Za-z0-9])?$/.test(trimmed)) {
      return "Use a valid location format."
    }
    if (section === "bankDetails" && field === "accountHolderName") {
      if (!trimmed) return "Account holder name is required."
      if (!NAME_PATTERN.test(trimmed)) return "Use the bank account holder's alphabetic name."
    }
    if (section === "bankDetails" && field === "bankName") {
      if (!trimmed) return "Bank name is required."
      if (!BANK_NAME_PATTERN.test(trimmed)) return "Use a valid bank name."
    }
    if (section === "bankDetails" && field === "accountNumber") {
      if (!trimmed) return "Account number is required."
      if (!/^\d{9,18}$/.test(trimmed)) return "Account number must be 9 to 18 digits."
    }
    if (section === "bankDetails" && field === "ifscCode") {
      if (!trimmed) return "IFSC code is required."
      if (!IFSC_PATTERN.test(trimmed)) return "IFSC must be exactly 11 characters, e.g. HDFC0001234."
    }
    if (section === "kycDetails" && field === "panNumber") {
      if (!trimmed) return "PAN number is required."
      if (!PAN_PATTERN.test(trimmed)) return "PAN must follow ABCDE1234F format."
    }
    if (section === "kycDetails" && field === "aadharNumber") {
      if (!trimmed) return "Aadhaar number is required."
      if (!/^\d{12}$/.test(trimmed)) return "Aadhaar number must be exactly 12 digits."
    }
    if (section === "kycDetails" && field === "uan") {
      if (trimmed && !/^\d{12}$/.test(trimmed)) return "UAN must be exactly 12 digits."
    }
    if (section === "kycDetails" && field === "pfNumber") {
      if (!trimmed) return "PF number is required."
      if (!PF_PATTERN.test(trimmed)) return "PF must follow MH/BAN/0000000/000 format."
    }
    return null
  }

  const shouldShowError = (field, section = null) => {
    const key = section ? `${section}.${field}` : field
    return touchedFields[key] ? getFieldError(field, section) : null
  }

  const getTabErrors = (tab) => {
    if (tab === "personal") {
      return [
        getFieldError("firstName"),
        getFieldError("MiddleName"),
        getFieldError("lastName"),
        getFieldError("dateOfBirth"),
        getFieldError("gender"),
        getFieldError("email"),
        getFieldError("phoneNumber"),
        getFieldError("currentAddress"),
      ].filter(Boolean)
    }
    if (tab === "employment") {
      return [
        getFieldError("employeeCode"),
        getFieldError("joiningDate"),
        getFieldError("designation"),
        getFieldError("department"),
        getFieldError("workLocation"),
        getFieldError("reportingManager"),
      ].filter(Boolean)
    }
    if (tab === "banking") {
      return [
        getFieldError("accountHolderName", "bankDetails"),
        getFieldError("bankName", "bankDetails"),
        getFieldError("accountNumber", "bankDetails"),
        getFieldError("ifscCode", "bankDetails"),
        getFieldError("panNumber", "kycDetails"),
        getFieldError("aadharNumber", "kycDetails"),
        getFieldError("uan", "kycDetails"),
        getFieldError("pfNumber", "kycDetails"),
      ].filter(Boolean)
    }
    if (tab === "documents") {
      const mandatoryDocs = ['aadharCard', 'panCard', 'resume', 'passportPhoto']
      const missing = mandatoryDocs.find(doc => !formData[doc])
      return [
        missing ? "Please upload all mandatory documents (*)." : null,
        !isConfirmed ? "Please confirm the authenticity declaration." : null,
      ].filter(Boolean)
    }
    return []
  }

  const touchTabFields = (tab) => {
    const fieldKeys = {
      personal: ["firstName", "MiddleName", "lastName", "dateOfBirth", "gender", "email", "phoneNumber", "currentAddress"],
      employment: ["employeeCode", "joiningDate", "designation", "department", "workLocation", "reportingManager"],
      banking: [
        "bankDetails.accountHolderName",
        "bankDetails.bankName",
        "bankDetails.accountNumber",
        "bankDetails.ifscCode",
        "kycDetails.panNumber",
        "kycDetails.aadharNumber",
        "kycDetails.uan",
        "kycDetails.pfNumber",
      ],
    }
    setTouchedFields(prev => ({
      ...prev,
      ...(fieldKeys[tab] || []).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
    }))
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
    return getTabErrors(tab)[0] || null;
  };

  const isTabValid = (tab) => getTabValidationError(tab) === null;

  const handleSaveProgress = async (nextTab) => {
    const errorMessage = getTabValidationError(activeTab);
    if (errorMessage) { touchTabFields(activeTab); toast.error(errorMessage); return; }
    if (!formData.email) { toast.error("Please enter a Personal Email to save progress."); return; }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('email', formData.email);
      const statusToSave = nextTab === "Completed"
        ? "Completed"
        : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      data.append('onboardingStatus', statusToSave);

      ONBOARDING_TEXT_FIELDS.forEach(key => {
        const value = formData[key];
        if (value !== undefined && value !== null && value !== "") {
          data.append(key, value);
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
        if (response.data) {
          setFormData(prev => ({
            ...prev,
            ...response.data,
            dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : prev.dateOfBirth,
            joiningDate: response.data.joiningDate ? response.data.joiningDate.split('T')[0] : prev.joiningDate,
            gender: response.data.gender || prev.gender,
            bankDetails: { ...prev.bankDetails, ...(response.data.bankDetails || {}) },
            kycDetails: { ...prev.kycDetails, ...(response.data.kycDetails || {}) },
          }))
        }
        toast.success(`${activeTab.toUpperCase()} details saved!`);
        if (nextTab) setActiveTab(nextTab);
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast.error(error?.message || error?.error || "Failed to save data");
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
                  <Input
                    value={formData.firstName}
                    onBlur={() => markTouched("firstName")}
                    onChange={(e) => handleChange("firstName", onlyLettersAndSpaces(e.target.value))}
                    placeholder="Rahul"
                    aria-invalid={Boolean(shouldShowError("firstName"))}
                  />
                  <FieldError message={shouldShowError("firstName")} />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name </Label>
                  <Input
                    value={formData.MiddleName}
                    onBlur={() => markTouched("MiddleName")}
                    onChange={(e) => handleChange("MiddleName", onlyLettersAndSpaces(e.target.value))}
                    placeholder="Kumar"
                    aria-invalid={Boolean(shouldShowError("MiddleName"))}
                  />
                  <FieldError message={shouldShowError("MiddleName")} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name </Label>
                  <Input
                    value={formData.lastName}
                    onBlur={() => markTouched("lastName")}
                    onChange={(e) => handleChange("lastName", onlyLettersAndSpaces(e.target.value))}
                    placeholder="Sharma"
                    aria-invalid={Boolean(shouldShowError("lastName"))}
                  />
                  <FieldError message={shouldShowError("lastName")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth *</Label>
                  <Input
                    type="date"
                    className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ""}
                    max={todayISO()}
                    onBlur={() => markTouched("dateOfBirth")}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                    aria-invalid={Boolean(shouldShowError("dateOfBirth"))}
                  />
                  <FieldError message={shouldShowError("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select value={formData.gender || ""} onValueChange={(val) => handleChange("gender", val)}>
                    <SelectTrigger aria-invalid={Boolean(shouldShowError("gender"))}><SelectValue placeholder="Select Gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError message={shouldShowError("gender")} />
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
                  <Input
                    value={formData.email}
                    onBlur={() => markTouched("email")}
                    onChange={(e) => handleChange("email", e.target.value.trim().toLowerCase())}
                    type="email"
                    placeholder="rahul@gmail.com"
                    aria-invalid={Boolean(shouldShowError("email"))}
                  />
                  <FieldError message={shouldShowError("email")} />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input
                    value={formData.phoneNumber}
                    inputMode="numeric"
                    maxLength={10}
                    onBlur={() => markTouched("phoneNumber")}
                    onChange={(e) => {
                      handleChange("phoneNumber", onlyDigits(e.target.value, 10));
                    }}
                    placeholder="7678988776"
                    aria-invalid={Boolean(shouldShowError("phoneNumber"))}
                  />
                  <FieldError message={shouldShowError("phoneNumber")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Address *</Label>
                <Textarea
                  value={formData.currentAddress}
                  onBlur={() => markTouched("currentAddress")}
                  onChange={(e) => handleChange("currentAddress", trimTextStart(e.target.value))}
                  placeholder="Full Address"
                  aria-invalid={Boolean(shouldShowError("currentAddress"))}
                />
                <FieldError message={shouldShowError("currentAddress")} />
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
                  <Input
                    disabled
                    value={formData.employeeCode || ""}
                    onChange={(e) => handleChange("employeeCode", e.target.value.toUpperCase(), null)}
                    placeholder="EMP-0001"
                    aria-invalid={Boolean(shouldShowError("employeeCode"))}
                  />
                  <FieldError message={shouldShowError("employeeCode")} />
                </div>
                <div className="space-y-2">
                  <Label>Date of Joining *</Label>
                  <Input
                    type="date"
                    className="relative w-full pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3"
                    value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ""}
                    onBlur={() => markTouched("joiningDate")}
                    onChange={(e) => handleChange("joiningDate", e.target.value)}
                    aria-invalid={Boolean(shouldShowError("joiningDate"))}
                  />
                  <FieldError message={shouldShowError("joiningDate")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Designation *</Label>
                  <Input
                    value={formData.designation || ""}
                    onBlur={() => markTouched("designation")}
                    onChange={(e) => handleChange("designation", e.target.value.replace(/[^A-Za-z .&/-]/g, "").replace(/\s+/g, " ").replace(/^\s/, ""))}
                    placeholder="Software Engineer"
                    aria-invalid={Boolean(shouldShowError("designation"))}
                  />
                  <FieldError message={shouldShowError("designation")} />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={formData.department || ""} onValueChange={(val) => handleChange("department", val)}>
                    <SelectTrigger aria-invalid={Boolean(shouldShowError("department"))}><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Operations">Operation</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError message={shouldShowError("department")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Input
                    value={formData.workLocation || ""}
                    onBlur={() => markTouched("workLocation")}
                    onChange={(e) => handleChange("workLocation", e.target.value.replace(/[^A-Za-z0-9 .,'-]/g, "").replace(/\s+/g, " ").replace(/^\s/, ""))}
                    placeholder="Chh. Sambhajinagar"
                    aria-invalid={Boolean(shouldShowError("workLocation"))}
                  />
                  <FieldError message={shouldShowError("workLocation")} />
                </div>
                <div className="space-y-2">
                  <Label>Reporting Manager *</Label>
                  <Select
                    value={
                      managers.find(manager =>
                        manager._id === formData.reportingManagerId ||
                        manager.employeeCode === formData.reportingManagerId ||
                        getManagerName(manager) === formData.reportingManager
                      )?._id || ""
                    }
                    onValueChange={handleReportingManagerChange}
                    disabled={loadingManagers || managers.length === 0}
                  >
                    <SelectTrigger
                      className="w-full"
                      onBlur={() => markTouched("reportingManager")}
                      aria-invalid={Boolean(shouldShowError("reportingManager"))}
                    >
                      <SelectValue placeholder={loadingManagers ? "Loading managers..." : "Select Reporting Manager"} />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          {getManagerName(manager)}
                          {manager.employeeCode ? ` (${manager.employeeCode})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={shouldShowError("reportingManager")} />
                  {!loadingManagers && managers.length === 0 && (
                    <p className="text-xs text-muted-foreground">No active managers found.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => setActiveTab("personal")}>Back to Personal</Button>
                <Button
                  disabled={loading}
                  onClick={() => {
                    if (isTabValid("employment")) { handleSaveProgress("banking"); }
                    else { touchTabFields("employment"); toast.error(getTabValidationError("employment") || "Please fill all mandatory official details (*)."); }
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
                    <Input
                      value={formData.bankDetails?.accountHolderName || ""}
                      onBlur={() => markTouched("accountHolderName", "bankDetails")}
                      onChange={(e) => handleChange("accountHolderName", onlyLettersAndSpaces(e.target.value), "bankDetails")}
                      placeholder="As per bank records"
                      aria-invalid={Boolean(shouldShowError("accountHolderName", "bankDetails"))}
                    />
                    <FieldError message={shouldShowError("accountHolderName", "bankDetails")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name *</Label>
                    <Input
                      value={formData.bankDetails?.bankName || ""}
                      onBlur={() => markTouched("bankName", "bankDetails")}
                      onChange={(e) => handleChange("bankName", e.target.value.replace(/[^A-Za-z .&-]/g, "").replace(/\s+/g, " ").replace(/^\s/, ""), "bankDetails")}
                      placeholder="e.g. HDFC Bank"
                      aria-invalid={Boolean(shouldShowError("bankName", "bankDetails"))}
                    />
                    <FieldError message={shouldShowError("bankName", "bankDetails")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Number *</Label>
                    <Input
                      value={formData.bankDetails?.accountNumber || ""}
                      placeholder="000012345678"
                      inputMode="numeric"
                      maxLength={18}
                      onBlur={() => markTouched("accountNumber", "bankDetails")}
                      onChange={(e) => {
                        handleChange("accountNumber", onlyDigits(e.target.value, 18), "bankDetails");
                      }}
                      aria-invalid={Boolean(shouldShowError("accountNumber", "bankDetails"))}
                    />
                    <FieldError message={shouldShowError("accountNumber", "bankDetails")} />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code *</Label>
                    <Input
                      value={formData.bankDetails?.ifscCode || ""}
                      placeholder="HDFC0001234"
                      className="uppercase"
                      maxLength={11}
                      onBlur={() => markTouched("ifscCode", "bankDetails")}
                      onChange={(e) => handleChange("ifscCode", alphaNumericUpper(e.target.value, 11), "bankDetails")}
                      aria-invalid={Boolean(shouldShowError("ifscCode", "bankDetails"))}
                    />
                    <FieldError message={shouldShowError("ifscCode", "bankDetails")} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Statutory (KYC) Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAN Number *</Label>
                    <Input
                      value={formData.kycDetails?.panNumber || ""}
                      placeholder="ABCDE1234F"
                      className="uppercase"
                      maxLength={10}
                      onBlur={() => markTouched("panNumber", "kycDetails")}
                      onChange={(e) => handleChange("panNumber", alphaNumericUpper(e.target.value, 10), "kycDetails")}
                      aria-invalid={Boolean(shouldShowError("panNumber", "kycDetails"))}
                    />
                    <FieldError message={shouldShowError("panNumber", "kycDetails")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhaar Number *</Label>
                    <Input
                      value={formData.kycDetails?.aadharNumber || ""}
                      placeholder="123456789012"
                      inputMode="numeric"
                      maxLength={12}
                      onBlur={() => markTouched("aadharNumber", "kycDetails")}
                      onChange={(e) => {
                        handleChange("aadharNumber", onlyDigits(e.target.value, 12), "kycDetails");
                      }}
                      aria-invalid={Boolean(shouldShowError("aadharNumber", "kycDetails"))}
                    />
                    <FieldError message={shouldShowError("aadharNumber", "kycDetails")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UAN(Universal Account Number)</Label>
                    <Input
                      value={formData.kycDetails?.uan || ""}
                      inputMode="numeric"
                      maxLength={12}
                      onBlur={() => markTouched("uan", "kycDetails")}
                      onChange={(e) => handleChange("uan", onlyDigits(e.target.value, 12), "kycDetails")}
                      placeholder="100123456789"
                      aria-invalid={Boolean(shouldShowError("uan", "kycDetails"))}
                    />
                    <FieldError message={shouldShowError("uan", "kycDetails")} />
                  </div>
                  <div className="space-y-2">
                    <Label>PF Number *</Label>
                    <Input
                      value={formData.kycDetails?.pfNumber || ""}
                      className="uppercase"
                      maxLength={18}
                      onBlur={() => markTouched("pfNumber", "kycDetails")}
                      onChange={(e) => handleChange("pfNumber", pfNumberValue(e.target.value), "kycDetails")}
                      placeholder="MH/BAN/0000000/000"
                      aria-invalid={Boolean(shouldShowError("pfNumber", "kycDetails"))}
                    />
                    <FieldError message={shouldShowError("pfNumber", "kycDetails")} />
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
                  { id: "aadharCard", label: "Aadhaar Card (Front & Back) *" },
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
