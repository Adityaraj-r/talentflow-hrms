import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { TrendingUp, Plus, Calendar, Users, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PerformanceAnalytics from "./PerformanceAnalytics";
import EmployeeOverview from "./EmployeeOverview";
import { performanceApi } from "../../services/performanceApi"; // ← FIXED: Changed from ../../../ to ../../

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
        totalCycles: statsResponse.data.totalCycles,
        activeCycles: statsResponse.data.activeCycles,
        totalReviews: statsResponse.data.totalReviews,
        avgScore: statsResponse.data.avgScore,
        cycles: cyclesResponse.data
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
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Performance Management (PMS)</h1>
            <p className="text-muted-foreground">Track appraisal cycles, reviews, and employee performance metrics</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="h-5 w-5 mr-2" /> New Cycle
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Cycles</span>
            </div>
            <div className="text-3xl font-bold text-blue-500">{performanceData.totalCycles}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Cycles</span>
            </div>
            <div className="text-3xl font-bold text-green-500">{performanceData.activeCycles}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Reviews</span>
            </div>
            <div className="text-3xl font-bold text-purple-500">{performanceData.totalReviews}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Avg Score</span>
            </div>
            <div className="text-3xl font-bold text-orange-500">
              {performanceData.avgScore > 0 ? `${performanceData.avgScore}/5` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("cycles")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "cycles"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Appraisal Cycles
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "analytics"
              ? "border-b-2 border-purple-500 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Analytics & Insights
        </button>
        <button
          onClick={() => setActiveTab("employees")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "employees"
              ? "border-b-2 border-green-500 text-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Employee Overview
        </button>
      </div>

      {activeTab === "cycles" ? (
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl">Appraisal Cycles</CardTitle>
            <p className="text-muted-foreground mt-1">Manage performance review periods</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Cycle Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Period</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Reviews</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Avg Score</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {performanceData.cycles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No performance cycles found. Create your first cycle to get started.
                      </td>
                    </tr>
                  ) : (
                    performanceData.cycles.map((cycle) => (
                      <tr key={cycle._id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 font-medium">{cycle.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cycle.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {cycle.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{cycle.totalReviews}</td>
                        <td className="px-6 py-4 text-muted-foreground">{cycle.avgScore ? `${cycle.avgScore}/5` : '—'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleViewCycle(cycle)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleEditClick(cycle)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCycle(cycle._id, cycle.name)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : activeTab === "analytics" ? (
        <PerformanceAnalytics />
      ) : (
        <EmployeeOverview />
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Performance Cycle</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} disabled={submitting}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Cycle Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  name="name"
                  placeholder="e.g., Q1 2026 Review" 
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-red-500" : ""}
                  disabled={submitting}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="startDate" 
                    name="startDate"
                    type="date" 
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={formErrors.startDate ? "border-red-500" : ""}
                    disabled={submitting}
                  />
                  {formErrors.startDate && <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>}
                </div>
                <div>
                  <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="endDate" 
                    name="endDate"
                    type="date" 
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={formErrors.endDate ? "border-red-500" : ""}
                    disabled={submitting}
                  />
                  {formErrors.endDate && <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Optional cycle description" 
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>Cancel</Button>
              <Button 
                onClick={handleCreateCycle} 
                className="bg-gradient-to-r from-blue-500 to-purple-600"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Cycle'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Performance Cycle</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal} disabled={submitting}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Cycle Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="edit-name" 
                  name="name"
                  placeholder="e.g., Q1 2026 Review" 
                  value={formData.name}
                  onChange={handleInputChange}
                  className={formErrors.name ? "border-red-500" : ""}
                  disabled={submitting}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-startDate" 
                    name="startDate"
                    type="date" 
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={formErrors.startDate ? "border-red-500" : ""}
                    disabled={submitting}
                  />
                  {formErrors.startDate && <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>}
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-endDate" 
                    name="endDate"
                    type="date" 
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={formErrors.endDate ? "border-red-500" : ""}
                    disabled={submitting}
                  />
                  {formErrors.endDate && <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea 
                  id="edit-description" 
                  name="description"
                  placeholder="Optional cycle description" 
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={submitting}
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal} disabled={submitting}>Cancel</Button>
              <Button 
                onClick={handleUpdateCycle} 
                className="bg-gradient-to-r from-blue-500 to-purple-600"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Cycle'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPerformance;
