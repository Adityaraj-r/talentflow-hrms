import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Plus, Calendar, Users, FileText, X, Loader2, Award } from "lucide-react";
import { toast } from "sonner";
import EmployeeOverview from "@/pages/modules/employee-center/EmployeeOverview"
import PerformanceAnalytics from "@/pages/modules/performance/PerformanceAnalytics"
import { performanceApi } from "@/services/performanceApi";
import { useUser } from "@/contexts/UserContext";
import { useConfirm } from "@/contexts/ConfirmContext";

function pickApiError(error) {
  if (error && typeof error === "object" && error.error != null)
    return String(error.error);
  if (error && typeof error === "object" && error.message != null)
    return String(error.message);
  return "Request failed";
}

function toDateInputValue(value) {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.split("T")[0];
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const AdminPerformance = () => {
  const { user } = useUser();
  const { confirm } = useConfirm();
  const canPmsCycleStruct = user?.can?.("performance", "delete");
  const canPmsWrite = user?.can?.("performance", "write");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cycles");
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState({
    totalCycles: 0,
    activeCycles: 0,
    totalReviews: 0,
    avgScore: 0,
    cycles: []
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "active"
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, []);

    const loadPerformanceData = async () => {
  try {
    setLoading(true);
    const [statsResponse, cyclesResponse] = await Promise.all([
      performanceApi.getStats(),
      performanceApi.getCycles()
    ]);

    const stats  = statsResponse?.data  ?? statsResponse  ?? {};
    const cycles = cyclesResponse?.data ?? cyclesResponse ?? [];

    setPerformanceData({
      totalCycles:  stats.totalCycles  || 0,
      activeCycles: stats.activeCycles || 0,
      totalReviews: stats.totalReviews || 0,
      avgScore:     stats.avgScore     || 0,
      cycles: Array.isArray(cycles) ? cycles : []
    });
  } catch (error) {
    console.error('Failed to load performance data:', error);
    toast.error(pickApiError(error) || 'Failed to load performance data');
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleStatusChange = (value) => {
    setFormData(prev => ({ ...prev, status: value }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Cycle name is required";
    }
    
    if (!formData.startDate) {
      errors.startDate = "Start date is required";
    }
    
    if (!formData.endDate) {
      errors.endDate = "End date is required";
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = "End date must be after start date";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCycle = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setSubmitting(true);
      
      const cycleData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        status: formData.status
      };

      await performanceApi.createCycle(cycleData);
      
      toast.success(`Cycle "${formData.name}" created successfully!`);
      
      await loadPerformanceData();
      
      setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
      setFormErrors({});
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create cycle:', error);
      toast.error(pickApiError(error) || 'Failed to create cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      startDate: toDateInputValue(cycle.startDate),
      endDate: toDateInputValue(cycle.endDate),
      description: cycle.description || "",
      status: cycle.status
    });
    setShowEditModal(true);
  };

  const handleUpdateCycle = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setSubmitting(true);
      
      const cycleData = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        status: formData.status
      };

      await performanceApi.updateCycle(editingCycle._id, cycleData);
      
      toast.success(`Cycle "${formData.name}" updated successfully!`);
      
      await loadPerformanceData();
      
      setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
      setFormErrors({});
      setShowEditModal(false);
      setEditingCycle(null);
    } catch (error) {
      console.error('Failed to update cycle:', error);
      toast.error(pickApiError(error) || 'Failed to update cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCycle = (cycleId, cycleName) => {
    confirm({
      title: "Delete Cycle?",
      message: `Are you sure you want to delete "${cycleName}"?\n\nThis action cannot be undone.`,
      action: async () => {
        try {
          await performanceApi.deleteCycle(cycleId);
          toast.success(`Cycle "${cycleName}" deleted successfully!`);
          await loadPerformanceData();
        } catch (error) {
          console.error('Failed to delete cycle:', error);
          toast.error(pickApiError(error) || 'Failed to delete cycle');
          throw error;
        }
      }
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingCycle(null);
    setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
    setFormErrors({});
  };

  const handleViewCycle = (cycle) => {
    navigate(`/role/hr_manager/appraisal/view/${cycle._id}`, { state: { cycle } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg text-gray-900 dark:text-white">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Management</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Track appraisal cycles, reviews, and employee performance metrics
            </p>
          </div>
          
          {canPmsCycleStruct && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Cycle
          </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Calendar className="w-16 h-16 text-blue-600" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Cycles</p>
                <p className="text-3xl font-bold text-foreground mt-1">{performanceData.totalCycles}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <TrendingUp className="w-16 h-16 text-green-600" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="p-2.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg w-fit">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Active Cycles</p>
                <p className="text-3xl font-bold text-foreground mt-1">{performanceData.activeCycles}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <FileText className="w-16 h-16 text-purple-600" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg w-fit">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Reviews</p>
                <p className="text-3xl font-bold text-foreground mt-1">{performanceData.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Award className="w-16 h-16 text-amber-600" />
            </div>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg w-fit">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg Score</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {performanceData.avgScore > 0 ? performanceData.avgScore.toFixed(1) : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-border/50 pb-px">
          {["cycles", "analytics", "employees"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all relative ${
                activeTab === tab
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab === "cycles" ? "Appraisal Cycles" : tab === "analytics" ? "Analytics & Insights" : "Employee Overview"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_-2px_10px_rgba(37,99,235,0.4)]" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "cycles" ? (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-5 border-b border-border/50 bg-muted/20 backdrop-blur-md">
              <h2 className="text-lg font-bold text-foreground">Appraisal Cycles</h2>
              <p className="text-muted-foreground text-sm mt-1">Manage performance review periods</p>
            </div>
            <div className="overflow-auto custom-scrollbar flex-1 relative">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cycle Name</th>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</th>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Reviews</th>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Avg Score</th>
                    <th className="px-6 py-4 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.cycles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground bg-background">
                        No performance cycles found. Create your first cycle to get started.
                      </td>
                    </tr>
                  ) : (
                    performanceData.cycles.map((cycle) => (
                      <tr key={cycle._id} className="group hover:bg-blue-600/5 dark:hover:bg-blue-500/10 transition-colors bg-background">
                        <td className="px-6 py-4 border-b border-border/50 align-middle">
                          <span className="font-semibold text-sm text-foreground">{cycle.name}</span>
                        </td>
                        <td className="px-6 py-4 border-b border-border/50 text-sm text-muted-foreground align-middle">
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 border-b border-border/50 align-middle">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase ${
                            cycle.status === 'active' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 border border-green-200 dark:border-green-500/30' 
                              : cycle.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                              : 'bg-muted text-muted-foreground border border-border/50'
                          }`}>
                            {cycle.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 border-b border-border/50 text-sm text-muted-foreground text-center align-middle">{cycle.totalReviews}</td>
                        <td className="px-6 py-4 border-b border-border/50 text-sm text-foreground font-medium text-center align-middle">{cycle.avgScore ? `${cycle.avgScore}/5` : '—'}</td>
                        <td className="px-6 py-4 border-b border-border/50 text-right align-middle whitespace-nowrap">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                              onClick={() => handleViewCycle(cycle)}
                            >
                              View
                            </button>
                            {canPmsWrite && (
                            <button 
                              className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 text-sm font-medium transition-colors"
                              onClick={() => handleEditClick(cycle)}
                            >
                              Edit
                            </button>
                            )}
                            {canPmsCycleStruct && (
                            <button 
                              className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium transition-colors"
                              onClick={() => handleDeleteCycle(cycle._id, cycle.name)}
                            >
                              Delete
                            </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "analytics" ? (
          <PerformanceAnalytics />
        ) : (
          <EmployeeOverview />
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Performance Cycle</h2>
                <button 
                  onClick={handleCloseModal} 
                  disabled={submitting}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cycle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Q1 2026 Review" 
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-white dark:bg-gray-800 border ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={submitting}
                  />
                  {formErrors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="startDate"
                      type="date" 
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full bg-white dark:bg-gray-800 border ${formErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={submitting}
                    />
                    {formErrors.startDate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="endDate"
                      type="date" 
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full bg-white dark:bg-gray-800 border ${formErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={submitting}
                    />
                    {formErrors.endDate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.endDate}</p>}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    placeholder="Optional cycle description" 
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-800">
                <button 
                  onClick={handleCloseModal} 
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateCycle} 
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Cycle'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-2xl shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Performance Cycle</h2>
                <button 
                  onClick={handleCloseModal} 
                  disabled={submitting}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cycle Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    placeholder="e.g., Q1 2026 Review" 
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-white dark:bg-gray-800 border ${formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    disabled={submitting}
                  />
                  {formErrors.name && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.name}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="startDate"
                      type="date" 
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`w-full bg-white dark:bg-gray-800 border ${formErrors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={submitting}
                    />
                    {formErrors.startDate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="endDate"
                      type="date" 
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`w-full bg-white dark:bg-gray-800 border ${formErrors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled={submitting}
                    />
                    {formErrors.endDate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.endDate}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={submitting}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                  <textarea
                    name="description"
                    placeholder="Optional cycle description" 
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-800">
                <button 
                  onClick={handleCloseModal} 
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateCycle} 
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Cycle'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPerformance;
