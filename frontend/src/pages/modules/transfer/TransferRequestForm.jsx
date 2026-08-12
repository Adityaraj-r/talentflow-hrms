import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const TransferRequestForm = ({ onSuccess }) => {
    const { user } = useAuth();
    const userRole = (user?.role || "").toUpperCase();
    const isHrOrAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER", "CEO", "SUPER ADMIN", "COUNTRY_MANAGER", "DEPARTMENT_MANAGER"].includes(userRole);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [selectedEmpCode, setSelectedEmpCode] = useState("");

    const [formData, setFormData] = useState({
        employeeId: user?.employeeCode || "",
        employeeName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : (user?.name || ""),
        currentDepartment: user?.department || "",
        employeeEmail: user?.email || "",
        newDepartment: "",
        transferType: "",
        effectiveDate: "",
        reason: "",
        declaration: false,
    });

    useEffect(() => {
        if (isHrOrAdmin) {
            setLoadingEmployees(true);
            apiClient.get("/employees")
                .then((res) => {
                    const list = res?.data ?? res ?? [];
                    setEmployees(Array.isArray(list) ? list : []);
                })
                .catch((err) => {
                    console.error("Failed to load employees for transfer:", err);
                })
                .finally(() => setLoadingEmployees(false));
        }
    }, [isHrOrAdmin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const isFormValid =
        formData.employeeId &&
        formData.employeeName &&
        formData.currentDepartment &&
        formData.newDepartment &&
        formData.transferType &&
        formData.effectiveDate &&
        formData.declaration;

    const ALL_DEPARTMENTS = [
        { value: "IT", label: "IT" },
        { value: "HR", label: "Human Resources" },
        { value: "Operations", label: "Operations" },
        { value: "Sales", label: "Sales" },
        { value: "Marketing", label: "Marketing" },
        { value: "Finance", label: "Finance" }
    ];

    const availableDepartments = ALL_DEPARTMENTS.filter(
        (dept) =>
            dept.value.toLowerCase() !== (formData.currentDepartment || "").toLowerCase() &&
            dept.label.toLowerCase() !== (formData.currentDepartment || "").toLowerCase()
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await apiClient.post("/transfers/submit", formData);
            if (response.success || response.data) {
                toast.success("Transfer request submitted successfully!");
                setFormData({
                    employeeId: user?.employeeCode || "",
                    employeeName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "",
                    currentDepartment: user?.department || "",
                    employeeEmail: user?.email || "",
                    newDepartment: "",
                    transferType: "",
                    effectiveDate: "",
                    reason: "",
                    declaration: false,
                });
                setSelectedEmpCode("");
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to submit request. Please try again.";
            toast.error(errorMessage);
            console.error("Submission Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            <div className="w-full bg-white dark:bg-slate-900 rounded-[16px] shadow-sm border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Employee Select for HR & Admin */}
                        {isHrOrAdmin && (
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Select Employee to Transfer <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={selectedEmpCode}
                                    onValueChange={(code) => {
                                        setSelectedEmpCode(code);
                                        const emp = employees.find((e) => (e.employeeCode || e._id) === code);
                                        if (emp) {
                                            const name = emp.firstName
                                                ? `${emp.firstName} ${emp.lastName || ""}`.trim()
                                                : (emp.name || emp.employeeCode || code);
                                            setFormData((prev) => ({
                                                ...prev,
                                                employeeId: emp.employeeCode || emp._id,
                                                employeeName: name,
                                                currentDepartment: emp.department || "General",
                                                employeeEmail: emp.email || "",
                                            }));
                                        }
                                    }}
                                >
                                    <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                                        <SelectValue placeholder={loadingEmployees ? "Loading employees list..." : "Choose an employee to transfer..."} />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700 max-h-60">
                                        {employees.map((emp) => {
                                            const code = emp.employeeCode || emp._id;
                                            const name = emp.firstName
                                                ? `${emp.firstName} ${emp.lastName || ""}`.trim()
                                                : (emp.name || code);
                                            return (
                                                <SelectItem key={emp._id || code} value={code}>
                                                    {name} ({code}) — {emp.department || "No Dept"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Employee ID */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Employee ID <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="employeeId"
                                placeholder="e.g. EMP001"
                                value={formData.employeeId}
                                readOnly
                                disabled
                                className="bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400 dark:border-slate-700"
                            />
                        </div>

                        {/* Employee Name */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Employee Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="employeeName"
                                placeholder="Full name"
                                value={formData.employeeName}
                                readOnly
                                disabled
                                className="bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400 dark:border-slate-700"
                            />
                        </div>

                        {/* Current Department */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Current Department <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="currentDepartment"
                                placeholder="e.g. IT"
                                value={formData.currentDepartment}
                                readOnly
                                disabled
                                className="bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400 dark:border-slate-700"
                            />
                        </div>

                        {/* New Department */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                New Department <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.newDepartment}
                                onValueChange={(v) => setFormData({ ...formData, newDepartment: v })}
                            >
                                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                                    <SelectValue placeholder="Select New Department" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                    {/* Dynamically render ONLY the filtered departments */}
                                    {availableDepartments.map((dept) => (
                                        <SelectItem key={dept.value} value={dept.value}>
                                            {dept.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Transfer Type */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Transfer Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.transferType}
                                onValueChange={(v) => setFormData({ ...formData, transferType: v })}
                            >
                                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-700">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                    <SelectItem value="Departmental">Departmental Transfer</SelectItem>
                                    <SelectItem value="Location">Location Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Effective Date */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Effective Date <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                name="effectiveDate"
                                type="date"
                                value={formData.effectiveDate}
                                onChange={handleChange}
                                className="w-full relative pr-10 dark:bg-slate-900 dark:border-slate-700 dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reason for Transfer</Label>
                        <Textarea
                            name="reason"
                            placeholder="Briefly explain your request..."
                            value={formData.reason}
                            onChange={handleChange}
                            className="min-h-[80px] resize-none dark:bg-slate-900 dark:border-slate-700"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="terms"
                                checked={formData.declaration}
                                onCheckedChange={(checked) => setFormData({ ...formData, declaration: !!checked })}
                                className="dark:border-slate-600"
                            />
                            <Label htmlFor="terms" className="text-sm cursor-pointer select-none dark:text-gray-300">
                                I confirm these details are accurate.
                            </Label>
                        </div>
                        <Button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className="w-full sm:w-[200px] shadow-sm font-semibold"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferRequestForm;