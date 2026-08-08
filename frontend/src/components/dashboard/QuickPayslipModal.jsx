import { useState } from "react";
import { X, Loader2, Download, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const QuickPayslipModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("January 2026");

  if (!isOpen) return null;

  const handleDownload = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      toast.success(`Payslip for ${selectedMonth} downloaded successfully!`);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to download payslip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Download Payslip</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Pay Period</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="January 2026">January 2026 (Latest - Processed)</option>
              <option value="December 2025">December 2025</option>
              <option value="November 2025">November 2025</option>
              <option value="October 2025">October 2025</option>
            </select>
          </div>

          {/* Quick Info Box */}
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
              <span>PERIOD</span>
              <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5" /> Ready for Download</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedMonth}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">PDF includes basic salary, allowances, tax deductions, and net payout summary.</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = "/payroll/salary-slip";
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline"
            >
              View Full Payroll Module →
            </button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickPayslipModal;
