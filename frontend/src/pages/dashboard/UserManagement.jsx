import { useState, useEffect, useCallback } from "react" // Add useEffect and useCallback
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Label } from "../../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog"
import {
  Search, Plus, Upload, Filter, Edit, Power, Eye, Lock,
  Users, UserCheck, UserX, ShieldAlert, FileSpreadsheet, UploadCloud
} from "lucide-react"
import { toast } from "sonner"
import adminService from "../../services/adminService"
import { ROLES } from "../../constants/roles"



const UserManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [users, setUsers] = useState([]) // Initialize as empty array
  const [filters, setFilters] = useState({ search: '', role: 'all' }) // For dynamic filtering

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    department: '',
    phoneNumber: ''
  })
  // NEW: Fetch users from backend
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers(filters);

      // Check if the backend response structure is response.data
      const userData = response.data || [];
      // Add this at Line 53 of UserManagement.jsx
      console.log("DEBUG: Raw Response from Service:", response);

      const formattedUsers = userData.map(u => ({
        id: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`,
        email: u.email,
        role: u.role,
        status: u.isActive ? 'Active' : 'Inactive',
        // Generates initials 
        avatar: (u.firstName?.[0] || 'U') + (u.lastName?.[0] || 'S')
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      // This calls the code you provided in adminService.js
      const response = await adminService.enrollUser(formData);
      toast.success(response.message);
      setIsCreateOpen(false);
      fetchUsers();
      // Suggestion: call a function here to refresh your metrics/user list
      // fetchMetrics(); 
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Bulk User Upload state declarations
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      toast.info(`Selected: ${file.name}`);
    }
  };
  const handleToggleStatus = async (userId) => {
    try {
      // This calls the toggle-status endpoint we discussed
      const response = await adminService.toggleUserStatus(userId);
      toast.success(response.message);

      // Refresh the table so user status changes immediately
      fetchUsers();
    } catch (error) {
      console.error("Toggle Error:", error);
      toast.error(error.message || "Failed to update user status");
    }
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    try {
      const response = await adminService.bulkUploadUsers(selectedFile);
      toast.success(response.message || "Bulk upload successful!");
      setIsBulkOpen(false);
      setSelectedFile(null);
      fetchUsers();
      // Refresh user list logic here
    } catch (error) {
      toast.error(error.message || "Bulk upload failed");
    } finally {
      setIsUploading(false);
    }
  };
  // Add this before the 'return (' in UserManagement.jsx
  const activeCount = users.filter(u => u.status === 'Active').length;
  const inactiveCount = users.filter(u => u.status === 'Inactive').length;
  // Note: If you have a 'Deactivated' status in your DB, filter for it specifically
  const deactivatedCount = users.filter(u => u.status === 'Deactivated').length;


  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Admin Dashboard / User Management</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Bulk User Upload</DialogTitle>
                <DialogDescription>Upload a CSV or Excel file.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Hidden File Input */}
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />

                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">
                    {selectedFile ? selectedFile.name : "Drag & Drop file here"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="secondary" size="sm" type="button">
                    {selectedFile ? "Change File" : "Select File"}
                  </Button>
                </div>

                {/* Template Download Section */}
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium">Template.csv</p>
                      <p className="text-xs text-muted-foreground">Use this format</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    Download
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
                <Button onClick={handleProcessUpload} disabled={isUploading}>
                  {isUploading ? "Uploading..." : "Upload & Process"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Enter employee details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fname">First Name</Label>
                    <Input
                      id="fname"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lname">Last Name</Label>
                    <Input
                      id="lname"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>{value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept">Department</Label>
                    <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                      <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+91"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateUser}>Create User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={users.length.toString()}
          icon={<Users className="h-5 w-5" />}
          className="text-blue-500 bg-blue-500/10 border-blue-500/20"
        />
        <StatsCard
          title="Active Users"
          value={activeCount.toString()}
          icon={<UserCheck className="h-5 w-5" />}
          className="text-green-500 bg-green-500/10 border-green-500/20"
        />
        <StatsCard
          title="Inactive Users"
          value="0"
          icon={<UserX className="h-5 w-5" />}
          className="text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
        />
        <StatsCard
          title="Deactivated"
          value={inactiveCount.toString()}
          icon={<ShieldAlert className="h-5 w-5" />}
          className="text-red-500 bg-red-500/10 border-red-500/20"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center border-b">
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." className="pl-8" value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} />
              </div>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="w-[185px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.entries(ROLES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"><input type="checkbox" className="rounded border-gray-300" /></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Fetching real-time employee data...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No employees found in the database.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {user.avatar}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal capitalize text-xs">
                        {user.role?.toLowerCase().replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={user.status === 'Active'
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${user.status === 'Active'
                              ? 'text-red-500 hover:bg-red-50'    // Red when user is Active (Deactivation action)
                              : 'text-green-500 hover:bg-green-50' // Green when user is Inactive (Activation action)
                            }`}
                          onClick={() => handleToggleStatus(user.id)}
                          title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.status === 'Active' ? (
                            <Power className="h-4 w-4" /> // Power icon for stopping
                          ) : (
                            <UserCheck className="h-4 w-4" /> // Check icon for starting
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing 1 to 8 of 156 users</div>
            <div className="flex items-center gap-2">
              <span className="mr-2">Page 1</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">{"<"}</Button>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">{">"}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const StatsCard = ({ title, value, icon, className }) => (
  <Card className={`border ${className}`}>
    <CardContent className="p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10">{icon}</div>
    </CardContent>
  </Card>
)

export default UserManagement
