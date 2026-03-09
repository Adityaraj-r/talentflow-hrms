import { useState, useEffect } from "react";
import { FileText, Check, X, Search, Loader2, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
};

const Tickets = () => {
  const { user } = useAuth();
  const userRole = (typeof user?.role === "string" ? user.role : user?.role?.name)?.toUpperCase();
  const isHR = HR_ROLES.includes(userRole);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tickets & Advances</h1>
        <p className="text-muted-foreground">Manage employee travel tickets and salary advance requests.</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          {isHR && <TabsTrigger value="request">New Request</TabsTrigger>}
          {isHR && <TabsTrigger value="pending">Pending Approvals</TabsTrigger>}
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {isHR && (
          <TabsContent value="request">
            <TicketForm onSuccess={() => {}} />
          </TabsContent>
        )}
        {isHR && (
          <TabsContent value="pending">
            <PendingTickets userEmail={user?.email} />
          </TabsContent>
        )}
        <TabsContent value="history">
          <TicketHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TicketForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: "", employeeName: "", type: "travel",
    travelPurpose: "", destination: "", departureDate: "",
    returnDate: "", ticketClass: "economy",
    amount: "", reason: "", notes: "",
  });

  useEffect(() => {
    apiClient.get("/admin/users").then(res => {
      setEmployees(res.users || res.data || []);
    }).catch(() => {});
  }, []);

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleEmployeeChange = (id) => {
    const emp = employees.find(e => e._id === id);
    set("employeeId", id);
    set("employeeName", emp ? `${emp.firstName} ${emp.lastName}` : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.reason) {
      toast.error("Employee and reason are required");
      return;
    }
    if (form.type === "travel" && (!form.destination || !form.departureDate)) {
      toast.error("Destination and departure date required for travel tickets");
      return;
    }
    if (form.type === "advance" && !form.amount) {
      toast.error("Amount is required for salary advances");
      return;
    }

    setSubmitting(true);
    try {
      await payrollService.createTicket(form);
      toast.success("Request submitted successfully");
      setForm({
        employeeId: "", employeeName: "", type: "travel",
        travelPurpose: "", destination: "", departureDate: "",
        returnDate: "", ticketClass: "economy",
        amount: "", reason: "", notes: "",
      });
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Ticket / Advance Request</CardTitle>
        <CardDescription>Submit a travel ticket or salary advance request for an employee.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="travel">Travel Ticket</SelectItem>
                  <SelectItem value="advance">Salary Advance</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            {form.type === "travel" && (
              <>
                <div className="space-y-2">
                  <Label>Travel Purpose</Label>
                  <Select value={form.travelPurpose} onValueChange={v => set("travelPurpose", v)}>
                    <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business Meeting</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="personal">Personal (Sponsored)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination <span className="text-red-500">*</span></Label>
                  <Input placeholder="Enter destination" value={form.destination}
                    onChange={e => set("destination", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Departure Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.departureDate}
                    onChange={e => set("departureDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Input type="date" value={form.returnDate}
                    onChange={e => set("returnDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ticket Class</Label>
                  <Select value={form.ticketClass} onValueChange={v => set("ticketClass", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="first">First Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {form.type === "advance" && (
              <div className="space-y-2">
                <Label>Advance Amount (₹) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" placeholder="Enter amount"
                  value={form.amount} onChange={e => set("amount", e.target.value)} />
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label>Reason <span className="text-red-500">*</span></Label>
              <Input placeholder="Brief reason for request"
                value={form.reason} onChange={e => set("reason", e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." rows={3}
                value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Request"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const PendingTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await payrollService.getTickets({ status: "Pending" });
      setTickets(res.data || []);
    } catch {
      toast.error("Failed to load pending tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (id, status) => {
    try {
      await payrollService.updateTicketStatus(id, status);
      toast.success(`Request ${status.toLowerCase()} successfully`);
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
        <CardTitle>Pending Approvals</CardTitle>
        <CardDescription>{tickets.length} requests awaiting action</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No pending requests.
                </TableCell>
              </TableRow>
            ) : tickets.map(t => (
              <TableRow key={t._id}>
                <TableCell className="font-medium">{t.employeeName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={t.type === "advance"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"}>
                    {t.type === "advance" ? "Salary Advance" : "Travel Ticket"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.type === "advance"
                    ? `₹ ${Number(t.amount).toLocaleString()}`
                    : `${t.destination} · ${t.ticketClass}`}
                </TableCell>
                <TableCell className="text-sm">{t.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline"
                      className="h-8 w-8 text-green-600 hover:bg-green-50"
                      onClick={() => handleAction(t._id, "Approved")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleAction(t._id, "Rejected")}>
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

const TicketHistory = () => {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  useEffect(() => {
    payrollService.getTickets().then(res => {
      setTickets(res.data || []);
    }).catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter(t =>
    t.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
    t.reason?.toLowerCase().includes(search.toLowerCase())
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
          <CardTitle>Ticket History</CardTitle>
          <CardDescription>All travel and advance requests</CardDescription>
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
              <TableHead>Type</TableHead>
              <TableHead>Details</TableHead>
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
            ) : filtered.map(t => (
              <TableRow key={t._id}>
                <TableCell className="font-medium">{t.employeeName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={t.type === "advance"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"}>
                    {t.type === "advance" ? "Salary Advance" : "Travel Ticket"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t.type === "advance"
                    ? `₹ ${Number(t.amount).toLocaleString()}`
                    : `${t.destination} · ${t.ticketClass}`}
                </TableCell>
                <TableCell className="text-sm">{t.reason}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[t.status] || ""}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Tickets;
