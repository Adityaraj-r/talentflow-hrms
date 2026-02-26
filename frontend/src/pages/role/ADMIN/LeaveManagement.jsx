import { useState, useEffect } from "react";
import leaveService from "@/services/leaveService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Filter, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const AdminLeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await leaveService.getAllLeaves();
      if (res.data) {
        setLeaves(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch leaves", err);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Updates the request status (Approve/Reject) and immediately refreshes 
  // the list so the admin sees the change reflected instantly.
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await leaveService.updateLeaveStatus(id, newStatus);
      toast.success(`Leave ${newStatus}`);
      fetchLeaves();// Reloading the full list to ensure data consistency
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  // We filter the list in the browser. This allows for instant switching 
  // between "All" and "Pending" without a loading spinner.
  const filteredLeaves = leaves.filter((leave) => {
    if (filterStatus === "All") return true;
    return leave.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Approved": return <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>;
      case "Rejected": return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
      // Defaulting to yellow/pending for any unrecognized or new status
      default: return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee time-off applications.</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
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

      <Card className="sticky top-6 border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>Actions are only available for 'Pending' requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-gray-200">
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Updating list...</TableCell></TableRow>
                ) : filteredLeaves.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No leave requests found for this filter.</TableCell></TableRow>
                ) : (
                  filteredLeaves.map((leave) => (
                    <TableRow key={leave._id}>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{leave.userId?.firstName} {leave.userId?.lastName}</span>
                          <span className="text-xs text-muted-foreground">{leave.userId?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{leave.leaveType}</TableCell>
                      <TableCell className="text-sm">{new Date(leave.startDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{new Date(leave.endDate).toLocaleDateString()}</TableCell>
                      {/* Using truncate to keep the table clean; full reason is visible on hover */}
                      <TableCell className="max-w-[200px] truncate text-sm" title={leave.reason}>{leave.reason}</TableCell>
                      <TableCell>{getStatusBadge(leave.status)}</TableCell>
                      <TableCell className="text-right">
                        {/* We only show Action buttons if the leave is Pending. 
                            Approved or Rejected requests are 'locked' for audit purposes. */}
                        {leave.status === "Pending" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:bg-green-50" onClick={() => handleStatusUpdate(leave._id, "Approved")}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleStatusUpdate(leave._id, "Rejected")}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
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

export default AdminLeaveManagement;