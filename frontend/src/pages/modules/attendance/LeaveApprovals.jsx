import { useState, useEffect } from "react";
import { Pagination } from "@/components/ui/pagination";
import leaveService from "@/services/leaveService";
import { useUser } from "@/contexts/UserContext";
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
  Check,
  X,
  Filter,
  AlertTriangle,
  ShieldCheck,
  Search,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const RejectModal = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Reject Leave Request
          </DialogTitle>
          <DialogDescription>
            Provide a reason so the employee understands why their request was
            rejected.
          </DialogDescription>
        </DialogHeader>
        <textarea
          rows={3}
          placeholder="Enter rejection reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Rejection reason is required.");
                return;
              }
              onConfirm(reason.trim());
            }}
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

const LeaveApprovals = () => {
  const { user } = useUser();
  const userRole = user?.role?.toUpperCase();
  const isHrOrAdmin = ["HR_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(userRole);

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAllLeaves(
        statusFilter === "All" ? "" : statusFilter
      );
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (res?.success && Array.isArray(res?.data)) data = res.data;
      else if (res?.data && Array.isArray(res?.data?.data))
        data = res.data.data;
      setLeaves(data);
    } catch {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await leaveService.updateLeaveStatus(id, "Approved");
      toast.success("Leave request approved.");
      fetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (reason) => {
    try {
      setActionLoading(true);
      await leaveService.updateLeaveStatus(
        selectedLeaveId,
        "Rejected",
        reason
      );
      toast.success("Leave request rejected.");
      setRejectModalOpen(false);
      setSelectedLeaveId(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to reject.");
    } finally {
      setActionLoading(false);
    }
  };

  const isEscalated = (createdAt) => {
    const days = Math.floor(
      (new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24)
    );
    return days >= 2;
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter !== "All" && leave.status !== statusFilter) return false;

    const name = `${leave.userId?.firstName || ""} ${leave.userId?.lastName || ""}`.toLowerCase();
    const email = (leave.userId?.email || "").toLowerCase();
    const dept = (leave.userId?.department || "").toLowerCase();
    const empCode = (leave.userId?.employeeCode || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return (
      name.includes(search) ||
      email.includes(search) ||
      dept.includes(search) ||
      empCode.includes(search)
    );
  });

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const pendingCount = leaves.filter((l) => l.status === "Pending").length;

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">
            Leave Approvals
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            {isHrOrAdmin
              ? "Review and manage organisation-wide leave requests."
              : "Review and manage your team's leave requests."}
          </p>
        </div>

        {pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 px-3 py-1.5 text-sm">
            <Clock className="w-3.5 h-3.5 mr-1.5" />
            {pendingCount} pending{" "}
            {pendingCount === 1 ? "request" : "requests"}
          </Badge>
        )}
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="border-b p-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {isHrOrAdmin ? "Organisation Requests" : "Team Requests"}
              </CardTitle>
              <CardDescription className="mt-0.5">
                Actions are only available for pending requests.
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
                    <SelectValue placeholder="Filter" />
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
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Employee ID</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Loading leave requests...
                    </TableCell>
                  </TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((leave) => (
                    <TableRow
                      key={leave._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {leave.userId?.firstName} {leave.userId?.lastName}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-primary/70 md:hidden">
                            {leave.userId?.employeeCode || "N/A"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {leave.userId?.email}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {leave.userId?.department || "No Department"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-sm text-muted-foreground">
                        {leave.userId?.employeeCode || "-"}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 text-xs"
                        >
                          {leave.leaveType}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                      </TableCell>

                      <TableCell className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {leave.totalDays}d
                      </TableCell>

                      <TableCell>
                        <p
                          className="text-sm text-slate-600 dark:text-slate-400 max-w-[160px] truncate"
                          title={leave.reason}
                        >
                          {leave.reason}
                        </p>
                        {leave.status === "Rejected" &&
                          leave.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <X className="w-3 h-3 shrink-0" />
                              <span
                                className="truncate max-w-[140px]"
                                title={leave.rejectionReason}
                              >
                                {leave.rejectionReason}
                              </span>
                            </p>
                          )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1.5 items-start">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs border",
                              leave.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                : leave.status === "Rejected"
                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                            )}
                          >
                            {leave.status}
                          </Badge>
                          {isHrOrAdmin &&
                            leave.status === "Pending" &&
                            isEscalated(leave.createdAt) && (
                              <Badge
                                variant="outline"
                                className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] flex items-center gap-1 px-1.5"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Escalated
                              </Badge>
                            )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {leave.status === "Pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(leave._id)}
                              disabled={actionLoading}
                              className="h-8 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400 gap-1"> <span title="Approve" className="flex items-center justify-center w-full h-full text-emerald-600 hover:text-emerald-700"><Check className="h-4 w-4" /><span className="sr-only">Approve</span></span></Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLeaveId(leave._id);
                                setRejectModalOpen(true);
                              }}
                              disabled={actionLoading}
                              className="h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 gap-1"> <span title="Reject" className="flex items-center justify-center w-full h-full text-rose-600 hover:text-rose-700"><X className="h-4 w-4" /><span className="sr-only">Reject</span></span></Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Reviewed
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredLeaves.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLeaves.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <RejectModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedLeaveId(null);
        }}
        onConfirm={handleRejectConfirm}
        loading={actionLoading}
      />
    </div>
  );
};

export default LeaveApprovals;