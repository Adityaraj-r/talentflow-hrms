import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Timer,
  Check,
  Search,
  User,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatOTHours = (hours) => {
  if (!hours || hours <= 0) return "-";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const OvertimeApprovals = () => {
  const { user } = useUser();
  const userRole = user?.role?.toUpperCase();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [startDate, setStartDate] = useState(`${currentMonth}-01`);
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split("T")[0]
  );

  const isHrOrAdmin = ["HR_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(userRole);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getOvertimePending(startDate, endDate);

      let fetched = [];
      if (Array.isArray(res)) fetched = res;
      else if (res?.success && Array.isArray(res?.data)) fetched = res.data;
      else if (res?.data && Array.isArray(res?.data?.data))
        fetched = res.data.data;

      setRecords(fetched);
    } catch (err) {
      toast.error("Failed to load overtime records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate]);

  const handleApprove = async (id) => {
    try {
      setApprovingId(id);
      await attendanceService.approveOvertime(id);
      toast.success("Overtime approved successfully.");
      fetchRecords();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to approve overtime."
      );
    } finally {
      setApprovingId(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const name = `${record.userId?.firstName || ""} ${record.userId?.lastName || ""}`.toLowerCase();
    const email = (record.userId?.email || "").toLowerCase();
    const dept = (record.userId?.department || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      name.includes(search) ||
      email.includes(search) ||
      dept.includes(search)
    );
  });

  const totalOTPending = records.reduce(
    (sum, r) => sum + (r.overtimeHours || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Overtime Approvals
          </h1>
          <p className="text-muted-foreground">
            Review and approve employee overtime beyond their scheduled shift hours.
          </p>
        </div>

        {records.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 px-3 py-1.5 text-sm">
            <Timer className="w-3.5 h-3.5 mr-1.5" />
            {records.length} pending · {formatOTHours(totalOTPending)} total OT
          </Badge>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            From
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 text-sm w-40"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            To
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 text-sm w-40"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or dept..."
            className="pl-8 h-9 text-sm bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="border-b p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="w-4 h-4 text-amber-500" />
            {isHrOrAdmin
              ? "Organisation-Wide Pending Overtime"
              : "Team Pending Overtime"}
          </CardTitle>
          <CardDescription className="mt-0.5">
            Showing records where employee clocked out beyond their scheduled
            shift end time. Approved overtime is included in payroll calculation.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shift End</TableHead>
                  <TableHead>Clocked Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead className="text-amber-600 dark:text-amber-400">
                    OT Hours
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Loading overtime records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                        <p className="text-sm">
                          No pending overtime records found for this period.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow
                      key={record._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {record.userId?.firstName} {record.userId?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {record.userId?.email}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {record.userId?.department || "No Department"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {formatDate(record.date)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                          {record.userId?.currentShift?.endTime
                            ? record.userId.currentShift.endTime
                            : "No shift"}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-red-400" />
                          {formatTime(record.clockOut)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {record.totalHours
                            ? `${record.totalHours}h`
                            : "-"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 font-mono">
                          +{formatOTHours(record.overtimeHours)}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(record._id)}
                          disabled={approvingId === record._id}
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {approvingId === record._id
                            ? "Approving..."
                            : "Approve OT"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredRecords.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Showing {filteredRecords.length} record
            {filteredRecords.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Total pending OT:{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {formatOTHours(
                filteredRecords.reduce(
                  (sum, r) => sum + (r.overtimeHours || 0),
                  0
                )
              )}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default OvertimeApprovals;