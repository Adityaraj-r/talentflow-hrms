import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  XCircle,
  FileText,
  BarChart3,
  Plus,
  Clock,
  Eye,
  Pencil
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { performanceApi } from "@/services/performanceApi";
import { reviewApi } from "@/services/reviewApi";
import AssignReviewModal from "@/components/performance/AssignReviewModal";
import { displayDepartment, displayPersonName } from "@/lib/pmsDisplay";
import SubmitReviewModal from "@/components/performance/SubmitReviewModal";
import { StatsCard } from "@/components/ui/stats-card";
import { DataTable } from "@/components/ui/data-table";
import { ActionIcon } from "@/components/ui/action-icon";

const ViewCycleDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [cycle, setCycle] = useState(location.state?.cycle || null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    loadCycleData();
  }, [id]);

  const loadCycleData = async () => {
    try {
      setLoading(true);

      const [cycleRes, reviewsRes] = await Promise.all([
        performanceApi.getCycleById(id),
        reviewApi.getAllReviews({ cycleId: id })
      ]);

      const cyclePayload =
        cycleRes && typeof cycleRes === "object" && "data" in cycleRes
          ? cycleRes.data
          : cycleRes;
      const cycleDoc =
        cyclePayload &&
          typeof cyclePayload === "object" &&
          cyclePayload !== null &&
          "data" in cyclePayload &&
          typeof cyclePayload.data === "object"
          ? cyclePayload.data
          : cyclePayload;
      setCycle(cycleDoc);

      const reviewsPayload =
        reviewsRes && typeof reviewsRes === "object" && "data" in reviewsRes
          ? reviewsRes.data
          : reviewsRes;
      const allReviews = Array.isArray(reviewsPayload)
        ? reviewsPayload
        : Array.isArray(reviewsPayload?.data)
          ? reviewsPayload.data
          : [];
      setReviews(
        allReviews.filter((r) => {
          const cId = typeof r.cycleId === "object" ? r.cycleId?._id : r.cycleId;
          return String(cId) === String(id);
        })
      );

    } catch (error) {
      toast.error("Failed to load cycle details");
    } finally {
      setLoading(false);
    }
  };

  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.status === "completed").length;
  const inProgressReviews = reviews.filter(r => r.status === "in-progress").length;
  const pendingReviews = reviews.filter(r => r.status === "pending").length;
  const completionRate = totalReviews > 0
    ? Math.round((completedReviews / totalReviews) * 100)
    : 0;
  const avgRating = completedReviews > 0
    ? reviews
      .filter(r => r.overallRating > 0)
      .reduce((sum, r) => sum + r.overallRating, 0) / completedReviews
    : 0;

  const getStatusStyle = (status) => {
    const styles = {
      completed: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30",
      "in-progress": "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30",
      pending: "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30"
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (status === "in-progress") return <Clock className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getEmployeePerson = (review) => {
    if (review?.employeeId && typeof review.employeeId === "object") return review.employeeId;
    if (review?.employee && typeof review.employee === "object") return review.employee;
    return null;
  };

  const getEmployeeName = (review) => {
    const person = getEmployeePerson(review);
    const fromPerson = displayPersonName(person, review);
    if (fromPerson !== "N/A") return fromPerson;
    const fromFlat =
      review?.employeeName ||
      review?.employeeFullName ||
      review?.name ||
      review?.employeeEmail;
    return fromFlat ? String(fromFlat) : "—";
  };

  const getReviewerName = (review) => {
    const n = displayPersonName(review.reviewerId);
    return n === "N/A" ? "—" : n;
  };

  const getEmployeeDept = (review) => {
    const person = getEmployeePerson(review);
    const fromPerson = displayDepartment(person, review);
    if (fromPerson !== "N/A") return fromPerson;
    const fromFlat = review?.department || review?.employeeDepartment || review?.dept;
    return fromFlat ? String(fromFlat) : "—";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-2 text-lg text-gray-900 dark:text-white">Loading cycle details...</span>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="space-y-6 max-w-full pb-10">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-[16px] overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-12 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Cycle Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The performance cycle you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/role/hr_manager/appraisal/cycles")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const columns = React.useMemo(() => [
    { header: "Employee", id: "employee", cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-white">{getEmployeeName(row.original)}</span> },
    { header: "Department", id: "department", cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{getEmployeeDept(row.original)}</span> },
    { header: "Status", id: "status", cell: ({ row }) => (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusStyle(row.original.status)}`}>
        {getStatusIcon(row.original.status)}
        {row.original.status?.replace("-", " ").toUpperCase()}
      </span>
    ) },
    { header: "Rating", id: "rating", cell: ({ row }) => (
      <span className="font-semibold">
        {row.original.overallRating > 0 ? <span className="text-orange-600 dark:text-orange-400">{row.original.overallRating}/5</span> : <span className="text-gray-400">—</span>}
      </span>
    ) },
    { header: "Reviewer", id: "reviewer", cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{getReviewerName(row.original)}</span> },
    { header: "Submitted", id: "submittedAt", cell: ({ row }) => <span className="text-gray-500 dark:text-gray-400">{row.original.submittedAt ? new Date(row.original.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span> },
    { id: "actions", header: () => <div className="text-right w-[100px] ml-auto">Actions</div>, cell: ({ row }) => {
      const review = row.original;
      return (
        <div className="flex items-center justify-end gap-2 w-[100px] ml-auto">
          {review.status === "pending" ? (
            <ActionIcon icon={Pencil} tooltip="Start Review" onClick={() => { setSelectedReview(review); setShowSubmitModal(true); }} />
          ) : (
            <ActionIcon icon={Eye} tooltip="View Details" onClick={() => navigate(`/role/hr_manager/review/${review._id}`)} />
          )}
        </div>
      );
    } }
  ], [navigate]);

  return (
    <div className="space-y-6 max-w-full pb-10">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/role/hr_manager/appraisal/cycles")}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white text-2xl">{cycle.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Performance cycle details and employee reviews
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cycle.status === "active"
                ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30"
                : cycle.status === "completed"
                  ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30"
                  : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30"
              }`}>
              {cycle.status?.toUpperCase()}
            </span>

            {cycle.status === "active" && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Assign Review
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Cycle Period" 
            value={`${new Date(cycle.startDate).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})} — ${new Date(cycle.endDate).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}`} 
            icon={Calendar} 
            variant="purple" 
          />
          <StatsCard title="Total Reviews" value={totalReviews} icon={Users} variant="purple" />
          <StatsCard title="Completion Rate" value={`${completionRate}%`} icon={CheckCircle2} variant="emerald" />
          <StatsCard title="Average Rating" value={completedReviews > 0 ? `${avgRating.toFixed(1)}/5` : "—"} icon={TrendingUp} variant="amber" />
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Review Status Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-100 dark:border-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedReviews}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg border border-yellow-100 dark:border-yellow-500/20">
              <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgressReviews}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <Clock className="h-8 w-8 text-gray-500 dark:text-gray-400" />
              <div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{pendingReviews}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {cycle.description && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cycle Description
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{cycle.description}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Assigned Reviews ({totalReviews})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Track individual employee review status and ratings
              </p>
            </div>
          </div>

          <div className="p-4">
            {reviews.length === 0 ? (
              <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                No reviews assigned yet.
                {cycle.status === "active" && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="ml-2 text-purple-600 dark:text-purple-400 underline font-medium"
                  >
                    Assign the first review
                  </button>
                )}
              </div>
            ) : (
              <DataTable columns={columns} data={reviews} defaultPageSize={10} searchable={false} />
            )}
          </div>
        </div>

      </div>

      <AssignReviewModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        cycleId={id}
        cycleName={cycle?.name}
        onSuccess={() => {
          setShowAssignModal(false);
          loadCycleData();
          toast.success("Review assigned! Table updated.");
        }}
      />

      <SubmitReviewModal
        isOpen={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setSelectedReview(null); }}
        review={selectedReview}
        onSuccess={() => {
          setShowSubmitModal(false);
          setSelectedReview(null);
          loadCycleData();
          toast.success("Review submitted! Table updated.");
        }}
      />
    </div>
  );
};

export default ViewCycleDetails;
