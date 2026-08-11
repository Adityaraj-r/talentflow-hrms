import { useState, useEffect } from "react";
import { Save, Plus, Loader2, Trash2, Lock, X, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRoles, updateRole, createRole, deleteRole } from "@/services/roleService";
import { clearPermissionCache } from "@/services/permissionService";
import { useUser } from "@/contexts/UserContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const RoleManagement = () => {
  const { confirm } = useConfirm();
  const { user: u, refreshPermissions } = useUser();
  const canRolesWrite = u?.can?.("roles", "write");
  const canRolesDelete = u?.can?.("roles", "delete");
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [originalRoles, setOriginalRoles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ id: null, name: "" });
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isDeleteRoleOpen, setIsDeleteRoleOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const modules = [
    { id: "dashboard", name: "Dashboard Access", description: "View analytics and main stats" },
    { id: "employees", name: "Employee Center", description: "Directory & Profiles" },
    { id: "recruitment", name: "Recruitment & ATS", description: "Job postings and candidate tracking" },
    { id: "payroll", name: "Payroll Operations", description: "Salary & Compensation" },
    { id: "attendance", name: "Time & Attendance", description: "Leaves & Shifts" },
    { id: "settings", name: "System Configuration", description: "Global Settings" },
    { id: "roles", name: "Access Control", description: "RBAC Management" },
    { id: "audit", name: "Audit & Compliance", description: "Security and administration logs" },
    { id: "performance", name: "Performance (PMS)", description: "Appraisal cycles, reviews, goals, PIP" },
  ];

  useEffect(() => {
    const init = async () => {
      try {
        const data = await getRoles();
        setRoles(data);
        setOriginalRoles(JSON.parse(JSON.stringify(data)));
      } catch (error) {
        toast.error("Failed to sync roles");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const togglePermission = (roleIndex, moduleId, type) => {
    const updatedRoles = roles.map((role, i) => {
      if (i !== roleIndex) return role;
      
      const permissions = { ...role.permissions };
      const modulePerms = { ...(permissions[moduleId] || { read: false, write: false, delete: false }) };
      
      modulePerms[type] = !modulePerms[type];
      
      // Enforce logic: Write/Delete requires Read access
      if (type !== 'read' && modulePerms[type]) {
          modulePerms.read = true;
      }
      if (type === 'read' && !modulePerms.read) {
          modulePerms.write = false;
          modulePerms.delete = false;
      }
      
      permissions[moduleId] = modulePerms;
      return { ...role, permissions };
    });

    setRoles(updatedRoles);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(roles.map(role => updateRole(role._id, { permissions: role.permissions })));
      clearPermissionCache();
      if (refreshPermissions) refreshPermissions();
      setOriginalRoles(JSON.parse(JSON.stringify(roles)));
      toast.success("Permissions updated");
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setIsDeleteRoleOpen(true);
  };

  const executeDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeletingRole(true);
    try {
        await deleteRole(roleToDelete._id);
        const data = await getRoles();
        setRoles(data);
        setOriginalRoles(JSON.parse(JSON.stringify(data)));
        toast.success("Role deleted successfully");
        setIsDeleteRoleOpen(false);
        setRoleToDelete(null);
    } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Delete failed");
    } finally {
        setIsDeletingRole(false);
    }
  };

  const handleAddRole = () => {
    setRoleFormData({ id: null, name: "" });
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role) => {
    setRoleFormData({ id: role._id, name: role.name });
    setIsRoleModalOpen(true);
  };

  const submitRoleForm = async (e) => {
    e?.preventDefault();
    if (!roleFormData.name.trim()) return;
    setIsSavingRole(true);
    try {
        if (roleFormData.id) {
          await updateRole(roleFormData.id, { name: roleFormData.name.trim() });
          toast.success("Role updated successfully");
        } else {
          await createRole(roleFormData.name.trim());
          toast.success("Role created successfully");
        }
        const data = await getRoles();
        setRoles(data);
        setOriginalRoles(JSON.parse(JSON.stringify(data)));
        setIsRoleModalOpen(false);
    } catch (error) {
        toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to save role");
    } finally {
        setIsSavingRole(false);
    }
  };

  const hasUnsavedChanges = JSON.stringify(roles) !== JSON.stringify(originalRoles);

  const formatRoleName = (name) => {
    if (!name) return "";
    if (name === "Super Admin") return name;
    return name
      .split(/[_ ]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-6 max-w-full pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Access Control Matrix</h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Manage granular permissions for {roles.length} active roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
            {canRolesWrite && (
            <Button variant="outline" onClick={handleAddRole} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
            )}
            {canRolesWrite && (
            <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5 animate-in fade-in bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Unsaved Changes
                    </span>
                )}
                <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} size="sm" className="transition-all">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                </Button>
            </div>
            )}
        </div>
      </div>

      <div className="flex-1 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="sticky left-0 z-40 bg-muted/50 backdrop-blur-md border-b border-r border-border/50 px-6 py-5 font-semibold text-sm min-w-[250px] max-w-[250px] shadow-[4px_0_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.2)]">
                  Module / Feature
                </th>
                {roles.map((role) => (
                  <th key={role._id} className="border-b border-l border-border/50 px-4 py-5 min-w-[220px] text-center bg-muted/50 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-2">
                       <span 
                         title={formatRoleName(role.name)}
                         className="text-[14px] font-semibold text-foreground max-w-[200px] truncate block tracking-tight"
                       >
                          {formatRoleName(role.name)}
                       </span>
                       {!role.isSystemRole ? (
                          <div className="flex gap-1">
                            {canRolesWrite && (
                              <button 
                                onClick={() => handleEditRole(role)}
                                className="text-muted-foreground/60 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              >
                                 <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canRolesDelete && (
                              <button 
                                onClick={() => confirmDeleteRole(role)}
                                className="text-muted-foreground/60 hover:text-red-600 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                       ) : <Lock className="h-3.5 w-3.5 text-muted-foreground/40" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {modules.map((module) => (
                <tr key={module.id} className="group hover:bg-blue-600/5 dark:hover:bg-blue-500/10 transition-colors duration-200">
                  <td className="sticky left-0 z-10 bg-background border-b border-r border-border/50 px-6 py-5 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_12px_-2px_rgba(0,0,0,0.2)] transition-colors duration-200">
                    <div className="font-semibold text-sm text-foreground">{module.name}</div>
                    <div className="text-[12px] text-muted-foreground font-normal mt-1 leading-relaxed">{module.description}</div>
                  </td>
                  {roles.map((role, rIndex) => {
                    const perms = role.permissions?.[module.id] || { read: false, write: false, delete: false };
                    const isSuperAdmin = role.name === 'Super Admin';
                    return (
                        <td key={role._id} className="border-b border-l border-border/50 px-4 py-5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                             <PermissionToggle active={perms.read} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'read')} label="View" variant="blue" disabled={isSuperAdmin || !canRolesWrite} />
                             <PermissionToggle active={perms.write} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'write')} label="Edit" variant="amber" disabled={isSuperAdmin || !canRolesWrite} />
                             <PermissionToggle active={perms.delete} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'delete')} label="Delete" variant="red" disabled={isSuperAdmin || !canRolesWrite} />
                          </div>
                        </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{roleFormData.id ? "Edit Role" : "Create New Role"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRoleForm} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label htmlFor="roleName" className="text-sm font-medium">Role Name</label>
              <input
                id="roleName"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                placeholder="e.g. HR Manager, Developer"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSavingRole || !roleFormData.name.trim()}>
                {isSavingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {roleFormData.id ? "Save Changes" : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation Modal */}
      <Dialog open={isDeleteRoleOpen} onOpenChange={setIsDeleteRoleOpen}>
        <DialogContent className="sm:max-w-[420px] bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl sm:rounded-[16px]">
          <DialogHeader className="flex flex-col items-center justify-center text-center space-y-3 pt-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-1 ring-8 ring-red-50 dark:ring-red-900/10">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Delete Role
            </DialogTitle>
            <DialogDescription className="text-sm text-center flex flex-col items-center gap-4 text-muted-foreground w-full">
              <span className="leading-relaxed px-2">
                Are you sure you want to delete the role{" "}
                <strong className="text-foreground font-semibold">"{roleToDelete?.name}"</strong>{" "}
                from the system?
              </span>
              
              <div className="bg-muted/40 p-4 rounded-xl w-full border border-border/50">
                <span className="text-sm text-foreground font-semibold block mb-3">This action will:</span>
                <ul className="text-[13px] text-muted-foreground list-none space-y-2 flex flex-col items-center text-center">
                  <li>Permanently remove the role from the system</li>
                  <li>Remove all permissions associated with this role</li>
                  <li>Require reassignment of existing users</li>
                </ul>
              </div>
              
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-3 py-1.5 rounded-full">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 pt-4 sm:justify-between w-full mt-2">
            <Button variant="outline" onClick={() => { setIsDeleteRoleOpen(false); setRoleToDelete(null) }} disabled={isDeletingRole} className="w-full sm:w-1/2 h-11 rounded-xl font-medium">
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeDeleteRole} disabled={isDeletingRole}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-1/2 h-11 rounded-xl font-medium shadow-md shadow-red-500/20">
              {isDeletingRole
                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                : "Delete Role"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PermissionToggle = ({ active, onClick, label, variant, disabled }) => {
    const activeColors = {
        blue: "bg-transparent text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/10",
        amber: "bg-transparent text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-500/30 dark:hover:bg-amber-500/10",
        red: "bg-transparent text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/10",
    };
    const inactiveColor = "bg-transparent text-muted-foreground/60 border-border/50 hover:bg-muted/40 dark:hover:bg-white/5";
    
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`h-[28px] min-w-[64px] px-3 text-[12px] font-semibold rounded-[9999px] border transition-colors flex items-center justify-center ${active ? activeColors[variant] : inactiveColor} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    );
};

export default RoleManagement;