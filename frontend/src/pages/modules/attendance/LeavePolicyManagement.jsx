import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import leaveService from "@/services/leaveService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Users,
  RefreshCw,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; 
import { StatsCard } from "@/components/ui/stats-card";

const LEAVE_TYPES = [
  "Annual",
  "Sick",
  "Casual",
  "Earned",
  "Maternity",
  "Paternity",
  "Compassionate",
  "LWP",
  "Haj",
  "Iddah",
];

const APPLICABLE_TO = ["All", "Male", "Female"];

const defaultForm = {
  leaveType: "Annual",
  description: "",
  annualLimit: 0,
  carryForward: false,
  maxCarryForwardDays: 0,
  applicableTo: "All",
};

const PolicyFormModal = ({ open, onClose, onSave, editPolicy, loading }) => {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editPolicy) {
      setForm({
        leaveType: editPolicy.leaveType,
        description: editPolicy.description || "",
        annualLimit: editPolicy.annualLimit,
        carryForward: editPolicy.carryForward,
        maxCarryForwardDays: editPolicy.maxCarryForwardDays || 0,
        applicableTo: editPolicy.applicableTo || "All",
      });
    } else {
      setForm(defaultForm);
    }
  }, [editPolicy, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.annualLimit && form.annualLimit !== 0) {
      toast.error("Annual limit is required");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            {editPolicy ? "Edit Leave Policy" : "Create Leave Policy"}
          </DialogTitle>
          <DialogDescription>
            {editPolicy
              ? "Update the leave policy settings below."
              : "Define a new leave type and its annual entitlement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Leave Type</Label>
              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                disabled={!!editPolicy}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {editPolicy && (
                <p className="text-xs text-muted-foreground">
                  Leave type cannot be changed after creation.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Annual Limit (days)
              </Label>
              <Input
                type="number"
                name="annualLimit"
                min="0"
                max="365"
                value={form.annualLimit}
                onChange={handleChange}
                required
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Optional description of this leave type..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Applicable To</Label>
              <select
                name="applicableTo"
                value={form.applicableTo}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {APPLICABLE_TO.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Max Carry Forward (days)
              </Label>
              <Input
                type="number"
                name="maxCarryForwardDays"
                min="0"
                value={form.maxCarryForwardDays}
                onChange={handleChange}
                disabled={!form.carryForward}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              name="carryForward"
              id="carryForward"
              checked={form.carryForward}
              onChange={handleChange}
              className="w-4 h-4 accent-blue-600"
            />
            <label
              htmlFor="carryForward"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Allow unused days to carry forward to next year
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading
                ? "Saving..."
                : editPolicy
                ? "Update Policy"
                : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const LeavePolicyManagement = () => {
  const { user } = useUser();
  const userRole = user?.role?.toUpperCase();
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(userRole);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [activeCard, setActiveCard] = useState("total");

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAllPolicies();
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res?.success && Array.isArray(res?.data)) data = res.data;
      setPolicies(data);
    } catch {
      toast.error("Failed to load leave policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSave = async (form) => {
    try {
      setActionLoading(true);
      if (editPolicy) {
        await leaveService.updatePolicy(editPolicy._id, form);
        toast.success("Policy updated successfully");
      } else {
        await leaveService.createPolicy(form);
        toast.success("Policy created successfully");
      }
      setModalOpen(false);
      setEditPolicy(null);
      fetchPolicies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save policy");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading(true);
      await leaveService.deletePolicy(id);
      toast.success("Policy deactivated");
      setDeleteConfirmId(null);
      fetchPolicies();
    } catch {
      toast.error("Failed to deactivate policy");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      setInitLoading(true);
      const res = await leaveService.initializeBalances();
      toast.success(res?.message || "Leave balances initialized for all employees");
    } catch {
      toast.error("Failed to initialize balances");
    } finally {
      setInitLoading(false);
    }
  };

  const activeCount = policies.filter((p) => p.isActive).length;
  const totalDays = policies
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.annualLimit, 0);

  const filteredPolicies = policies.filter(p => {
    if (activeCard === 'total') return true;
    if (activeCard === 'active') return p.isActive;
    if (activeCard === 'total_days') return p.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Leave Policy Management
          </h1>
          <p className="text-muted-foreground">
            Define leave types, annual entitlements and carry-forward rules.
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={handleInitialize}
              disabled={initLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${initLoading ? "animate-spin" : ""}`} />
              {initLoading ? "Initializing..." : "Sync Balances"}
            </Button>
          )}
          <Button
            onClick={() => { setEditPolicy(null); setModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Add Policy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Policies"
          value={policies.length}
          icon={<ShieldCheck className="h-8 w-8" />}
          variant="blue"
          isActive={activeCard === 'total'}
          onClick={() => setActiveCard(activeCard === 'total' ? 'total' : 'total')}
        />
        <StatsCard
          title="Active Policies"
          value={activeCount}
          icon={<Users className="h-8 w-8" />}
          variant="green"
          isActive={activeCard === 'active'}
          onClick={() => setActiveCard(activeCard === 'active' ? 'total' : 'active')}
        />
        <StatsCard
          title="Total Days / Year"
          value={totalDays}
          icon={<CalendarDays className="h-8 w-8" />}
          variant="amber"
          isActive={activeCard === 'total_days'}
          onClick={() => setActiveCard(activeCard === 'total_days' ? 'total' : 'total_days')}
        />
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b p-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Configured Leave Policies
          </CardTitle>
          <CardDescription>
            Each policy defines how many days employees are entitled to per
            year. Click Sync Balances after creating new policies to apply
            them to all employees.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Annual Limit</TableHead>
                  <TableHead>Carry Forward</TableHead>
                  <TableHead>Applicable To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      Loading policies...
                    </TableCell>
                  </TableRow>
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No policies configured yet. Click Add Policy to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow
                      key={policy._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {policy.leaveType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] truncate block">
                          {policy.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {policy.annualLimit} days
                        </span>
                      </TableCell>
                      <TableCell>
                        {policy.carryForward ? (
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">
                            Yes — max {policy.maxCarryForwardDays}d
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            policy.applicableTo === "All"
                              ? "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
                              : policy.applicableTo === "Female"
                              ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400"
                              : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400"
                          }
                        >
                          {policy.applicableTo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {policy.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditPolicy(policy); setModalOpen(true); }}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmId(policy._id)}
                              disabled={!policy.isActive}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PolicyFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPolicy(null); }}
        onSave={handleSave}
        editPolicy={editPolicy}
        loading={actionLoading}
      />

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Deactivate Policy
            </DialogTitle>
            <DialogDescription>
              This will deactivate the policy. Employees will no longer be
              able to apply for this leave type. Existing approved leaves will
              not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleDelete(deleteConfirmId)}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePolicyManagement;