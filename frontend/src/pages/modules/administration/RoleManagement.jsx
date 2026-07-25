import { useState, useEffect } from "react";
import { Save, Plus, Loader2, Trash2, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRoles, updateRole, createRole, deleteRole } from "@/services/roleService";
import { clearPermissionCache } from "@/services/permissionService";
import { useUser } from "@/contexts/UserContext";

const RoleManagement = () => {
  const { user: u, refreshPermissions } = useUser();
  const canRolesWrite = u?.can?.("roles", "write");
  const canRolesDelete = u?.can?.("roles", "delete");
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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
      toast.success("Permissions updated");
    } catch (error) {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (id) => {
    if(!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
        await deleteRole(id);
        const data = await getRoles();
        setRoles(data);
        toast.success("Role deleted");
    } catch (error) {
        toast.error("Delete failed");
    }
  }

  const handleAddRole = () => {
    setNewRoleName("");
    setIsAddModalOpen(true);
  };

  const submitNewRole = async (e) => {
    e?.preventDefault();
    if (!newRoleName.trim()) return;
    setIsCreating(true);
    try {
        await createRole(newRoleName.trim());
        const data = await getRoles();
        setRoles(data);
        toast.success("Role created successfully");
        setIsAddModalOpen(false);
    } catch (error) {
        toast.error(error?.response?.data?.message || error?.response?.data?.error || "Failed to create role");
    } finally {
        setIsCreating(false);
    }
  };

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access Control Matrix</h1>
          <p className="text-muted-foreground text-sm">
            Manage granular permissions for {roles.length} active roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
            {canRolesWrite && (
            <Button variant="outline" onClick={handleAddRole} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
            )}
            {canRolesWrite && (
            <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
            )}
        </div>
      </div>

      <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="bg-muted/50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="sticky left-0 z-30 bg-background border-b border-r border-border px-6 py-4 font-semibold min-w-[250px] max-w-[250px] shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.4)]">
                  Module / Feature
                </th>
                {roles.map((role) => (
                  <th key={role._id} className="border-b px-4 py-4 min-w-[200px] text-center bg-muted/50">
                    <div className="flex flex-col items-center gap-2">
                       <span 
                         title={role.name}
                         className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border max-w-[150px] truncate block
                          ${role.name === 'Super Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                            role.isSystemRole ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-background border-border text-foreground'}`}>
                          {role.name}
                       </span>
                       {!role.isSystemRole ? (
                          canRolesDelete ? (
                          <button onClick={() => handleDeleteRole(role._id)} className="text-muted-foreground hover:text-red-500 p-1">
                             <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          ) : null
                       ) : <Lock className="h-3 w-3 text-muted-foreground/30" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-muted/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-background border-b border-r border-border px-6 py-4 font-medium text-sm shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.4)]">
                    {module.name}
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">{module.description}</div>
                  </td>
                  {roles.map((role, rIndex) => {
                    const perms = role.permissions?.[module.id] || { read: false, write: false, delete: false };
                    const isSuperAdmin = role.name === 'Super Admin';
                    return (
                        <td key={role._id} className="border-b border-border px-4 py-4 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                             <PermissionToggle active={perms.read} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'read')} label="View" variant="blue" disabled={isSuperAdmin || !canRolesWrite} />
                             <PermissionToggle active={perms.write} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'write')} label="Edit" variant="amber" disabled={isSuperAdmin || !canRolesWrite} />
                             <PermissionToggle active={perms.delete} onClick={() => !isSuperAdmin && canRolesWrite && togglePermission(rIndex, module.id, 'delete')} label="Del" variant="red" disabled={isSuperAdmin || !canRolesWrite} />
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
      <CreateRoleModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSubmit={submitNewRole}
        name={newRoleName}
        setName={setNewRoleName}
        isCreating={isCreating}
      />
    </div>
  );
};

const PermissionToggle = ({ active, onClick, label, variant, disabled }) => {
    const colors = {
        blue: active ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/80 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10",
        amber: active ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/80 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10",
        red: active ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted/80 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:bg-white/10",
    };
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wide rounded border transition-all ${colors[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {label}
        </button>
    );
};

const CreateRoleModal = ({ isOpen, onClose, onSubmit, name, setName, isCreating }) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    onSubmit(e);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md p-6 bg-card border border-white/10 shadow-2xl shadow-black/40 rounded-xl animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground hover:bg-white/10 p-1 rounded-md transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-xl font-bold text-foreground mb-6">Add New Role</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="roleName" className="block text-sm font-medium text-muted-foreground mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                id="roleName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowError(false);
                }}
                placeholder="e.g. Frontend Engineer"
                className={`w-full px-3 py-2.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  showError ? 'border-red-500/50 focus:ring-red-500/50' : 'border-input'
                }`}
                autoFocus
                disabled={isCreating}
              />
              {showError && (
                <p className="text-xs text-red-500 mt-1.5 animate-in slide-in-from-top-1">
                  Role name cannot be empty.
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleManagement;