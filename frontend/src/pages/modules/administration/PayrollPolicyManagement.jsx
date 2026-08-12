import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, RefreshCw, Plus, Eye, Pencil, Ban, Percent, MapPin, Receipt, Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

const POLICY_TYPES = ['PF_RATE', 'ESI_RATE', 'PT_SLAB', 'TAX_SLAB'];

const POLICY_TYPE_META = {
  PF_RATE:   { label: 'Provident Fund', icon: Percent,  color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  ESI_RATE:  { label: 'ESI',            icon: Percent,  color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  PT_SLAB:   { label: 'Professional Tax', icon: MapPin, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950' },
  TAX_SLAB:  { label: 'Income Tax',     icon: Receipt,  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' },
};

const PayrollPolicyManagement = () => {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        policyType: 'PF_RATE',
        state: '',
        effectiveFrom: '',
        changeNote: '',
        employeeRate: '',
        employerRate: '',
        wageCeiling: '',
        eligibilityThreshold: '',
        standardDeduction: '',
    });
    const [slabs, setSlabs] = useState([{ min: 0, max: '', rate: '' }]);

    const addSlabRow = () => {
        setSlabs((prev) => [...prev, { min: '', max: '', rate: '' }]);
    };

    const removeSlabRow = (index) => {
        setSlabs((prev) => prev.filter((_, i) => i !== index));
    };

    const updateSlabRow = (index, field, value) => {
        setSlabs((prev) =>
            prev.map((slab, i) => (i === index ? { ...slab, [field]: value } : slab))
        );
    };

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get('http://localhost:5001/api/payroll/payroll-policies', {
                withCredentials: true,
            });
            if (data.success) setPolicies(data.data);
        } catch (error) {
            toast.error('Failed to load policies', {
                description: error.response?.data?.error || 'Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handleEdit = (policy) => {
        setEditingPolicy(policy);

        setFormData({
            policyType: policy.policyType,
            state: policy.state || '',
            effectiveFrom: policy.effectiveFrom?.substring(0, 10),
            changeNote: policy.changeNote || '',
            employeeRate: policy.rules?.employeeRate || '',
            employerRate: policy.rules?.employerRate || '',
            wageCeiling: policy.rules?.wageCeiling || '',
            eligibilityThreshold: policy.rules?.eligibilityThreshold || '',
            standardDeduction: policy.rules?.standardDeduction || '',
        });

        if (policy.rules?.slabs) {
            setSlabs(
                policy.rules.slabs.map(s => ({
                    min: s.min,
                    max: s.max ?? '',
                    rate: s.rate
                }))
            );
        }

        setShowForm(true);
    };

    const buildRules = () => {
        const parsedSlabs = slabs.map((s) => ({
            min: Number(s.min),
            max: s.max === '' ? null : Number(s.max),
            rate: Number(s.rate),
        }));

        switch (formData.policyType) {
            case 'PF_RATE':
                return {
                    employeeRate: Number(formData.employeeRate),
                    employerRate: Number(formData.employerRate),
                    wageCeiling: Number(formData.wageCeiling),
                };
            case 'ESI_RATE':
                return {
                    employeeRate: Number(formData.employeeRate),
                    employerRate: Number(formData.employerRate),
                    eligibilityThreshold: Number(formData.eligibilityThreshold),
                };
            case 'TAX_SLAB':
                return {
                    slabs: parsedSlabs,
                    standardDeduction: Number(formData.standardDeduction),
                };
            case 'PT_SLAB':
                return { slabs: parsedSlabs };
            default:
                return {};
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);

            if (!formData.effectiveFrom) {
                toast.error('Effective date is required');
                return;
            }
            if (formData.policyType === 'PT_SLAB' && !formData.state) {
                toast.error('State is required for Professional Tax policies');
                return;
            }

            const rules = buildRules();

            const payload = {
                policyType: formData.policyType,
                effectiveFrom: formData.effectiveFrom,
                changeNote: formData.changeNote,
                rules,
                ...(formData.policyType === 'PT_SLAB' ? { state: formData.state } : {}),
            };

            let data;

            if (editingPolicy) {
                const response = await axios.put(
                    `http://localhost:5001/api/payroll/payroll-policies/${editingPolicy._id}`,
                    payload,
                    { withCredentials: true }
                );

                data = response.data;
            } else {
                const response = await axios.post(
                    'http://localhost:5001/api/payroll/payroll-policies',
                    payload,
                    { withCredentials: true }
                );

                data = response.data;
            }

            if (data.success) {
                toast.success('Policy version created', {
                    description: `${formData.policyType} v${data.data.version} is now active.`,
                });
                setShowForm(false);
                setEditingPolicy(null);
                await fetchPolicies();
            }
        } catch (error) {
            toast.error('Failed to create policy', {
                description: error.response?.data?.error || 'Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async (id) => {
        try {
            const { data } = await axios.patch(
                `http://localhost:5001/api/payroll/payroll-policies/${id}/deactivate`,
                {},
                { withCredentials: true }
            );
            if (data.success) {
                toast.success('Policy deactivated');
                await fetchPolicies();
            }
        } catch (error) {
            toast.error('Failed to deactivate', {
                description: error.response?.data?.error || 'Please try again.',
            });
        }
    };
    const handleViewPolicy = (policy) => {
        setSelectedPolicy(policy);
        setShowPolicyModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-full pb-10">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Payroll Policies</h1>
                        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
                            Manage statutory rates for PF, ESI, Professional Tax, and Income Tax
                        </p>
                    </div>
                    <Button onClick={() => setShowForm((s) => !s)} size="lg" className="gap-2 cursor-pointer">
                        <Plus className="h-4 w-4" />
                        New Policy Version
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {showForm && (
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] bg-white dark:bg-slate-900 overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {editingPolicy ? "Edit Policy" : "Create Policy Version"}
                            </CardTitle>
                            <CardDescription>
                                Creating a new version automatically closes the previous active version's effective date.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Policy Type</Label>
                                    <Select
                                        value={formData.policyType}
                                        onValueChange={(value) => handleChange('policyType', value)}
                                    >
                                        <SelectTrigger className="h-11 cursor-pointer">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {POLICY_TYPES.map((type) => (
                                                <SelectItem key={type} value={type} className="cursor-pointer">{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                                    <Input
                                        id="effectiveFrom"
                                        type="date"
                                        value={formData.effectiveFrom}
                                        onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                                        className="h-11 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                            </div>

                            {formData.policyType === 'PT_SLAB' && (
                                <div className="space-y-2">
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        placeholder="Maharashtra"
                                        className="h-11"
                                    />
                                </div>
                            )}

                            {(formData.policyType === 'PF_RATE' || formData.policyType === 'ESI_RATE') && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="employeeRate">Employee Rate (%)</Label>
                                        <Input
                                            id="employeeRate"
                                            type="number"
                                            step="0.01"
                                            value={formData.employeeRate}
                                            onChange={(e) => handleChange('employeeRate', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employerRate">Employer Rate (%)</Label>
                                        <Input
                                            id="employerRate"
                                            type="number"
                                            step="0.01"
                                            value={formData.employerRate}
                                            onChange={(e) => handleChange('employerRate', e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="wageCeiling">
                                            {formData.policyType === 'PF_RATE' ? 'Wage Ceiling (₹)' : 'Eligibility Threshold (₹)'}
                                        </Label>
                                        <Input
                                            id="wageCeiling"
                                            type="number"
                                            value={
                                                formData.policyType === 'PF_RATE'
                                                    ? formData.wageCeiling
                                                    : formData.eligibilityThreshold
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    formData.policyType === 'PF_RATE' ? 'wageCeiling' : 'eligibilityThreshold',
                                                    e.target.value
                                                )
                                            }
                                            className="h-11"
                                        />
                                    </div>
                                </div>
                            )}

                            {(formData.policyType === 'TAX_SLAB' || formData.policyType === 'PT_SLAB') && (
                                <div className="space-y-4">
                                    {formData.policyType === 'TAX_SLAB' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="standardDeduction">Standard Deduction (₹)</Label>
                                            <Input
                                                id="standardDeduction"
                                                type="number"
                                                value={formData.standardDeduction}
                                                onChange={(e) => handleChange('standardDeduction', e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Income Slabs</Label>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
                                                <span>From (₹)</span>
                                                <span>Up to (₹, blank = no limit)</span>
                                                <span>{formData.policyType === 'PT_SLAB' ? 'Amount (₹, flat)' : 'Rate (%)'}</span>
                                                <span></span>
                                            </div>
                                            {slabs.map((slab, i) => (
                                                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                                                    <Input
                                                        type="number"
                                                        value={slab.min}
                                                        onChange={(e) => updateSlabRow(i, 'min', e.target.value)}
                                                        placeholder="0"
                                                        className="h-10"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={slab.max}
                                                        onChange={(e) => updateSlabRow(i, 'max', e.target.value)}
                                                        placeholder="No limit"
                                                        className="h-10"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={slab.rate}
                                                        onChange={(e) => updateSlabRow(i, 'rate', e.target.value)}
                                                        placeholder={formData.policyType === 'PT_SLAB' ? '175' : '5'}
                                                        className="h-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeSlabRow(i)}
                                                        disabled={slabs.length === 1}
                                                        className="cursor-pointer disabled:cursor-not-allowed"
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addSlabRow} className="gap-2 cursor-pointer">
                                            <Plus className="h-4 w-4" />
                                            Add Slab
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="changeNote">Change Note</Label>
                                <Input
                                    id="changeNote"
                                    value={formData.changeNote}
                                    onChange={(e) => handleChange('changeNote', e.target.value)}
                                    placeholder="e.g. Budget 2026 revision"
                                    className="h-11"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setShowForm(false)} className="cursor-pointer">
                                    Cancel
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving} className="gap-2 cursor-pointer disabled:cursor-not-allowed">
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editingPolicy ? "Update Policy" : "Create Version"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Current Policies</CardTitle>
                        <CardDescription>All policy versions, most recent first</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {policies.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-12 text-center">
                                No policies yet. Create one to get started.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[880px]">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th className="py-3 px-4 text-centre">Version</th>
                                            <th className="py-3 px-4 text-centre">Policy</th>
                                            <th className="py-3 px-4 text-centre">Effective Period</th>
                                            <th className="py-3 px-4 text-centre">Status</th>
                                            <th className="py-3 px-4 text-centre">Note</th>
                                            <th className="py-3 px-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {policies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((p) => {
                                            const meta = POLICY_TYPE_META[p.policyType] || {};
                                            const TypeIcon = meta.icon || Landmark;
                                            return (
                                                <tr
                                                    key={p._id}
                                                    className={`border-b hover:bg-accent/40 transition-colors ${p.isActive ? 'border-l-2 border-l-emerald-500' : ''}`}
                                                >
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${meta.color || 'bg-gray-100 text-gray-500'}`}>
                                                                <TypeIcon className="h-4 w-4" />
                                                            </span>
                                                            <div>
                                                                <p className="font-medium leading-tight">{meta.label || p.policyType}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {p.policyType}{p.state ? ` · ${p.state}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                                                            v{p.version}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                                                        {new Date(p.effectiveFrom).toLocaleDateString()}
                                                        <span className="text-muted-foreground mx-1">→</span>
                                                        {p.effectiveTo ? new Date(p.effectiveTo).toLocaleDateString() : (
                                                            <span className="text-muted-foreground">Ongoing</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${p.isActive
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                                            }`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                                            {p.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-muted-foreground max-w-[220px] truncate" title={p.changeNote || ''}>
                                                        {p.changeNote || '—'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewPolicy(p)}
                                                                className="h-8 w-8 cursor-pointer"
                                                                title="View details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEdit(p)}
                                                                className="h-8 w-8 cursor-pointer"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            {p.isActive && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeactivate(p._id)}
                                                                    className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                                    title="Deactivate"
                                                                >
                                                                    <Ban className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {policies.length > 0 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.ceil(policies.length / itemsPerPage) || 1}
                                    totalItems={policies.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Dialog
                    open={showPolicyModal}
                    onOpenChange={setShowPolicyModal}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                Payroll Policy Details
                            </DialogTitle>
                        </DialogHeader>

                        {selectedPolicy && (
                            <div className="space-y-4 text-sm">

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <strong>Policy Type:</strong>{" "}
                                        {selectedPolicy.policyType}
                                    </div>

                                    <div>
                                        <strong>Version:</strong>{" "}
                                        v{selectedPolicy.version}
                                    </div>

                                    <div>
                                        <strong>Status:</strong>{" "}
                                        {selectedPolicy.isActive ? "Active" : "Inactive"}
                                    </div>

                                    <div>
                                        <strong>State:</strong>{" "}
                                        {selectedPolicy.state || "N/A"}
                                    </div>

                                    <div>
                                        <strong>Effective From:</strong>{" "}
                                        {new Date(
                                            selectedPolicy.effectiveFrom
                                        ).toLocaleDateString()}
                                    </div>

                                    <div>
                                        <strong>Effective To:</strong>{" "}
                                        {selectedPolicy.effectiveTo
                                            ? new Date(
                                                selectedPolicy.effectiveTo
                                            ).toLocaleDateString()
                                            : "Present"}
                                    </div>
                                </div>

                                <div>
                                    <strong>Change Note</strong>

                                    <div className="mt-2 rounded bg-muted p-3">
                                        {selectedPolicy.changeNote || "No notes"}
                                    </div>
                                </div>

                                <div>
                                    <strong>Policy Rules</strong>

                                    <div className="space-y-3 rounded-md border p-4 bg-muted/30">

                                        {/* PF / ESI */}
                                        {(selectedPolicy.policyType === "PF_RATE" ||
                                            selectedPolicy.policyType === "ESI_RATE") && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Employee Rate</span>
                                                        <span>{selectedPolicy.rules.employeeRate}%</span>
                                                    </div>

                                                    <div className="flex justify-between">
                                                        <span className="font-medium">Employer Rate</span>
                                                        <span>{selectedPolicy.rules.employerRate}%</span>
                                                    </div>

                                                    {selectedPolicy.policyType === "PF_RATE" ? (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Wage Ceiling</span>
                                                            <span>
                                                                ₹{selectedPolicy.rules.wageCeiling?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between">
                                                            <span className="font-medium">Eligibility Threshold</span>
                                                            <span>
                                                                ₹{selectedPolicy.rules.eligibilityThreshold?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                        {/* TAX / PT */}
                                        {(selectedPolicy.policyType === "TAX_SLAB" ||
                                            selectedPolicy.policyType === "PT_SLAB") && (
                                                <table className="w-full border text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-muted">
                                                            <th className="p-2 text-left">From</th>
                                                            <th className="p-2 text-left">To</th>
                                                            <th className="p-2 text-left">
                                                                {selectedPolicy.policyType === "PT_SLAB"
                                                                    ? "Amount"
                                                                    : "Rate"}
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {selectedPolicy.rules.slabs?.map((slab, index) => (
                                                            <tr key={index} className="border-b">
                                                                <td className="p-2">
                                                                    ₹{slab.min.toLocaleString()}
                                                                </td>

                                                                <td className="p-2">
                                                                    {slab.max
                                                                        ? `₹${slab.max.toLocaleString()}`
                                                                        : "No Limit"}
                                                                </td>

                                                                <td className="p-2">
                                                                    {selectedPolicy.policyType === "PT_SLAB"
                                                                        ? `₹${slab.rate}`
                                                                        : `${slab.rate}%`}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}

                                    </div>
                                </div>

                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default PayrollPolicyManagement;