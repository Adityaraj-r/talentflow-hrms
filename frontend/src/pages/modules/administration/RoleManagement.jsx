import { useState, useEffect } from "react";
import { Save, Plus, Loader2, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getRoles, updateRole, createRole, deleteRole } from "@/services/roleService";

const RoleManagement = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const modules = [
    { id: "dashboard", name: "Dashboard Access", description: "View analytics and main stats" },
    { id: "employees", name: "Employee Center", description: "Directory & Profiles" },
    { id: "recruitment", name: "Recruitment & ATS", description: "Job postings and candidate tracking" },
    { id: "payroll", name: "Payroll Operations", description: "Salary & Compensation" },
    { id: "attendance", name: "Time & Attendance", description: "Leaves & Shifts" },
    { id: "settings", name: "System Configuration", description: "Global Settings" },
    { id: "roles", name: "Access Control", description: "RBAC Management" },
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
    const updatedRoles = [...roles];
    const role = updatedRoles[roleIndex];

    if (!role.permissions) role.permissions = {};
    if (!role.permissions[moduleId]) role.permissions[moduleId] = { read: false, write: false, delete: false };

    role.permissions[moduleId][type] = !role.permissions[moduleId][type];
    
    // Enforce logic: Write/Delete requires Read access
    if (type !== 'read' && role.permissions[moduleId][type]) {
        role.permissions[moduleId]['read'] = true;
    }
    if (type === 'read' && !role.permissions[moduleId]['read']) {
        role.permissions[moduleId]['write'] = false;
        role.permissions[moduleId]['delete'] = false;
    }

    setRoles(updatedRoles);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(roles.map(role => updateRole(role._id, { permissions: role.permissions })));
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

  const handleAddRole = async () => {
    const name = prompt("Role Name:");
    if (!name) return;
    try {
        await createRole(name);
        const data = await getRoles();
        setRoles(data);
        toast.success("Role created");
    } catch (error) {
        toast.error("Creation failed");
    }
  }

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
            <Button variant="outline" onClick={handleAddRole} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Role
            </Button>
            <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
            </Button>
        </div>
      </div>

      <div className="flex-1 border rounded-lg bg-card shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="sticky left-0 z-20 bg-background border-b border-r px-6 py-4 font-semibold min-w-[250px]">
                  Module / Feature
                </th>
                {roles.map((role) => (
                  <th key={role._id} className="border-b px-4 py-4 min-w-[200px] text-center bg-muted/50">
                    <div className="flex flex-col items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border
                          ${role.name === 'Super Admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                            role.isSystemRole ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-background border-border text-foreground'}`}>
                          {role.name}
                       </span>
                       {!role.isSystemRole ? (
                          <button onClick={() => handleDeleteRole(role._id)} className="text-muted-foreground hover:text-red-500 p-1">
                             <Trash2 className="h-3.5 w-3.5" />
                          </button>
                       ) : <Lock className="h-3 w-3 text-muted-foreground/30" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {modules.map((module) => (
                <tr key={module.id} className="hover:bg-muted/50 transition-colors">
                  <td className="sticky left-0 z-10 bg-background border-r px-6 py-4 font-medium text-sm">
                    {module.name}
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">{module.description}</div>
                  </td>
                  {roles.map((role, rIndex) => {
                    const perms = role.permissions?.[module.id] || { read: false, write: false, delete: false };
                    const isSuperAdmin = role.name === 'Super Admin';
                    return (
                        <td key={role._id} className="px-4 py-4 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                             <PermissionToggle active={perms.read} onClick={() => !isSuperAdmin && togglePermission(rIndex, module.id, 'read')} label="View" variant="blue" disabled={isSuperAdmin} />
                             <PermissionToggle active={perms.write} onClick={() => !isSuperAdmin && togglePermission(rIndex, module.id, 'write')} label="Edit" variant="amber" disabled={isSuperAdmin} />
                             <PermissionToggle active={perms.delete} onClick={() => !isSuperAdmin && togglePermission(rIndex, module.id, 'delete')} label="Del" variant="red" disabled={isSuperAdmin} />
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
    </div>
  );
};

const PermissionToggle = ({ active, onClick, label, variant, disabled }) => {
    const colors = {
        blue: active ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" : "bg-transparent text-muted-foreground border-transparent hover:bg-muted",
        amber: active ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800" : "bg-transparent text-muted-foreground border-transparent hover:bg-muted",
        red: active ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800" : "bg-transparent text-muted-foreground border-transparent hover:bg-muted",
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

export default RoleManagement;