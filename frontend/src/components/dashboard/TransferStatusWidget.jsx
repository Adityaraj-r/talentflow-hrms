import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

const TransferStatusWidget = () => {
    const { user } = useAuth();
    const [latestRequest, setLatestRequest] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            // Use the employee ID seen in your screenshots (e.g., EMP-004)
            if (user?.employeeId || localStorage.getItem('userRole')) {
                try {
                    const res = await axios.get(`http://localhost:5001/api/transfers/status/${user?.employeeId || 'EMP-004'}`);
                    setLatestRequest(res.data);
                } catch (err) {
                    console.error("Notification Fetch Error:", err);
                }
            }
        };
        fetchStatus();
    }, [user]);

    if (!latestRequest) return null;

    const statusConfig = {
        Pending: { icon: <Clock className="text-orange-500" />, bg: "bg-orange-50 border-orange-200", text: "Your transfer request is under review." },
        Approved: { icon: <CheckCircle className="text-green-500" />, bg: "bg-green-50 border-green-200", text: "Your transfer request has been Approved!" },
        Rejected: { icon: <XCircle className="text-red-500" />, bg: "bg-red-50 border-red-200", text: "Your transfer request was Rejected." }
    };

    const config = statusConfig[latestRequest.status];

    return (
        <Card className={`border shadow-sm mb-6 ${config.bg}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-white rounded-full shadow-sm">{config.icon}</div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Transfer Update</p>
                    <p className="text-xs text-gray-600">{config.text}</p>
                </div>
                <div className="text-[10px] font-black px-2 py-1 rounded bg-white border uppercase tracking-wider">
                    {latestRequest.status}
                </div>
            </CardContent>
        </Card>
    );
};

export default TransferStatusWidget;