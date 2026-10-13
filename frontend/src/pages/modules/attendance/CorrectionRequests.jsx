import { useState, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination";
import { useUser } from "@/contexts/UserContext";
import attendanceService from "@/services/attendanceService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  ClipboardList,
  Clock,
  Calendar,
  Filter,
  AlertTriangle,
  Search,
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

const StatusBadge = ({ status }) => {
  const styles = {
    Pending:
      "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    Approved:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    Rejected:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  };
  return (
    <Badge variant="outline" className={`${styles[status]} px-2 py-0.5 border`}>
      {status}
    </Badge>
  );
};

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    onConfirm(reason.trim());
  };

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Reject Correction Request
          </DialogTitle>
          <DialogDescription>
            Provide a reason so the employee understands why their request was
            rejected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <textarea
            rows={3}
            placeholder="Enter rejection reason..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CorrectionRequests = () => {
  const { user } = useUser();
  const userRole = user?.role?.toUpperCase();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isHrOrAdmin = ["HR_MANAGER", "HR_OFFICER", "ADMIN", "SUPER_ADMIN", "SUPER ADMIN", "CEO", "EXECUTIVE", "FINANCE_MANAGER", "COUNTRY_MANAGER"].includes(userRole);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getCorrectionRequests(
        statusFilter === "All" ? "" : statusFilter
      );

      let fetched = [];
      if (Array.isArray(res)) fetched = res;
      else if (res?.success && Array.isArray(res?.data)) fetched = res.data;
      else if (res?.data && Array.isArray(res?.data?.data)) fetched = res.data.data;

      setRequests(fetched);
    } catch (err) {
      toast.error("Failed to load correction requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await attendanceService.reviewCorrectionRequest(id, "Approved");
      toast.success("Request approved. Attendance record has been updated.");
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (id) => {
    setSelectedRequestId(id);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (rejectionReason) => {
    try {
      setActionLoading(true);
      await attendanceService.reviewCorrectionRequest(
        selectedRequestId,
        "Rejected",
        rejectionReason
      );
      toast.success("Request rejected.");
      setRejectModalOpen(false);
      setSelectedRequestId(null);
      fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const name = `${req.requestedBy?.firstName || ""} ${req.requestedBy?.lastName || ""}`.toLowerCase();
    const email = (req.requestedBy?.email || "").toLowerCase();
    const dept = (req.requestedBy?.department || "").toLowerCase();
    const empCode = (req.requestedBy?.employeeCode || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      name.includes(search) || 
      email.includes(search) || 
      dept.includes(search) ||
      empCode.includes(search)
    );
  });

  const columns = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm text-slate-900 dark:text-white">
              {req.requestedBy?.firstName} {req.requestedBy?.lastName}
            </span>
            <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
              {req.requestedBy?.employeeCode || "N/A"}
            </span>
            <span className="text-xs text-muted-foreground">
              {req.requestedBy?.email}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {req.requestedBy?.department || "No Department"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "employeeCode",
      header: () => <span className="hidden md:inline">Employee ID</span>,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <span className="hidden md:inline font-mono text-sm text-muted-foreground">
            {req.requestedBy?.employeeCode || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const req = row.original;
        const attendance = req.attendanceId;
        return (
          <div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              {attendance?.date ? formatDate(attendance.date) : "-"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Submitted {formatDate(req.createdAt)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "currentTimes",
      header: "Current Times",
      cell: ({ row }) => {
        const req = row.original;
        const attendance = req.attendanceId;
        return (
          <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
            <span>
              In:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatTime(attendance?.clockIn)}
              </span>
            </span>
            <span>
              Out:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {formatTime(attendance?.clockOut)}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "requestedTimes",
      header: "Requested Times",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              In:{" "}
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {req.requestedClockIn ? formatTime(req.requestedClockIn) : "-"}
              </span>
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Out:{" "}
              <span className="font-medium text-purple-600 dark:text-purple-400">
                {req.requestedClockOut ? formatTime(req.requestedClockOut) : "-"}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div>
            <p
              className="text-sm text-slate-600 dark:text-slate-400 max-w-[180px] truncate"
              title={req.reason}
            >
              {req.reason}
            </p>
            {req.status === "Rejected" && req.rejectionReason && (
              <p className="text-xs text-red-500 mt-1 flex items-start gap-1">
                <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="truncate max-w-[160px]" title={req.rejectionReason}>
                  {req.rejectionReason}
                </span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div>
            <StatusBadge status={req.status} />
            {req.reviewedBy && (
              <p className="text-xs text-muted-foreground mt-1">
                by {req.reviewedBy?.firstName} {req.reviewedBy?.lastName}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const req = row.original;
        return (
          <div className="text-right flex justify-end gap-2">
            {req.status === "Pending" ? (
              <>
                <ActionIcon
                  icon={CheckCircle2}
                  tooltip="Approve"
                  onClick={() => handleApprove(req._id)}
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                />
                <ActionIcon
                  icon={XCircle}
                  tooltip="Reject"
                  onClick={() => openRejectModal(req._id)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                />
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Reviewed</span>
            )}
          </div>
        );
      },
    },
  ];

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
            Correction Requests
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Review and action employee attendance correction requests.
          </p>
        </div>

        {pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 px-3 py-1.5 text-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {pendingCount} pending {pendingCount === 1 ? "request" : "requests"}
          </Badge>
        )}
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-4 h-4 text-purple-600" />
                {isHrOrAdmin ? "Organisation-Wide Requests" : "Team Requests"}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {isHrOrAdmin
                  ? "Showing all correction requests across the organisation."
                  : "Showing correction requests from your team members."}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Name, ID, Dept, Email..."
                  className="pl-8 h-9 text-sm bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val)}
                >
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading requests...
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              searchable={false}
              defaultPageSize={10}
            />
          )}
        </CardContent>
      </Card>

      <RejectModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedRequestId(null);
        }}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default CorrectionRequests;