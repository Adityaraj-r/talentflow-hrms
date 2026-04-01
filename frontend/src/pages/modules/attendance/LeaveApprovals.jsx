import { useState, useEffect } from "react";
import leaveService from "@/services/leaveService";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, X, Filter, AlertTriangle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const LeaveApprovals = () => {
  const { user } = useUser();
  const isHrOrAdmin = ["HR_MANAGER", "SUPER_ADMIN", "ADMIN"].includes(user?.role?.toUpperCase());

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAllLeaves();
      
      // Bulletproof array unwrapper
      let fetchedLeaves = [];
      if (Array.isArray(res)) fetchedLeaves = res;
      else if (res?.success && Array.isArray(res?.data)) fetchedLeaves = res.data;
      else if (res?.data && Array.isArray(res?.data?.data)) fetchedLeaves = res.data.data;
      
      setLeaves(fetchedLeaves);
    } catch (err) {
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id, status) => {
    try {
      const reason = status === "Rejected" ? rejectionReason : "";
      
      if (status === "Rejected" && !reason.trim()) {
        toast.error("A rejection reason is required.");
        return;
      }

      await leaveService.updateLeaveStatus(id, status, reason);
      toast.success(`Leave request ${status.toLowerCase()} successfully`);
      setRejectingId(null);
      setRejectionReason("");
      fetchLeaves();
    } catch (error) {
      toast.error(`Failed to ${status.toLowerCase()} leave request`);
    }
  };

  const isEscalated = (createdAt) => {
    const daysPending = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    return daysPending >= 2;
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (statusFilter === "All") return true;
    return leave.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Leave Approvals & Escalations</h1>
          <p className="text-muted-foreground">Review and manage organization-wide time-off requests.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(val) => {
            setStatusFilter(val);
            setRejectingId(null);
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Requests</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="sticky top-6 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b p-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Request History
          </CardTitle>
          <CardDescription>Actions are only available for pending requests.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Updating list...
                    </TableCell>
                  </TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No leave requests found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeaves.map((leave) => (
                    <TableRow key={leave._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {leave.userId?.firstName} {leave.userId?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">{leave.userId?.email}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{leave.userId?.department || "No Department"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {leave.leaveType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400">
                          <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400 mt-0.5">{leave.totalDays} Day(s)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={leave.reason}>
                          {leave.reason}
                        </p>
                        {leave.status === "Rejected" && leave.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <X className="w-3 h-3" /> {leave.rejectionReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-start">
                          <Badge variant="outline" className={
                            leave.status === "Approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                            leave.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }>
                            {leave.status}
                          </Badge>
                          
                          {isHrOrAdmin && leave.status === "Pending" && isEscalated(leave.createdAt) && (
                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1 text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Escalated
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {leave.status === "Pending" ? (
                          rejectingId === leave._id ? (
                            <div className="flex flex-col gap-2 items-end">
                              <Input
                                size="sm"
                                placeholder="Reason for rejection..."
                                className="w-48 h-8 text-xs"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => {
                                  setRejectingId(null);
                                  setRejectionReason("");
                                }} className="h-7 text-xs">
                                  Cancel
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAction(leave._id, "Rejected")} className="h-7 text-xs">
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700" onClick={() => handleAction(leave._id, "Approved")}>
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700" onClick={() => setRejectingId(leave._id)}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveApprovals;