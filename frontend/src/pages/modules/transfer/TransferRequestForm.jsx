import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios"; 

const TransferRequestForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        employeeId: "",
        employeeName: "",
        currentDepartment: "",
        newDepartment: "",
        transferType: "",
        effectiveDate: "",
        reason: "",
        declaration: false,
    });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post("http://localhost:5001/api/transfers/submit", formData);
            
            if (response.data.success) {
                toast.success("Transfer request submitted successfully!");
                setFormData({
                    employeeId: "",
                    employeeName: "",
                    currentDepartment: "",
                    newDepartment: "",
                    transferType: "",
                    effectiveDate: "",
                    reason: "",
                    declaration: false,
                });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to submit request. Please try again.";
            toast.error(errorMessage);
            console.error("Submission Error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex justify-center py-2 px-4"> 
            <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 p-8 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* Employee ID */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Employee ID <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                name="employeeId"
                                placeholder="e.g. EMP001"
                                value={formData.employeeId} 
                                onChange={handleChange}
                            />
                        </div>

                        {/* Employee Name */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Employee Name <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                name="employeeName"
                                placeholder="Enter your full name"
                                value={formData.employeeName} 
                                onChange={handleChange}
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
                                onChange={handleChange}
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
                                <SelectTrigger>
                                    <SelectValue placeholder="Select New Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="IT">IT</SelectItem>
                                    <SelectItem value="HR">Human Resources</SelectItem>
                                    <SelectItem value="Operations">Operations</SelectItem>
                                    <SelectItem value="Sales">Sales</SelectItem>
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
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
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
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="terms"
                                checked={formData.declaration}
                                onCheckedChange={(checked) => setFormData({ ...formData, declaration: !!checked })}
                            />
                            <Label htmlFor="terms" className="text-sm cursor-pointer select-none">
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