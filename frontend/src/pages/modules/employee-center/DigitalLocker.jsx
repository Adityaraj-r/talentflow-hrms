import { useState } from "react";
import { 
  Folder, 
  FileText, 
  Upload, 
  Search, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  ShieldCheck, 
  Clock ,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";


const CATEGORIES = [
  { id: "personal", name: "Personal ID Proofs", icon: <ShieldCheck className="w-4 h-4" /> },
  { id: "education", name: "Educational Records", icon: <Folder className="w-4 h-4" /> },
  { id: "employment", name: "Employment Contracts", icon: <Briefcase className="w-4 h-4" /> },
  { id: "payroll", name: "Payroll & Tax", icon: <FileText className="w-4 h-4" /> },
  { id: "policies", name: "Company Policies", icon: <ShieldCheck className="w-4 h-4" /> },
];


const INITIAL_FILES = [
  { id: 1, name: "Aadhaar Card.pdf", category: "personal", size: "2.4 MB", date: "2024-01-15", status: "Verified" },
  { id: 2, name: "PAN Card.jpg", category: "personal", size: "1.1 MB", date: "2024-01-15", status: "Verified" },
  { id: 3, name: "Offer Letter.pdf", category: "employment", size: "4.5 MB", date: "2023-12-01", status: "Verified" },
  { id: 4, name: "B.Tech Degree.pdf", category: "education", size: "3.2 MB", date: "2023-11-20", status: "Pending" },
];

const DigitalLocker = () => {
  const [activeCategory, setActiveCategory] = useState("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState(INITIAL_FILES);

  
  const filteredFiles = files.filter(file => 
    file.category === activeCategory && 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = () => {
    const newFile = {
      id: Date.now(),
      name: `New_Upload_${Math.floor(Math.random() * 1000)}.pdf`,
      category: activeCategory,
      size: "1.5 MB",
      date: new Date().toISOString().split('T')[0],
      status: "Pending"
    };
    setFiles([newFile, ...files]);
    toast.success("Document uploaded successfully!");
  };

  const handleDelete = (id) => {
    setFiles(files.filter(f => f.id !== id));
    toast.error("Document deleted.");
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Locker</h1>
          <p className="text-muted-foreground">Securely store and manage your official documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              className="pl-8 bg-white dark:bg-gray-800" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleUpload} className="bg-primary hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Categories */}
        <div className="md:col-span-3 space-y-2">
          <Card className="h-full border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    activeCategory === cat.id 
                      ? "bg-white dark:bg-gray-800 text-primary shadow-sm ring-1 ring-gray-200 dark:ring-gray-700" 
                      : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat.icon}
                  {cat.name}
                  {/* Count Badge */}
                  <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                    {files.filter(f => f.category === cat.id).length}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Content: File Grid */}
        <div className="md:col-span-9">
          <Card className="min-h-125 border-none shadow-sm bg-gray-50/50 dark:bg-gray-900/50">
            <CardHeader className="border-b bg-white dark:bg-gray-800 rounded-t-lg px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  {CATEGORIES.find(c => c.id === activeCategory)?.name}
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {filteredFiles.length} documents found
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      className="group relative bg-white dark:bg-gray-800 p-4 rounded-xl border hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <FileText className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex gap-1">
                          {/* Verified Status Badge */}
                          {file.status === "Verified" ? (
                             <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-6">Verified</Badge>
                          ) : (
                             <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] h-6">Pending</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                          {file.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.date}</span>
                        </div>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-50 hover:text-green-600">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                    <Folder className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No documents yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
                    This folder is empty. Upload your {CATEGORIES.find(c => c.id === activeCategory)?.name} here.
                  </p>
                  <Button variant="outline" onClick={handleUpload} className="mt-4">
                    <Upload className="w-4 h-4 mr-2" /> Upload Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};



export default DigitalLocker;