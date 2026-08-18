import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/contexts/UserContext";
import holidayService from "@/services/holidayService";
import { toast } from "sonner";
import { useConfirm } from "@/contexts/ConfirmContext";

const HolidayManagement = () => {
    const { confirm } = useConfirm();
    const { user } = useUser();
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"].includes(user?.role?.toUpperCase());

    const [holidays, setHolidays] = useState([]);
    const [formData, setFormData] = useState({ name: "", date: "", type: "National" });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await holidayService.getHolidays();
            if (res?.success && Array.isArray(res.data)) {
                setHolidays(res.data);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            toast.error("Failed to load holidays");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.date) return;

        try {
            if (editingId) {
                await holidayService.updateHoliday(editingId, formData);
                toast.success("Holiday updated successfully");
            } else {
                await holidayService.addHoliday(formData);
                toast.success("Holiday added successfully");
            }
            setFormData({ name: "", date: "", type: "National" });
            setEditingId(null);
            fetchHolidays();
        } catch (error) {
            toast.error(editingId ? "Failed to update holiday" : "Failed to add holiday");
        }
    };

    const handleEdit = (holiday) => {
        setFormData({
            name: holiday.name,
            date: new Date(holiday.date).toISOString().split('T')[0],
            type: holiday.type
        });
        setEditingId(holiday._id);
    };

    const cancelEdit = () => {
        setFormData({ name: "", date: "", type: "National" });
        setEditingId(null);
    };

    const handleDelete = (id) => {
        confirm({
            title: "Delete Holiday?",
            message: "Are you sure you want to delete this holiday?",
            action: async () => {
                try {
                    await holidayService.deleteHoliday(id);
                    toast.success("Holiday deleted");
                    fetchHolidays();
                } catch (error) {
                    toast.error("Failed to delete holiday");
                    throw error;
                }
            }
        });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getMonth = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'short' });
    const getDay = (dateStr) => new Date(dateStr).getDate();

    const columns = [
        {
            accessorKey: "dateDisplay",
            header: "Date",
            cell: ({ row }) => {
                const holiday = row.original;
                return (
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-primary/10 rounded-lg text-primary border border-primary/20">
                            <span className="text-[10px] font-bold uppercase tracking-wider">{getMonth(holiday.date)}</span>
                            <span className="text-xl font-bold leading-none">{getDay(holiday.date)}</span>
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground">{formatDate(holiday.date)}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "name",
            header: "Holiday Name",
            cell: ({ row }) => (
                <h4 className="font-semibold text-slate-900 dark:text-white text-base">{row.original.name}</h4>
            )
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                    {row.original.type}
                </Badge>
            )
        }
    ];

    if (isAdmin) {
        columns.push({
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const holiday = row.original;
                return (
                    <div className="text-right flex justify-end gap-2">
                        <ActionIcon
                            icon={Pencil}
                            tooltip="Edit"
                            onClick={() => handleEdit(holiday)}
                            className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        />
                        <ActionIcon
                            icon={Trash2}
                            tooltip="Delete"
                            onClick={() => handleDelete(holiday._id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                    </div>
                );
            }
        });
    }

    return (
        <div className="space-y-6 max-w-full pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-[28px] text-2xl">Holiday Calendar</h1>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">Manage upcoming holidays and non-working days.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {isAdmin && (
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-primary" />
                                    {editingId ? "Edit Holiday" : "Add Holiday"}
                                </CardTitle>
                                <CardDescription>
                                    {editingId ? "Update existing holiday details." : "Schedule a new holiday for the year."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Holiday Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="e.g. Independence Day"
                                            className="w-full p-2 border bg-transparent rounded-lg"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            className="w-full p-2 border bg-transparent rounded-lg"
                                            value={formData.date}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Type</label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => setFormData({ ...formData, type: val })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="National">National</SelectItem>
                                                <SelectItem value="Regional">Regional</SelectItem>
                                                <SelectItem value="Company">Company</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <Button type="submit" className="flex-1">
                                            {editingId ? "Update Calendar" : "Add to Calendar"}
                                        </Button>
                                        {editingId && (
                                            <Button type="button" variant="outline" onClick={cancelEdit}>
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle>Upcoming Holidays</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : (
                                <DataTable
                                    columns={columns}
                                    data={holidays}
                                    searchable={false}
                                    defaultPageSize={10}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default HolidayManagement;