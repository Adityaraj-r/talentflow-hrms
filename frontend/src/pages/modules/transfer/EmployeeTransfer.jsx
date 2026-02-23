"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRole } from "@/contexts/RoleContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Check, X, Search, ArrowLeftRight, CheckCircle2, Clock, XCircle } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { cn } from "@/lib/utils"

const EmployeeTransfer = () => {
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const { hasRole } = useRole()
  
  const API_URL = "http://localhost:5001/api/transfers"

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/all`)
      const data = res.data
      setTransfers(data)
      
      setStats({
        total: data.length,
        approved: data.filter(t => t.status === "Approved").length,
        pending: data.filter(t => t.status === "Pending").length,
        rejected: data.filter(t => t.status === "Rejected").length,
      })
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load transfer requests from database")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [])

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const response = await axios.patch(`${API_URL}/update/${id}`, {
        status: newStatus,
        adminRemarks: `Action taken by Admin on ${new Date().toLocaleDateString()}`
      })

      if (response.data.success) {
        toast.success(`Request ${newStatus} successfully`)
        fetchTransfers() 
      }
    } catch (error) {
      toast.error("Error updating transfer status")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Transfer</h1>
        <p className="text-muted-foreground">Manage employee transfers between departments or locations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats.total} icon={<ArrowLeftRight className="text-blue-500" />} />
        <StatCard title="Approved" value={stats.approved} icon={<CheckCircle2 className="text-green-500" />} color="text-green-600" />
        <StatCard title="Pending" value={stats.pending} icon={<Clock className="text-orange-500" />} color="text-orange-600" />
        <StatCard title="Rejected" value={stats.rejected} icon={<XCircle className="text-red-500" />} color="text-red-600" />
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <TransferTable 
            data={transfers.filter(t => t.status === "Pending")} 
            onAction={handleUpdateStatus} 
            isHistory={false} 
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <TransferTable 
            data={transfers.filter(t => t.status !== "Pending")} 
            isHistory={true} 
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const StatCard = ({ title, value, icon, color = "text-foreground" }) => (
  <Card className="shadow-md border-none transition-all hover:shadow-lg">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className={cn("text-2xl font-bold mt-1", color)}>{value}</h3>
      </div>
      <div className="p-3 bg-muted rounded-full">{icon}</div>
    </CardContent>
  </Card>
)

const TransferTable = ({ data, onAction, isHistory, loading }) => {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(item => 
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="shadow-sm border">
      {isHistory && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Transfer Logs</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search transfers..." 
              className="pl-8 w-[200px] md:w-[300px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("p-0", isHistory ? "pt-2" : "pt-0")}>
        <div className="rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-left font-medium">
                <th className="p-4">Employee</th>
                <th className="p-4">ID</th>
                <th className="p-4">{isHistory ? "From" : "Current"} Dept</th>
                <th className="p-4">{isHistory ? "To" : "New"} Dept</th>
                <th className="p-4">Type</th>
                <th className="p-4">Effective Date</th>
                <th className="p-4 text-center">{isHistory ? "Status" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">Loading data from MongoDB...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-muted-foreground">No records found</td></tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{item.employeeName}</td>
                    <td className="p-4">{item.employeeId}</td>
                    <td className="p-4">{item.currentDepartment}</td>
                    <td className="p-4">{item.newDepartment}</td>
                    <td className="p-4">{item.transferType}</td>
                    <td className="p-4">{new Date(item.effectiveDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {isHistory ? (
                        <div className="flex justify-center">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                            item.status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {item.status}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:bg-green-50" 
                            onClick={() => onAction(item._id, 'Approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:bg-red-50" 
                            onClick={() => onAction(item._id, 'Rejected')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
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
  )
}

export default EmployeeTransfer