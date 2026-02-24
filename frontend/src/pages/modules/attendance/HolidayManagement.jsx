import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import holidayService from "@/services/holidayService";
import { toast } from "sonner"; 

const HolidayManagement = () => {
    const { user } = useUser();
    const isAdmin = ["ADMIN", "HR_MANAGER"].includes(user?.role?.toUpperCase());

    const [holidays, setHolidays] = useState([]);
    const [formData, setFormData] = useState({ name: "", date: "", type: "National Holiday" });
    const [loading, setLoading] = useState(true);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const res = await holidayService.getHolidays();
            
            if (res?.data?.success && Array.isArray(res.data.data)) {
                setHolidays(res.data.data);
            } else if (res?.success && Array.isArray(res.data)) {
                setHolidays(res.data);
            } else if (Array.isArray(res?.data)) {
                setHolidays(res.data);
            } else {
                setHolidays([]);
            }
        } catch (error) {
            console.error("Failed to fetch holidays", error);
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
            await holidayService.addHoliday(formData);
            setFormData({ name: "", date: "", type: "National Holiday" });
            toast.success("Holiday added successfully");
            fetchHolidays();
        } catch (error) {
            toast.error("Failed to add holiday");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this holiday?")) return;
        try {
            await holidayService.deleteHoliday(id);
            toast.success("Holiday deleted");
            fetchHolidays();
        } catch (error) {
            console.error("Delete failed");
            toast.error("Failed to delete holiday");
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-GB", {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const getMonth = (dateStr) => new Date(dateStr).toLocaleString('default', { month: 'short' });
    const getDay = (dateStr) => new Date(dateStr).getDate();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Holiday Calendar</h1>
                    <p className="text-muted-foreground">Manage upcoming holidays and non-working days.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {isAdmin && (
                    <div className="lg:col-span-1">
                        <Card className="sticky top-6 border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" /> 
                                    Add Holiday
                                </CardTitle>
                                <CardDescription>Schedule a new holiday for the year.</CardDescription>
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
                                        <select
                                            name="type"
                                            className="w-full p-2 border rounded-lg bg-transparent text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.type}
                                            onChange={handleChange}
                                        >
                                            <option className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white" value="National Holiday">National Holiday</option>
                                        </select>
                                    </div>

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2">
                                        Add to Calendar
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
                    <Card className="border-slate-200 dark:border-slate-800">
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
                            ) : holidays.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No holidays found. Add one to populate the calendar.</p>
                            ) : (
                                <div className="space-y-3">
                                    {holidays.map((holiday) => (
                                        <div 
                                            key={holiday._id} 
                                            className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{getMonth(holiday.date)}</span>
                                                    <span className="text-xl font-bold leading-none">{getDay(holiday.date)}</span>
                                                </div>
                                            
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">{holiday.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">{formatDate(holiday.date)}</span>
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                                                            {holiday.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDelete(holiday._id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default HolidayManagement;