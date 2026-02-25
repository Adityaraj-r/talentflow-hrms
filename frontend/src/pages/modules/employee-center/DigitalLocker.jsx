import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Folder, FileText, Upload, Search, Grid, List, 
  Trash2, Eye, Download, CheckCircle, Clock, XCircle, User, ArrowLeft, Calendar, Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const DigitalLocker = () => {
  const { user } = useAuth();
  
  // States
  const [documents, setDocuments] = useState([]);
  const [onboardingList, setOnboardingList] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [targetEmployeeId, setTargetEmployeeId] = useState(""); 
  const [uploadOpen, setUploadOpen] = useState(false);
  
  // Upload Form State
  const [file, setFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState("Personal");

  const categories = [
    { name: "All", label: "All Files" },
    { name: "Personal", label: "Personal IDs" },
    { name: "Education", label: "Education" },
    { name: "Employment", label: "Contracts" },
    { name: "Payroll", label: "Payroll" },
    { name: "Onboarding", label: "Onboarding" } 
  ];

  const isAdmin = user?.role === "ADMIN" || user?.role === "HR_MANAGER" || user?.role === "Super Admin";

  
  const getActiveId = useCallback(() => {
    if (selectedCategory === "Onboarding" && targetEmployeeId) {
        return targetEmployeeId;
    }
    
    if (isAdmin && targetEmployeeId && selectedCategory !== "Onboarding") {
        return targetEmployeeId;
    }

    return user?.employeeId || user?._id || user?.id || user?.userId;
  }, [selectedCategory, targetEmployeeId, isAdmin, user]);


  const fetchOnboardingList = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('userToken'); 
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await axios.get("http://localhost:5001/api/onboarding/list/all", config);
      setOnboardingList(res.data);
    } catch (error) {
      console.error("Error fetching onboarding list", error);
    }
  };

  const fetchDocuments = useCallback(async () => {
    try {
      if (selectedCategory === "Onboarding" && !targetEmployeeId) return;

      const idToFetch = getActiveId();
      if (!idToFetch) return;

      const res = await axios.get(`http://localhost:5001/api/documents/${idToFetch}`);
      setDocuments(res.data);
    } catch (error) {
      console.error("Fetch error", error);
    }
  }, [getActiveId, selectedCategory, targetEmployeeId]);

  useEffect(() => {
    if (selectedCategory === "Onboarding" && isAdmin) {
      fetchOnboardingList();
    } 

    fetchDocuments();
  }, [selectedCategory, targetEmployeeId, fetchDocuments, isAdmin]);

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");
    
    const activeId = getActiveId(); 

    if (!activeId) return toast.error("Could not determine user ID for upload");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", uploadCategory);
    formData.append("employeeId", activeId);
    formData.append("uploadedBy", user.email);

    try {
      await axios.post("http://localhost:5001/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setUploadOpen(false);
      setFile(null); 
      
      fetchDocuments();
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/documents/${id}`);
      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:5001/api/documents/${id}/status`, { status: newStatus });
      toast.success(`Document marked as ${newStatus}`);
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  // Document Filtering
  const filteredDocs = documents.filter(doc => {
    const categoryMatch = selectedCategory === "Onboarding" ? true : (selectedCategory === "All" || doc.category === selectedCategory);
    const searchMatch = doc.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Employee List Filtering
  const filteredEmployees = onboardingList.filter(emp => 
    (emp.firstName + " " + emp.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.employeeCode && emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 px-4 mb-4 shrink-0 sm:px-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Digital Locker
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Securely store, manage, and verify your official documents.
        </p>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-gray-50 dark:bg-gray-900/50 lg:bg-transparent lg:gap-6">
        
        {/* SIDEBAR */}
       <div className="flex-shrink-0 w-full bg-white dark:bg-gray-900 p-2 border-b flex gap-2 overflow-x-auto no-scrollbar lg:w-64 lg:bg-white lg:dark:bg-gray-900 lg:border lg:rounded-xl lg:shadow-sm lg:block lg:space-y-2 lg:overflow-y-auto lg:p-4 h-full">
          {categories.map((cat) => {
            let count = 0;
            
            if (cat.name === "Onboarding") {
              count = onboardingList.length;
            } else {
              count = cat.name === "All" 
                ? documents.length 
                : documents.filter(d => d.category === cat.name).length;
            }

            return (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  if(cat.name !== "Onboarding") setTargetEmployeeId(""); 
                  if(cat.name === "Onboarding") {
                      setTargetEmployeeId(""); 
                      setSearchQuery(""); 
                  }
                }}
                className={`flex-shrink-0 flex items-center justify-between rounded-lg text-sm font-medium transition-colors px-3 py-1.5 border lg:w-full lg:px-4 lg:py-3 lg:border-none ${
                  selectedCategory === cat.name
                    ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className={`w-4 h-4 lg:w-5 lg:h-5 ${selectedCategory === cat.name ? "fill-blue-600 text-blue-600" : "text-gray-400"}`} />
                  <span className="whitespace-nowrap">{cat.label}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full min-w-[1.5rem] text-center ${
                  selectedCategory === cat.name 
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200" 
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 lg:rounded-xl lg:border shadow-sm overflow-hidden">
          
          {/* TOOLBAR */}
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {/* Back Button */}
              {selectedCategory === "Onboarding" && targetEmployeeId && (
                <Button variant="ghost" size="icon" onClick={() => {
                    setTargetEmployeeId("");
                    setSearchQuery(""); 
                }} className="mr-1 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              
              <h2 className="text-lg font-semibold truncate">
                {selectedCategory === "Onboarding" && targetEmployeeId 
                  ? `Documents for ${targetEmployeeId}` 
                  : categories.find(c => c.name === selectedCategory)?.label}
              </h2>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder={selectedCategory === "Onboarding" && !targetEmployeeId ? "Search Employee..." : "Search files..."} 
                  className="pl-9 w-full sm:w-64" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {(!isAdmin || selectedCategory !== "Onboarding" || targetEmployeeId) && (
                <>
                 <div className="flex items-center border dark:border-gray-700 rounded-md p-1 shrink-0 bg-white dark:bg-gray-800">
                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setViewMode('grid')}><Grid className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className={`h-7 w-7 ${viewMode === 'list' ? 'bg-gray-200 dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`} onClick={() => setViewMode('list')}><List className="w-4 h-4" /></Button>
                  </div>
                  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 shrink-0"><Upload className="w-4 h-4 mr-2 hidden sm:block" /> Upload</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Category</label>
                          <Select value={uploadCategory} onValueChange={setUploadCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c.name !== 'All').map(c => <SelectItem key={c.name} value={c.name}>{c.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2"><label className="text-sm font-medium">File</label><Input type="file" onChange={(e) => setFile(e.target.files[0])} /></div>
                        <Button onClick={handleUpload} className="w-full">Upload Now</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
            
            {/*  ONBOARDING LIST */}
            {selectedCategory === "Onboarding" && !targetEmployeeId && isAdmin ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Employee</th>
                        <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Department</th>
                        <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Date</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <tr key={emp._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3">
                              <div className="font-medium whitespace-nowrap">{emp.firstName} {emp.lastName}</div>
                              <div className="text-xs text-gray-500">{emp.employeeCode || "N/A"}</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <div className="flex items-center gap-2 whitespace-nowrap">
                                <Building className="w-3 h-3 text-gray-400" />
                                {emp.department || "General"}
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell whitespace-nowrap">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {new Date(emp.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                emp.onboardingStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {emp.onboardingStatus || 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                  setTargetEmployeeId(emp.employeeCode || emp._id);
                                  setSearchQuery(""); 
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="w-4 h-4 mr-2" /> View Docs
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No employees found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              //  DOCUMENT GRID
              filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Folder className="w-16 h-16 mb-4 opacity-20" />
                  <p>No documents found in this folder</p>
                  {/* Debug Info for Admin */}
                  {isAdmin && targetEmployeeId && (
                     <p className="text-xs text-red-300 mt-2">Debug: Searching for ID: {targetEmployeeId}</p>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocs.map((doc) => (
                    <div key={doc._id} className="group relative bg-white dark:bg-gray-800 p-4 rounded-xl border hover:shadow-md transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><FileText className="w-6 h-6 text-blue-500" /></div>
                        <BadgeStatus status={doc.status} />
                      </div>
                      <h3 className="font-medium truncate text-sm" title={doc.originalName}>{doc.originalName}</h3>
                      <div className="text-xs text-gray-500 mt-1 flex justify-between"><span>{doc.fileSize}</span><span>{new Date(doc.uploadDate).toLocaleDateString()}</span></div>
                      
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => window.open(`http://localhost:5001${doc.filePath}`, '_blank')}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 bg-red-50 hover:bg-red-100" onClick={() => handleDelete(doc._id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-900 border-b">
                       <tr>
                          <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Name</th>
                          <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Category</th>
                          <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap hidden sm:table-cell">Date</th>
                          <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredDocs.map((doc) => (
                        <tr key={doc._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-4 py-3 max-w-[140px] sm:max-w-[180px] lg:max-w-[250px]">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded shrink-0">
                                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="truncate font-medium text-slate-700 dark:text-slate-200 block w-full">
                                        {doc.originalName}
                                    </span>
                                </div>
                            </td>
                             
                             {/*  Category Column */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md text-xs font-medium border dark:border-gray-700 whitespace-nowrap">
                                {doc.category === "Personal" ? "Personal IDs" : (doc.category || "Uncategorized")}
                              </span>
                            </td>
                      
                              {/*  Date Column */}
                            <td className="px-4 py-3 hidden sm:table-cell text-gray-500 whitespace-nowrap">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </td>
                            
                             {/*  Status Column */}
                            <td className="px-4 py-3">
                              {isAdmin ? (
                                <select 
                                  className={`text-xs px-2 py-1 rounded-md border font-medium outline-none cursor-pointer appearance-none ${
                                    doc.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800' :
                                    doc.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800' :
                                    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800'
                                  }`}
                                  value={doc.status}
                                  onChange={(e) => handleStatusChange(doc._id, e.target.value)}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Verified">Verified</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              ) : (
                                <BadgeStatus status={doc.status} />
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => window.open(`http://localhost:5001${doc.filePath}`, '_blank')}><Download className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600" onClick={() => handleDelete(doc._id)}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const BadgeStatus = ({ status }) => {
  const styles = { Verified: "bg-green-100 text-green-700", Pending: "bg-yellow-100 text-yellow-700", Rejected: "bg-red-100 text-red-700" };
  const icons = { Verified: <CheckCircle className="w-3 h-3 mr-1" />, Pending: <Clock className="w-3 h-3 mr-1" />, Rejected: <XCircle className="w-3 h-3 mr-1" /> };
 return <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-medium border ${styles[status]}`}>{icons[status]}{status}</span>;
};

export default DigitalLocker;