"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom" 
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Search, Loader2 } from "lucide-react" 
import { toast } from "sonner"

const Appraisal = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Appraisal (Direct Manager)</h1>
        <p className="text-muted-foreground">Conduct performance reviews for your direct reports</p>
      </div>

      <Tabs defaultValue="conduct">
        <TabsList>
          <TabsTrigger value="conduct">Conduct Appraisal</TabsTrigger>
          <TabsTrigger value="history">Appraisal History</TabsTrigger>
        </TabsList>

        <TabsContent value="conduct">
          <AppraisalForm />
        </TabsContent>

        <TabsContent value="history">
          <AppraisalHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const AppraisalForm = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    appraisalPeriod: "",
    performanceRating: "",
    comments: "",
    goals: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.employeeId || !formData.employeeName || !formData.department || !formData.appraisalPeriod || !formData.performanceRating) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      toast.success("Appraisal submitted successfully")
      setIsSubmitting(false)
      setFormData({
        employeeId: "", employeeName: "", department: "", appraisalPeriod: "",
        performanceRating: "", comments: "", goals: ""
      })
    }, 1500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conduct Performance Appraisal</CardTitle>
        <CardDescription>Submit a performance review for a direct report</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID <span className="text-red-500">*</span></Label>
              <Input id="employeeId" name="employeeId" placeholder="Enter employee ID" value={formData.employeeId} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeeName">Employee Name <span className="text-red-500">*</span></Label>
              <Input id="employeeName" name="employeeName" placeholder="Enter employee name" value={formData.employeeName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department <span className="text-red-500">*</span></Label>
              <Select value={formData.department} onValueChange={(v) => handleSelectChange("department", v)} required>
                <SelectTrigger id="department"><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appraisalPeriod">Appraisal Period <span className="text-red-500">*</span></Label>
              <Input id="appraisalPeriod" name="appraisalPeriod" type="month" value={formData.appraisalPeriod} onChange={handleChange} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="performanceRating">Performance Rating <span className="text-red-500">*</span></Label>
            <Select value={formData.performanceRating} onValueChange={(v) => handleSelectChange("performanceRating", v)} required>
              <SelectTrigger id="performanceRating"><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="satisfactory">Satisfactory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea id="comments" name="comments" placeholder="Enter comments" value={formData.comments} onChange={handleChange} rows={4} />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Appraisal"}
        </Button>
      </CardFooter>
    </Card>
  )
}

const AppraisalHistory = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false) 

  const appraisalHistory = [
    { id: 1, employeeName: "John Doe", employeeId: "EMP001", department: "IT", appraisalPeriod: "2025-02", performanceRating: "Good", status: "Approved" },
    { id: 2, employeeName: "Alice Johnson", employeeId: "EMP002", department: "HR", appraisalPeriod: "2025-01", performanceRating: "Satisfactory", status: "Rejected" },
  ]

  // 1. WIRE SEARCH BAR LOGIC
  const filteredHistory = appraisalHistory.filter(item =>
    item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appraisal History</CardTitle>
          <CardDescription>View history of performance appraisals</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search appraisals..."
              className="pl-8 w-[200px] md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="grid grid-cols-7 bg-muted/50 p-3 text-sm font-medium">
              <div>Employee</div>
              <div>ID</div>
              <div>Dept</div>
              <div>Period</div>
              <div>Rating</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((appraisal) => (
                  <div key={appraisal.id} className="grid grid-cols-7 p-3 text-sm items-center">
                    <div className="font-medium">{appraisal.employeeName}</div>
                    <div>{appraisal.employeeId}</div>
                    <div>{appraisal.department}</div>
                    <div>{appraisal.appraisalPeriod}</div>
                    <div>{appraisal.performanceRating}</div>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        appraisal.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {appraisal.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/role/DIRECT_MANAGER/review/${appraisal.id}`)} // 3. FIX NAVIGATION
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">No appraisals found.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default Appraisal