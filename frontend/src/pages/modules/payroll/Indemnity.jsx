import { useState, useEffect } from "react";
import { Calculator, Check, X, Search, Loader2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import * as payrollService from "@/services/payrollService";
import apiClient from "@/services/apiClient";

const HR_ROLES = ["HRMANAGER", "HROFFICER", "PAYROLLOFFICER", "ADMIN", "SUPER ADMIN"];

const STATUS_COLORS = {
  Pending:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
  Paid:     "bg-blue-100 text-blue-700 border-blue-200",
};

const Indemnity = () => {
  const { user } = useAuth();
  const userRole = (typeof user?.role === "string" ? user.role : user?.role?.name)?.toUpperCase();
  const isHR = HR_ROLES.includes(userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indemnity Management</h1>
        <p className="text-muted-foreground">Calculate and manage end-of-service benefit (EOSB) payments.</p>
      </div>

      <Tabs defaultValue={isHR ? "calculator" : "history"}>
        <TabsList>
          {isHR && <TabsTrigger value="calculator">Calculator</TabsTrigger>}
          {isHR && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {isHR && (
          <TabsContent value="calculator">
            <IndemnityCalculator />
          </TabsContent>
        )}
        {isHR && (
          <TabsContent value="pending">
            <PendingIndemnities />
          </TabsContent>
        )}
        <TabsContent value="history">
          <IndemnityHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const IndemnityCalculator = () => {
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({
    employeeId: "", employeeName: "",
    joiningDate: "", lastWorkingDate: "",
    basicSalary: "", reason: "", notes: "",
  });

  useEffect(() => {
    apiClient.get("/admin/users").then(res => {
      setEmployees(res.users || res.data || []);
    }).catch(() => {});
  }, []);

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setResult(null); // reset result on any change
  };

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e._id === id);
    set("employeeId", id);
    setForm(p => ({
      ...p,
      employeeId: id,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "",
    }));
    setResult(null);
  };

  const handleCalculate = async () => {
    if (!form.basicSalary || !form.joiningDate || !form.lastWorkingDate) {
      toast.error("Basic salary, joining date and last working date are required");
      return;
    }
    setCalculating(true);
    try {
      const res = await payrollService.calculateIndemnity({
        basicSalary: Number(form.basicSalary),
        joiningDate: form.joiningDate,
        lastWorkingDate: form.lastWorkingDate,
      });
      setResult(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.employeeId || !form.reason || !result) {
      toast.error("Please select employee, reason and calculate first");
      return;
    }
    setSubmitting(true);
    try {
      await payrollService.createIndemnity({
        ...form,
        basicSalary: Number(form.basicSalary),
        yearsOfService: result.yearsOfService,
        calculatedAmount: result.calculatedAmount,
      });
      toast.success("Indemnity request submitted for approval");
      setForm({
        employeeId: "", employeeName: "",
        joiningDate: "", lastWorkingDate: "",
        basicSalary: "", reason: "", notes: "",
      });
      setResult(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>EOSB Calculator</CardTitle>
            <CardDescription>
              Calculate end-of-service benefit based on UAE Labour Law formula.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>Employee <span className="text-red-500">*</span></Label>
                <Select value={form.employeeId} onValueChange={handleEmployeeChange}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e._id} value={e._id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason <span className="text-red-500">*</span></Label>
                <Select value={form.reason} onValueChange={v => set("reason", v)}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termination">Termination</SelectItem>
                    <SelectItem value="resignation">Resignation</SelectItem>
                    <SelectItem value="retirement">Retirement</SelectItem>
                    <SelectItem value="end-of-contract">End of Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Joining Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.joiningDate}
                  onChange={e => set("joiningDate", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Last Working Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.lastWorkingDate}
                  onChange={e => set("lastWorkingDate", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Basic Salary (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" placeholder="Enter basic salary"
                  value={form.basicSalary} onChange={e => set("basicSalary", e.target.value)} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes..." rows={3}
                  value={form.notes} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCalculate} disabled={calculating}>
              {calculating
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</>
                : <><Calculator className="mr-2 h-4 w-4" /> Calculate EOSB</>}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !result}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                : "Submit for Approval"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Result Panel */}
      <div className="lg:col-span-1">
        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" /> EOSB Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Years of Service</span>
                  <span className="font-medium">{result.yearsOfService} yrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="font-medium">₹ {Number(form.basicSalary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Formula Used</span>
                  <span className="font-medium text-xs">{result.breakdown.formula}</span>
                </div>
                <div className="border-t my-2" />
                <div className="p-4 bg-white dark:bg-black rounded-lg border text-center shadow-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">EOSB Amount</p>
                  <h2 className="text-3xl font-bold text-blue-600 mt-1">
                    ₹ {result.calculatedAmount.toLocaleString()}
                  </h2>
                </div>
                {result.yearsOfService < 1 && (
                  <p className="text-xs text-red-500 text-center">
                    Employee has less than 1 year of service. Not eligible for EOSB.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-60">
                <Calculator className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center text-sm">Fill in the details and click Calculate to see EOSB.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const PendingIndemnities = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await payrollService.getIndemnities({ status: "Pending" });
      setRecords(res.data || []);
    } catch {
      toast.error("Failed to load pending indemnities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, status) => {
    try {
      await payrollService.updateIndemnityStatus(id, status);
      toast.success(`Indemnity ${status.toLowerCase()} successfully`);
      fetchPending();
    } catch {
      toast.error("Action failed");
    }
  };

  if (loading) return (
    <Card><CardContent className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Indemnity Approvals</CardTitle>
        <CardDescription>{records.length} requests awaiting action</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>Basic</TableHead>
              <TableHead>EOSB Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No pending indemnity requests.
                </TableCell>
              </TableRow>
            ) : records.map(r => (
              <TableRow key={r._id}>
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell>{r.yearsOfService} yrs</TableCell>
                <TableCell>₹ {Number(r.basicSalary).toLocaleString()}</TableCell>
                <TableCell className="font-bold text-blue-600">
                  ₹ {Number(r.calculatedAmount).toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">{r.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline"
                      className="h-8 w-8 text-green-600 hover:bg-green-50"
                      onClick={() => handleAction(r._id, "Approved")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleAction(r._id, "Rejected")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const IndemnityHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    payrollService.getIndemnities().then(res => {
      setRecords(res.data || []);
    }).catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r =>
    r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <Card><CardContent className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </CardContent></Card>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Indemnity History</CardTitle>
          <CardDescription>All EOSB requests and their status</CardDescription>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8 w-64"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Years</TableHead>
              <TableHead>EOSB Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No records found.
                </TableCell>
              </TableRow>
            ) : filtered.map(r => (
              <TableRow key={r._id}>
                <TableCell className="font-medium">{r.employeeName}</TableCell>
                <TableCell>{r.yearsOfService} yrs</TableCell>
                <TableCell className="font-bold text-blue-600">
                  ₹ {Number(r.calculatedAmount).toLocaleString()}
                </TableCell>
                <TableCell className="capitalize">{r.reason}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[r.status] || ""}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Indemnity;
