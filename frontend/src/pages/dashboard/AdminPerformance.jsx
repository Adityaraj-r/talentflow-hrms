import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { TrendingUp, Plus, Calendar, Users, FileText, X } from "lucide-react";
import { toast } from "sonner";
import PerformanceAnalytics from "./PerformanceAnalytics";

// Mock data defined outside component to prevent re-initialization
const mockCycles = [
  { id: 1, name: "Q4 2025 Review", startDate: "2025-10-01", endDate: "2025-12-31", status: "active", totalReviews: 25, avgScore: 4.5, description: "Quarterly performance review for Q4 2025" },
  { id: 2, name: "Annual 2025", startDate: "2025-01-01", endDate: "2025-12-31", status: "completed", totalReviews: 20, avgScore: 3.8, description: "Annual performance review for 2025" }
];

const AdminPerformance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cycles");
  const [performanceData, setPerformanceData] = useState({ 
    totalCycles: 2, 
    activeCycles: 1, 
    totalReviews: 45, 
    avgScore: 4.2, 
    cycles: mockCycles  // Initialize directly with mock data
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

  const handleCreateCycle = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const newCycle = {
      id: Date.now(), // Use timestamp for unique ID
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      description: formData.description,
      status: "active",
      totalReviews: 0,
      avgScore: null
    };

    const updatedCycles = [...performanceData.cycles, newCycle];
    
    setPerformanceData(prev => ({
      ...prev,
      cycles: updatedCycles,
      totalCycles: updatedCycles.length,
      activeCycles: updatedCycles.filter(c => c.status === 'active').length
    }));

    setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
    setFormErrors({});
    setShowCreateModal(false);
    
    toast.success(`Cycle "${newCycle.name}" created successfully!`);
  };

  const handleEditClick = (cycle) => {
    setEditingCycle(cycle);
    setFormData({
      name: cycle.name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      description: cycle.description || "",
      status: cycle.status
    });
    setShowEditModal(true);
  };

  const handleUpdateCycle = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const updatedCycles = performanceData.cycles.map(cycle => 
      cycle.id === editingCycle.id 
        ? {
            ...cycle,
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
            description: formData.description,
            status: formData.status
          }
        : cycle
    );

    const activeCount = updatedCycles.filter(c => c.status === 'active').length;
    
    setPerformanceData(prev => ({
      ...prev,
      cycles: updatedCycles,
      activeCycles: activeCount
    }));

    setFormData({ name: "", startDate: "", endDate: "", description: "", status: "active" });
    setFormErrors({});
    setShowEditModal(false);
    setEditingCycle(null);
    
    toast.success(`Cycle "${formData.name}" updated successfully!`);
  };

  const handleDeleteCycle = (cycleId, cycleName) => {
    if (window.confirm(`Are you sure you want to delete "${cycleName}"?\n\nThis action cannot be undone.`)) {
      const updatedCycles = performanceData.cycles.filter(cycle => cycle.id !== cycleId);
      const activeCount = updatedCycles.filter(c => c.status === 'active').length;
      
      setPerformanceData(prev => ({
        ...prev,
        cycles: updatedCycles,
        totalCycles: updatedCycles.length,
        activeCycles: activeCount
      }));
      
      toast.success(`Cycle "${cycleName}" deleted successfully!`);
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
    navigate(`/role/admin/appraisal/view/${cycle.id}`, { state: { cycle } });
  };

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
            <div className="text-3xl font-bold text-orange-500">{performanceData.avgScore ? `${performanceData.avgScore}/5` : '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
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
      </div>

      {/* Tab Content */}
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
                      <tr key={cycle.id} className="hover:bg-muted/50">
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
                            onClick={() => handleDeleteCycle(cycle.id, cycle.name)}
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
      ) : (
        <PerformanceAnalytics />
      )}

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Performance Cycle</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
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
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button onClick={handleCreateCycle} className="bg-gradient-to-r from-blue-500 to-purple-600">
                Create Cycle
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Cycle Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit Performance Cycle</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
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
                  />
                  {formErrors.endDate && <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={handleStatusChange}>
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
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 border-t">
              <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
              <Button onClick={handleUpdateCycle} className="bg-gradient-to-r from-blue-500 to-purple-600">
                Update Cycle
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPerformance;
