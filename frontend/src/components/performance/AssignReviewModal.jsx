import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reviewApi } from "@/services/reviewApi";
import api from "@/services/apiClient";

const DEFAULT_COMPETENCIES = [
  { name: "Communication" },
  { name: "Teamwork" },
  { name: "Problem Solving" },
  { name: "Technical Skills" },
  { name: "Leadership" },
];

const AssignReviewModal = ({ isOpen, onClose, cycleId, cycleName, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    competencies: DEFAULT_COMPETENCIES.map(c => ({ name: c.name })),
  });

  const [newCompetency, setNewCompetency] = useState("");


  useEffect(() => {
    if (!isOpen) return;
    loadEmployees();
  }, [isOpen]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get("/users?role=EMPLOYEE&limit=100");
      setEmployees(res.data?.data || res.data?.users || res.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoadingEmployees(false);
    }
  };


  const addCompetency = () => {
    const trimmed = newCompetency.trim();
    if (!trimmed) return;
    if (form.competencies.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Competency already exists");
      return;
    }
    setForm(prev => ({
      ...prev,
      competencies: [...prev.competencies, { name: trimmed }],
    }));
    setNewCompetency("");
  };

  const removeCompetency = (index) => {
    if (form.competencies.length <= 1) {
      toast.error("At least one competency is required");
      return;
    }
    setForm(prev => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.employeeId) {
      toast.error("Please select an employee");
      return;
    }
    if (form.competencies.length === 0) {
      toast.error("Please add at least one competency");
      return;
    }

    try {
      setSubmitting(true);
      await reviewApi.assignReview({
        cycleId,
        employeeId: form.employeeId,
        competencies: form.competencies,
      });

      toast.success("Review assigned successfully!");
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Assign review error:", error);
      const msg = error?.response?.data?.error || "Failed to assign review";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      competencies: DEFAULT_COMPETENCIES.map(c => ({ name: c.name })),
    });
    setNewCompetency("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Review</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {cycleName ? `Cycle: ${cycleName}` : "Assign a performance review to an employee"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">

            {/* Employee Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Select Employee <span className="text-red-500">*</span>
              </label>
              {loadingEmployees ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading employees...
                </div>
              ) : (
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Select an employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} — {emp.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Competencies */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Competencies <span className="text-red-500">*</span>
              </label>

              <div className="space-y-2 mb-3">
                {form.competencies.map((comp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <span className="text-sm text-gray-800 dark:text-gray-200">{comp.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCompetency(index)}
                      className="text-red-400 hover:text-red-600 transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Competency Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCompetency}
                  onChange={(e) => setNewCompetency(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetency(); } }}
                  placeholder="Add custom competency..."
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addCompetency}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                Press Enter or click + to add. These will be rated 1–5 during the review.
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Assign Review
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AssignReviewModal;
