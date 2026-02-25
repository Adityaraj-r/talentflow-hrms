import { useState, useEffect } from "react";
import { 
  Building2, Plus, Pencil, Trash2, Search, 
  Loader2, Users, ArrowLeft, Briefcase 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  getDepartments, 
  addDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentDetails,
  assignManager,
  getPotentialManagers
} from "@/services/departmentService";

const CompanyStructure = () => {
  const [view, setView] = useState('list');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const [selectedDeptDetails, setSelectedDeptDetails] = useState(null);
  const [deptEmployees, setDeptEmployees] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedManager, setSelectedManager] = useState("");

  const getUserName = (user) => {
    if (!user) return "Unknown";
    return user.name || user.fullName || user.username || user.email?.split('@')[0] || "User";
  };

  const getRoleName = (user) => {
    if (!user) return "";
    return typeof user.role === 'string' ? user.role : user.role?.name || "";
  };

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenModal = (dept = null) => {
    if (dept) {
      setCurrentDept(dept);
      setFormData({ name: dept.name, description: dept.description || "" });
    } else {
      setCurrentDept(null);
      setFormData({ name: "", description: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name required");

    setSubmitting(true);
    try {
      if (currentDept) {
        await updateDepartment(currentDept._id, formData);
        toast.success("Updated successfully");
      } else {
        await addDepartment(formData);
        toast.success("Created successfully");
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (error) {
      toast.error(error.toString());
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Deleted successfully");
      fetchDepartments();
    } catch (error) {
      toast.error(error.toString());
    }
  };

  const handleManageDepartment = async (deptId) => {
    setDetailLoading(true);
    setView('details');
    try {
      const [detailsData, managersList] = await Promise.all([
        getDepartmentDetails(deptId),
        getPotentialManagers()
      ]);

      setSelectedDeptDetails(detailsData.department);
      setDeptEmployees(detailsData.employees);
      setSelectedManager(detailsData.department.manager?._id || "");
      setAllUsers(managersList);

    } catch (error) {
      console.error(error);
      toast.error("Failed to load details");
      setView('list');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManager) return;
    try {
      await assignManager(selectedDeptDetails._id, selectedManager);
      toast.success("Manager assigned successfully");
      
      const updatedManager = allUsers.find(u => u._id === selectedManager);
      setSelectedDeptDetails(prev => ({
        ...prev,
        manager: updatedManager
      }));
      
    } catch (error) {
      toast.error("Failed to assign manager");
    }
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || "NA";

  if (view === 'list') {
    const filtered = departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company Structure</h1>
            <p className="text-muted-foreground">Manage departments and assign managers.</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </div>

        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((dept) => (
              <Card 
                key={dept._id} 
                className="group hover:shadow-md transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary"
                onClick={() => handleManageDepartment(dept._id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleOpenModal(dept); }}>
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleDelete(dept._id, e)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg">{dept.name}</h3>
                  <div className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">
                    {dept.description || "No description."}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                           {getInitials(getUserName(dept.manager))}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-medium truncate">
                            {dept.manager ? getUserName(dept.manager) : "No Manager"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                           {dept.manager?.email || "Assign one"}
                        </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentDept ? 'Edit Department' : 'New Department'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <DialogFooter>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }


  if (view === 'details') {
    if (detailLoading || !selectedDeptDetails) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    const sortedUsers = [...allUsers].sort((a, b) => {
        const roleA = getRoleName(a).toLowerCase();
        const roleB = getRoleName(b).toLowerCase();
        if (roleA.includes('manager') && !roleB.includes('manager')) return -1;
        if (!roleA.includes('manager') && roleB.includes('manager')) return 1;
        return 0;
    });

    return (
      <div className="space-y-6">
        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => setView('list')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Departments
        </Button>

        <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {selectedDeptDetails.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{selectedDeptDetails.description}</p>
                        
                        <div className="pt-4 border-t">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Department Head</Label>
                            <div className="flex items-center gap-3 mt-3 mb-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src="" />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(getUserName(selectedDeptDetails.manager))}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{selectedDeptDetails.manager ? getUserName(selectedDeptDetails.manager) : "Unassigned"}</p>
                                    <p className="text-xs text-muted-foreground">{selectedDeptDetails.manager?.email || "No email"}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <Select value={selectedManager} onValueChange={setSelectedManager}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Select Manager" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortedUsers.map(user => (
                                            <SelectItem key={user._id} value={user._id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{getUserName(user)}</span>
                                                    <span className="text-xs text-muted-foreground">({getRoleName(user)})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button size="sm" onClick={handleAssignManager}>Assign</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Total Headcount</p>
                                <p className="text-2xl font-bold">{deptEmployees.length}</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {deptEmployees.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>No employees assigned to this department yet.</p>
                                <p className="text-xs mt-1">Go to "Administration User Management" to assign departments to users.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {deptEmployees.map(emp => (
                                    <div key={emp._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarFallback>{getInitials(getUserName(emp))}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{getUserName(emp)}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{emp.designation || "No Designation"}</span>
                                                    <span>•</span>
                                                    <span>{emp.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-medium px-2 py-1 bg-secondary rounded text-secondary-foreground">
                                            {getRoleName(emp)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CompanyStructure;