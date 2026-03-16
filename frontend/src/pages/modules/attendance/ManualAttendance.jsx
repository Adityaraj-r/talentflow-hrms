import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import {
  UploadCloud,
  FileSpreadsheet,
  UserCheck,
  Calendar,
  AlertCircle,
  Download,
  X,
  ChevronDown
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import attendanceService from "@/services/attendanceService";
import apiClient from "@/services/apiClient";

const inputThemeClasses = "bg-white dark:bg-[#131b2c] border-slate-200 dark:border-[#222f43] text-slate-900 dark:text-slate-100 focus:ring-primary placeholder:text-slate-400 dark:placeholder:text-slate-500";
const cardThemeClasses = "bg-white dark:bg-transparent border-slate-200 dark:border-none shadow-sm dark:shadow-none";

// --- CUSTOM SEARCHABLE DROPDOWN ---
const SearchableDropdown = ({ value, onChange, options, placeholder, icon: Icon, hideScrollbar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt =>
    String(opt).toLowerCase().includes(String(search).toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {Icon && <Icon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />}
      <div className="relative flex items-center">
        <input
          type="text"
          className={`flex h-10 w-full items-center justify-between rounded-md border py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${inputThemeClasses} ${Icon ? 'pl-9 pr-8' : 'px-3 pr-8'}`}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onClick={() => setIsOpen(true)}
        />
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none opacity-50" />
      </div>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-50 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto border bg-white dark:bg-[#131b2c] dark:border-[#222f43] ${hideScrollbar ? '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]' : ''
            }`}
        >
          <ul className="py-1">
            {filtered.length > 0 ? (
              filtered.map((opt, i) => (
                <li
                  key={i}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1d283e] text-slate-900 dark:text-slate-200 transition-colors"
                  onClick={() => {
                    setSearch(opt);
                    onChange(opt);
                    setIsOpen(false);
                  }}
                >
                  {opt}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-muted-foreground">No matches found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

const TimeInput = ({ value, onChange, name }) => {
  const initH = () => {
    if (!value) return "";
    let hInt = parseInt(value.split(":")[0], 10);
    return (hInt % 12 || 12).toString().padStart(2, "0");
  };
  const initM = () => value ? value.split(":")[1] : "";
  const initAmpm = () => {
    if (!value) return "";
    return parseInt(value.split(":")[0], 10) >= 12 ? "PM" : "AM";
  };

  const [h, setH] = useState(initH);
  const [m, setM] = useState(initM);
  const [ampm, setAmpm] = useState(initAmpm);

  const notifyParent = (newH, newM, newAmpm) => {
    if (newH && newM && newAmpm) {
      let hInt = parseInt(newH, 10);
      if (newAmpm === "PM" && hInt < 12) hInt += 12;
      if (newAmpm === "AM" && hInt === 12) hInt = 0;
      const val24 = `${hInt.toString().padStart(2, "0")}:${newM.padStart(2, "0")}`;
      onChange({ target: { name, value: val24 } });
    } else {
      onChange({ target: { name, value: "" } });
    }
  };

  const hoursOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"));
  const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

  return (
    <div className="flex items-center gap-2 w-full">
      <SearchableDropdown value={h} onChange={(val) => { setH(val); notifyParent(val, m, ampm); }} options={hoursOptions} placeholder="HH" hideScrollbar={true} />
      <span className="font-bold text-muted-foreground">:</span>
      <SearchableDropdown value={m} onChange={(val) => { setM(val); notifyParent(h, val, ampm); }} options={minutesOptions} placeholder="MM" hideScrollbar={true} />
      <SearchableDropdown value={ampm} onChange={(val) => { setAmpm(val); notifyParent(h, m, val); }} options={["AM", "PM"]} placeholder="AM/PM" hideScrollbar={true} />
    </div>
  );
};

const getStatusBadgeClasses = (status) => {
  const baseClasses = "border";
  switch (status) {
    case "Present": return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200`;
    case "Absent": return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200`;
    default: return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200`;
  }
};

const ManualAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formKey, setFormKey] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiClient.get('/users');
        const data = res.data?.data || res.data;
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error("Could not load employee list.");
      }
    };
    fetchEmployees();
  }, []);

  const [singleEntry, setSingleEntry] = useState({
    employeeEmail: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    breakMinutes: "0",
    status: "",
    notes: ""
  });

  const [bulkFile, setBulkFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    setSingleEntry(prev => ({ ...prev, [name]: value }));
  };

  const submitSingleEntry = async (e) => {
    e.preventDefault();
    if (!singleEntry.employeeEmail || !singleEntry.date || !singleEntry.status) {
      toast.error("Please fill in all required fields (Employee, Date, Status).");
      return;
    }

    try {
      setLoading(true);
      await attendanceService.markManualAttendance(singleEntry);
      toast.success("Attendance record successfully added!");
      setSingleEntry({
        employeeEmail: "", date: new Date().toISOString().split("T")[0], checkIn: "", checkOut: "", breakMinutes: "0", status: "", notes: ""
      });
      setFormKey(prev => prev + 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit attendance.");
    } finally {
      setLoading(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error("Invalid file format. Please upload a .csv file.");
      return;
    }
    setBulkFile(file);
    toast.success(`${file.name} attached successfully.`);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const formattedPreview = results.data.map((row, index) => ({
            id: index,
            email: row["Employee Email"] || "-",
            date: row["Date"] || "-",
            checkIn: row["Check In"] || "-",
            checkOut: row["Check Out"] || "-",
            status: row["Status"] || "Unknown",
          }));
          setPreviewData(formattedPreview);
        } else {
          setPreviewData([]);
          toast.warning("The uploaded CSV file seems to be empty.");
        }
      },
      error: (error) => {
        console.error("CSV Parse Error:", error);
        toast.error("Could not read the CSV file data.");
      }
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    processFile(e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0]);
  };

  const clearFile = () => {
    setBulkFile(null);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitBulkEntry = async () => {
    if (!bulkFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", bulkFile);
      await attendanceService.markBulkAttendance(formData);
      toast.success("Bulk attendance successfully processed!");
      clearFile();
    } catch (error) {
      toast.error("Failed to process bulk upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "Employee Email,Date,Check In,Check Out,Status,Break Minutes,Notes\n";
    const sampleRow1 = "employee@example.com,2026-03-10,09:00,17:00,Present,0,Regular shift\n";
    const sampleRow2 = "absent.user@example.com,2026-03-10,,,,Absent,0,Sick leave\n";
    const blob = new Blob([headers + sampleRow1 + sampleRow2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Attendance_Bulk_Upload_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full dark:text-slate-200">

      <Tabs defaultValue="single" className="w-full">
        <div className="flex items-center space-x-2 mb-6 bg-slate-100 dark:bg-[#131b2c] p-1 rounded-lg w-max border dark:border-[#222f43]">
          <TabsList className="bg-transparent border-none p-0 h-auto">
            <TabsTrigger
              value="single"
              className="px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e293b] data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-sm"
            >
              Single Entry
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#1e293b] data-[state=active]:text-primary dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-sm"
            >
              Bulk Upload
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="single">
          <Card className={cardThemeClasses}>
            <form key={formKey} onSubmit={submitSingleEntry}>
              <CardHeader className="px-0 pb-6">
                <CardTitle className="text-xl font-semibold dark:text-white">Record Single Log</CardTitle>
                <CardDescription className="dark:text-slate-400">Manually correct or insert an attendance record for a specific employee.</CardDescription>
              </CardHeader>

              <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                <div className="space-y-2">
                  <Label htmlFor="employeeEmail" className="text-sm font-semibold">
                    Select Employee Email <span className="text-red-500">*</span>
                  </Label>
                  <SearchableDropdown
                    placeholder="Enter employee email"
                    options={employees.map((emp) => emp.email)}
                    value={singleEntry.employeeEmail}
                    onChange={(val) => setSingleEntry(prev => ({ ...prev, employeeEmail: val }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold">
                    Log Date <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      className={`w-full ${inputThemeClasses} [color-scheme:light] dark:[color-scheme:dark]`}
                      value={singleEntry.date}
                      onChange={handleSingleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkIn" className="text-sm font-semibold">Check In Time</Label>
                  <TimeInput name="checkIn" value={singleEntry.checkIn} onChange={handleSingleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkOut" className="text-sm font-semibold">Check Out Time</Label>
                  <TimeInput name="checkOut" value={singleEntry.checkOut} onChange={handleSingleChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Attendance Status <span className="text-red-500">*</span>
                  </Label>
                  <SearchableDropdown
                    placeholder="Select status..."
                    options={["Present", "Late", "Half Day", "Absent"]}
                    value={singleEntry.status}
                    onChange={(val) => setSingleEntry(prev => ({ ...prev, status: val }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakMinutes" className="text-sm font-semibold">Break Deduction (Minutes)</Label>
                  <Input
                    id="breakMinutes"
                    name="breakMinutes"
                    type="number"
                    min="0"
                    placeholder="e.g. 60"
                    className={`w-full ${inputThemeClasses}`}
                    value={singleEntry.breakMinutes}
                    onChange={handleSingleChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-sm font-semibold">Reason / Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Enter attendance comments or reason..."
                    rows={4}
                    className={`flex w-full rounded-md border py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 resize-none ${inputThemeClasses}`}
                    value={singleEntry.notes}
                    onChange={handleSingleChange}
                  />
                </div>

              </CardContent>

              <CardFooter className="px-0 pt-6 mt-4 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  onClick={() => {
                    setSingleEntry({ employeeEmail: "", date: new Date().toISOString().split("T")[0], checkIn: "", checkOut: "", breakMinutes: "0", status: "", notes: "" });
                    setFormKey(prev => prev + 1);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-primary text-primary-foreground dark:bg-white dark:text-black dark:hover:bg-slate-200"
                >
                  {loading ? "Saving..." : "Save Attendance Record"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card className={cardThemeClasses}>
            <CardHeader className="px-0 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold dark:text-white">Bulk Attendance Upload</CardTitle>
                  <CardDescription className="dark:text-slate-400">Upload a standard CSV file from a biometric machine or spreadsheet.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2 dark:border-[#222f43] dark:bg-[#131b2c] dark:hover:bg-[#1d283e]" onClick={handleDownloadTemplate} type="button">
                  <Download className="w-4 h-4" /> Download Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pt-6 space-y-6">

              {!bulkFile ? (
                <div
                  className="border-2 border-dashed border-slate-300 dark:border-[#222f43] rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-[#131b2c] transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="bg-primary/10 dark:bg-slate-800 p-4 rounded-full mb-4">
                    <UploadCloud className="w-8 h-8 text-primary dark:text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1 dark:text-white">Click or drag file to this area to upload</h3>
                  <p className="text-sm text-muted-foreground mb-4">Support for a single or bulk CSV upload.</p>
                  <Button variant="secondary" type="button" className="dark:bg-[#1e293b] dark:text-white dark:hover:bg-slate-700">Select CSV File</Button>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileDrop} />
                </div>
              ) : (
                <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/50 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-3 rounded-lg">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{bulkFile.name}</h4>
                      <p className="text-sm text-slate-500">{(bulkFile.size / 1024).toFixed(2)} KB • Ready to process</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile} className="text-slate-500 hover:text-red-500">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <AlertCircle className="w-4 h-4 text-blue-500" /> Data Preview
                  </div>
                  <div className="border rounded-md overflow-hidden dark:border-slate-800 max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-[#131b2c]">
                        <TableRow className="dark:border-slate-800">
                          <TableHead>Email</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Check In</TableHead>
                          <TableHead>Check Out</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row) => (
                          <TableRow key={row.id} className="dark:border-slate-800">
                            <TableCell className="font-medium text-sm">{row.email}</TableCell>
                            <TableCell className="text-sm">{row.date}</TableCell>
                            <TableCell className="text-sm">{row.checkIn}</TableCell>
                            <TableCell className="text-sm">{row.checkOut}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusBadgeClasses(row.status)}>
                                {row.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

            </CardContent>
            <CardFooter className="px-0 pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={clearFile} disabled={!bulkFile || loading} type="button" className="dark:border-slate-700 dark:text-slate-300">Cancel</Button>
              <Button onClick={submitBulkEntry} disabled={!bulkFile || loading} type="button" className="dark:bg-white dark:text-black dark:hover:bg-slate-200">
                {loading ? "Processing..." : "Process Bulk Upload"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ManualAttendance;