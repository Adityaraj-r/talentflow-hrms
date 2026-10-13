import { useState } from "react";
import { X, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RequestDocumentModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "Salary Certificate",
    reason: "",
    urgency: "Standard",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate network request delay
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`${formData.documentType} request submitted successfully!`);
      if (onSuccess) onSuccess(formData);
      onClose();
      setFormData({ documentType: "Salary Certificate", reason: "", urgency: "Standard" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit document request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request HR Document</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Document Type</label>
            <select
              name="documentType"
              value={formData.documentType}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="Salary Certificate">Salary Certificate</option>
              <option value="Employment Verification">Employment Verification Letter</option>
              <option value="NOC Certificate">No Objection Certificate (NOC)</option>
              <option value="Experience Letter">Experience Letter</option>
              <option value="Tax Form 16">Tax Form 16</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority / Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="Standard">Standard (2-3 Business Days)</option>
              <option value="Urgent">Urgent (24 Hours)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose / Reason</label>
            <textarea
              name="reason"
              required
              rows="3"
              placeholder="e.g. Required for bank loan / visa application..."
              value={formData.reason}
              onChange={handleChange}
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = "/role/employee/document-requests";
              }}
              className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 underline"
            >
              View Document Module →
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestDocumentModal;
