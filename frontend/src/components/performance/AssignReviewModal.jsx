import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { reviewApi } from "../../../services/reviewApi";
import apiClient from "../../../services/apiClient";

const DEFAULT_COMPETENCIES = [
  { name: "Communication" },
  { name: "Teamwork" },
  { name: "Problem Solving" },
  { name: "Technical Skills" },
  { name: "Leadership" },
];

const AssignReviewModal = ({ isOpen, onClose, cycleId, cycleName, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    reviewerId: "", // FIXED: was missing — caused every review to be assigned to logged-in user
    competencies: DEFAULT_COMPETENCIES.map((c) => ({ name: c.name })),
  });
  const [newCompetency, setNewCompetency] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    // FIXED: validate cycleId before fetching
    if (!cycleId) {
      toast.error("Invalid cycle — please close and reopen.");
      return;
    }
    loadFormData();
  }, [isOpen, cycleId]);

  const loadFormData = async () => {
    try {
      setLoadingData(true);
      // Fetch active employees
      const empRes = await apiClient.get("/users", {
        params: { role: "EMPLOYEE", isActive: true, limit: 100 },
      });
      const empData = empRes.data ?? empRes;
      setEmployees(
        Array.isArray(empData)
          ? empData
          : empData?.users ?? empData?.data ?? []
      );

      // Fetch managers (DIRECT_MANAGER + DEPARTMENT_MANAGER)
      const [dmRes, deptRes] = await Promise.all([
        apiClient.get("/users", {
          params: { role: "DIRECT_MANAGER", isActive: true, limit: 100 },
        }),
        apiClient.get("/users", {
          params: { role: "DEPARTMENT_MANAGER", isActive: true, limit: 100 },
        }),
      ]);
      const dmData = dmRes.data ?? dmRes;
      const deptData = deptRes.data ?? deptRes;
      const dmList = Array.isArray(dmData)
        ? dmData
        : dmData?.users ?? dmData?.data ?? [];
      const deptList = Array.isArray(deptData)
        ? deptData
        : deptData?.users ?? deptData?.data ?? [];
      // Merge and deduplicate
      const merged = [...dmList, ...deptList];
      const unique = merged.filter(
        (m, i, arr) => arr.findIndex((x) => x._id === m._id) === i
      );
      setManagers(unique);
    } catch (error) {
      toast.error("Failed to load form data");
    } finally {
      setLoadingData(false);
    }
  };

  const addCompetency = () => {
    const trimmed = newCompetency.trim();
    if (!trimmed) return;
    if (form.competencies.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Competency already exists");
      return;
    }
    setForm((prev) => ({
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
    setForm((prev) => ({
      ...prev,
      competencies: prev.competencies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId) { toast.error("Please select an employee"); return; }
    if (!form.reviewerId) { toast.error("Please select a reviewer"); return; }
    if (form.competencies.length === 0) { toast.error("Please add at least one competency"); return; }
    try {
      setSubmitting(true);
      await reviewApi.assignReview({
        cycleId,
        employeeId: form.employeeId,
        reviewerId: form.reviewerId, // FIXED: send reviewer from form, not auto-set from backend
        competencies: form.competencies,
      });
      toast.success("Review assigned successfully!");
      resetForm();
      onSuccess?.();
    } catch (error) {
      const msg = error?.error || error?.message || "Failed to assign review";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      employeeId: "",
      reviewerId: "",
      competencies: DEFAULT_COMPETENCIES.map((c) => ({ name: c.name })),
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
            {cycleName && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Cycle: {cycleName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-sm text-gray-500">Loading employees and managers...</span>
              </div>
            ) : (
              <>
                {/* Employee Select */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.employeeId}
                    onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select an employee --</option>
                    {employees.length === 0 ? (
                      <option disabled>No active employees found</option>
                    ) : (
                      employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} ({emp.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Reviewer Select — ADDED */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reviewer (Manager) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.reviewerId}
                    onChange={(e) => setForm((prev) => ({ ...prev, reviewerId: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select a manager/reviewer --</option>
                    {managers.length === 0 ? (
                      <option disabled>No managers found</option>
                    ) : (
                      managers.map((mgr) => (
                        <option key={mgr._id} value={mgr._id}>
                          {mgr.firstName} {mgr.lastName} — {mgr.role} ({mgr.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Competencies */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Competencies <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {form.competencies.map((comp, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
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
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newCompetency}
                      onChange={(e) => setNewCompetency(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCompetency(); } }}
                      placeholder="Add custom competency..."
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addCompetency}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Press Enter or click + to add. These will be rated 1–5 during the review.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingData}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignReviewModal;
