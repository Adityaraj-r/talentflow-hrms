import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Textarea } from "../../components/ui/textarea"
import { Checkbox } from "../../components/ui/checkbox"
import { UserPlus, Upload, CreditCard, Building, FileText, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

const Onboarding = () => {
  const [activeTab, setActiveTab] = useState("personal")

  const handleSave = () => {
    toast.success("Employee details saved successfully!")
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding & KYC</h1>
        <p className="text-muted-foreground">Complete employee master data creation.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="banking">Bank & Statutory</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Personal Information</CardTitle>
              <CardDescription>Basic details as per Aadhar/Passport</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>First Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Rahul" />
                </div>
                <div className="space-y-2">
                  <Label>Middle Name</Label>
                  <Input placeholder="e.g. Kumar" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Sharma" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A+</SelectItem>
                      <SelectItem value="o+">O+</SelectItem>
                      <SelectItem value="b+">B+</SelectItem>
                      <SelectItem value="ab+">AB+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Personal Email</Label>
                  <Input type="email" placeholder="rahul@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Address</Label>
                <Textarea placeholder="Flat No, Street, City, State, Pincode" />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("employment")}>Next: Employment</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Official Details</CardTitle>
              <CardDescription>Role, Department and Reporting Manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input placeholder="EMP-2025-001" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Joining</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input placeholder="Senior Developer" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">IT & Engineering</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="sales">Sales & Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reporting Manager</Label>
                  <Input placeholder="Search Manager..." />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Location</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select Office" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mum">Mumbai HQ</SelectItem>
                    <SelectItem value="blr">Bangalore Tech Park</SelectItem>
                    <SelectItem value="remote">Remote (India)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("personal")}>Back</Button>
                <Button onClick={() => setActiveTab("banking")}>Next: Banking & Statutory</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Bank & Statutory (KYC)</CardTitle>
              <CardDescription>Essential for Payroll Processing & Compliance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                <h3 className="font-semibold text-primary">Salary Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC Code</Label>
                    <Input placeholder="e.g. HDFC0001234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input placeholder="Enter Account Number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Name on Bank Account</Label>
                    <Input placeholder="As per Passbook" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                <h3 className="font-semibold text-primary">Statutory IDs (KYC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PAN Number</Label>
                    <Input placeholder="ABCDE1234F" className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Number</Label>
                    <Input placeholder="1234 5678 9012" />
                  </div>
                  <div className="space-y-2">
                    <Label>UAN (Universal Account Number)</Label>
                    <Input placeholder="For PF (if existing)" />
                  </div>
                  <div className="space-y-2">
                    <Label>PF Number</Label>
                    <Input placeholder="Previous PF Member ID" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("employment")}>Back</Button>
                <Button onClick={() => setActiveTab("documents")}>Next: Documents</Button>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentUploadBox label="Aadhar Card (Front & Back)" />
                <DocumentUploadBox label="PAN Card" />
                <DocumentUploadBox label="Cancelled Cheque / Bank Proof" />
                <DocumentUploadBox label="Passport Photo" />
                <DocumentUploadBox label="Previous Relieving Letter" />
                <DocumentUploadBox label="Highest Education Certificate" />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="terms" />
                <label htmlFor="terms" className="text-sm font-medium leading-none">
                  I confirm that all provided details and documents are authentic.
                </label>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setActiveTab("banking")}>Back</Button>
                <Button className="bg-green-600 hover:bg-green-700 w-40" onClick={handleSave}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const DocumentUploadBox = ({ label }) => (
  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer">
    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
    <h4 className="font-medium text-sm">{label}</h4>
    <p className="text-xs text-muted-foreground mt-1">Click to upload or drag file</p>
  </div>
)

export default Onboarding
