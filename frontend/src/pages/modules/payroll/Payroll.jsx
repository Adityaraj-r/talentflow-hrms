import { useState, useEffect } from "react";
import {
  Calculator,
  User,
  Loader2,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import adminService from "../../../services/adminService";

const PayrollProcessing = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('localPayrollHistory');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedEmp, setSelectedEmp] = useState("");
  const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [year, setYear] = useState(new Date().getFullYear());
  const [lopDays, setLopDays] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [overtime, setOvertime] = useState(0);

  const [employeeDetails, setEmployeeDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminService.getUsers({ role: 'EMPLOYEE' });
        setEmployees(res.data || []);
      } catch (error) {
        console.error("Failed to load employees", error);
        toast.error("Failed to load employee list");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEmp) {
      const emp = employees.find(e => e._id === selectedEmp);
      setEmployeeDetails(emp);
    } else {
      setEmployeeDetails(null);
    }
  }, [selectedEmp, employees]);

  const calculatePreview = () => {
    if (!employeeDetails?.salary) return { gross: 0, net: 0, deductions: 0 };

    const basic = Number(employeeDetails.salary.basic) || 0;
    const allowances = (Number(employeeDetails.salary.allowances?.hra) || 0) +
      (Number(employeeDetails.salary.allowances?.transport) || 0) +
      (Number(employeeDetails.salary.allowances?.medical) || 0) +
      (Number(employeeDetails.salary.allowances?.other) || 0);

    const gross = basic + allowances + Number(bonus) + Number(overtime);

    const perDay = gross / 30;
    const lopDeduction = perDay * Number(lopDays);

    const deductions = (Number(employeeDetails.salary.deductions?.tax) || 0) +
      (Number(employeeDetails.salary.deductions?.pf) || 0) +
      (Number(employeeDetails.salary.deductions?.insurance) || 0) +
      lopDeduction;

    return {
      gross: Math.round(gross),
      net: Math.round(gross - deductions),
      deductions: Math.round(deductions)
    };
  };

  const preview = calculatePreview();
  const handleGenerate = () => {
    if (!selectedEmp || !employeeDetails) {
      toast.error("Please select an employee");
      return;
    }

    setProcessing(true);

    try {
      const newPayrollRecord = {
        _id: `PAY-${Date.now()}`,
        employeeId: employeeDetails,
        month,
        year,
        grossSalary: preview.gross,
        totalDeductions: preview.deductions,
        netSalary: preview.net,
        status: "Processed",
        date: new Date().toISOString()
      };

      const updatedHistory = [newPayrollRecord, ...history];

      setHistory(updatedHistory);
      localStorage.setItem('localPayrollHistory', JSON.stringify(updatedHistory));

      toast.success("Payroll Generated Successfully!");

      setBonus(0);
      setOvertime(0);
      setLopDays(0);

    } catch (error) {
      toast.error("Failed to generate payroll");
      console.error(error);
    } finally {
      setTimeout(() => setProcessing(false), 500);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all local payroll history?")) {
      setHistory([]);
      localStorage.removeItem('localPayrollHistory');
      toast.success("History cleared");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Run Payroll</h1>
          <p className="text-muted-foreground">Calculate and generate monthly payslips locally.</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearHistory} className="text-red-500 hover:bg-red-50">
            Clear Local History
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Details</CardTitle>
              <CardDescription>Select employee and period to process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <select
                    className="w-full p-2 border rounded-md bg-transparent"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md bg-transparent"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Employee</label>
                <select
                  className="w-full p-2 border rounded-md bg-transparent"
                  value={selectedEmp}
                  onChange={(e) => setSelectedEmp(e.target.value)}
                  disabled={loading}
                >
                  <option value="">{loading ? "Loading..." : "-- Choose Employee --"}</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId?.employeeCode || emp.employeeCode || 'No Code'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-500">LOP Days</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded-md bg-transparent"
                    value={lopDays}
                    onChange={(e) => setLopDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600">Bonus (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded-md bg-transparent"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-600">Overtime Amt (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full p-2 border rounded-md bg-transparent"
                    value={overtime}
                    onChange={(e) => setOvertime(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={processing || !selectedEmp || !employeeDetails?.salary}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4 h-11"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : !employeeDetails?.salary && selectedEmp ? (
                  "No Salary Data Available"
                ) : (
                  "Generate Payslip"
                )}
              </Button>

            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-slate-50 dark:bg-slate-900 border-dashed h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" /> Estimated Salary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmp && employeeDetails ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Basic Salary</span>
                    <span className="font-medium">₹ {(Number(employeeDetails.salary?.basic) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Allowances</span>
                    <span className="font-medium">
                      + ₹ {((Number(employeeDetails.salary?.allowances?.hra) || 0) +
                        (Number(employeeDetails.salary?.allowances?.transport) || 0) +
                        (Number(employeeDetails.salary?.allowances?.medical) || 0) +
                        (Number(employeeDetails.salary?.allowances?.other) || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span>Additions (Bonus/OT)</span>
                    <span>+ ₹ {(Number(bonus) + Number(overtime)).toLocaleString()}</span>
                  </div>

                  <div className="border-t my-2"></div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Gross Salary</span>
                    <span className="font-bold">₹ {preview.gross.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm text-red-500">
                    <span>Deductions (LOP/Tax)</span>
                    <span>- ₹ {preview.deductions.toLocaleString()}</span>
                  </div>

                  <div className="border-t my-2"></div>

                  <div className="p-4 bg-white dark:bg-black rounded-lg border text-center shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Payable</p>
                    <h2 className="text-3xl font-bold text-blue-600 mt-1">
                      ₹ {preview.net.toLocaleString()}
                    </h2>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground h-full opacity-60">
                  <User className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-center text-sm">Select an employee from the dropdown to calculate salary.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Local Payroll History</CardTitle>
          <CardDescription>View payslips generated in this browser session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payroll records generated yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.employeeId?.firstName} {record.employeeId?.lastName}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.employeeId?.employeeId?.employeeCode || record.employeeId?.employeeCode || 'EMP'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{record.month} {record.year}</TableCell>
                    <TableCell>₹ {record.grossSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-red-500">- ₹ {record.totalDeductions.toLocaleString()}</TableCell>
                    <TableCell className="font-bold text-green-600">₹ {record.netSalary.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" title="Download Payslip">
                        <Download className="w-4 h-4 text-gray-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

export default PayrollProcessing;