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

const AdminPerformance = () => {
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
      setPerformanceData({
        totalCycles: statsResponse.totalCycles,
        activeCycles: statsResponse.activeCycles,
        totalReviews: statsResponse.totalReviews,
        avgScore: statsResponse.avgScore,
        cycles: cyclesResponse
      });
    } catch (error) {
      console.error('Failed to load performance data:', error);
      toast.error('Failed to load performance data');
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
      toast.error(error.response?.data?.error || 'Failed to create cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      startDate: cycle.startDate.split('T')[0],
      endDate: cycle.endDate.split('T')[0],
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
      toast.error(error.response?.data?.error || 'Failed to update cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCycle = async (cycleId, cycleName) => {
    if (window.confirm(`Are you sure you want to delete "${cycleName}"?\n\nThis action cannot be undone.`)) {
      try {
        await performanceApi.deleteCycle(cycleId);
        
        toast.success(`Cycle "${cycleName}" deleted successfully!`);
        
        await loadPerformanceData();
      } catch (error) {
        console.error('Failed to delete cycle:', error);
        toast.error(error.response?.data?.error || 'Failed to delete cycle');
      }
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingCycle(null);
    setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
    setFormErrors({});
  };

  const handleViewCycle = (cycle) => {
    navigate(`/role/admin/appraisal/view/${cycle._id}`, { state: { cycle } });
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
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Management (PMS)</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Track appraisal cycles, reviews, and employee performance metrics
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            New Cycle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 backdrop-blur-sm rounded-xl p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Cycles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{performanceData.totalCycles}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>


          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 backdrop-blur-sm rounded-xl p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Active Cycles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{performanceData.activeCycles}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>


          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 backdrop-blur-sm rounded-xl p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{performanceData.totalReviews}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>


          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 backdrop-blur-sm rounded-xl p-6 transition-all duration-200 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Avg Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {performanceData.avgScore > 0 ? performanceData.avgScore.toFixed(1) : "—"}
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>


        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab("cycles")}
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
              activeTab === "cycles"
                ? "text-gray-900 dark:text-white border-gray-900 dark:border-white"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Appraisal Cycles
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
              activeTab === "analytics"
                ? "text-gray-900 dark:text-white border-gray-900 dark:border-white"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Analytics & Insights
          </button>
          <button
            onClick={() => setActiveTab("employees")}
            className={`pb-3 px-2 font-medium transition-colors border-b-2 ${
              activeTab === "employees"
                ? "text-gray-900 dark:text-white border-gray-900 dark:border-white"
                : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Employee Overview
          </button>
        </div>


        {activeTab === "cycles" ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appraisal Cycles</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Manage performance review periods</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Cycle Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Period</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reviews</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Score</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {performanceData.cycles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No performance cycles found. Create your first cycle to get started.
                      </td>
                    </tr>
                  ) : (
                    performanceData.cycles.map((cycle) => (
                      <tr key={cycle._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cycle.name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            cycle.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30' 
                              : cycle.status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                              : 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30'
                          }`}>
                            {cycle.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{cycle.totalReviews}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{cycle.avgScore ? `${cycle.avgScore}/5` : '—'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                            onClick={() => handleViewCycle(cycle)}
                          >
                            View
                          </button>
                          <button 
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium transition-colors"
                            onClick={() => handleEditClick(cycle)}
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium transition-colors"
                            onClick={() => handleDeleteCycle(cycle._id, cycle.name)}
                          >
                            Delete
                          </button>
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
