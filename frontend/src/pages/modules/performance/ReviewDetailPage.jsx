import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Star, Loader2, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { reviewApi } from "@/services/reviewApi";
import { useAuth } from "@/contexts/AuthContext";

const ReviewDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showApprovePanel, setShowApprovePanel] = useState(false);

  useEffect(() => {
    loadReview();
  }, [id]);

  const loadReview = async () => {
    try {
      setLoading(true);
      const res = await reviewApi.getReviewById(id);
      // reviewApi returns full { success, data } object (no .then(r=>r.data) unwrap)
      const reviewData = res.data ?? res;
      if (reviewData) {
        setReview(reviewData);
      } else {
        toast.error("Review not found");
      }
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      await reviewApi.approveReview(id, { feedback });
      toast.success("Review approved successfully!");
      await loadReview();
      setShowApprovePanel(false);
      setFeedback("");
    } catch (error) {
      // FIXED: apiClient error interceptor returns error data directly, not error.response.data
      toast.error(error?.error || error?.message || "Failed to approve review");
    } finally {
      setApproving(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      completed: "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30",
      approved:  "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30",
      pending:   "bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-500/30"
    };
    return styles[status] || styles.pending;
  };

  const userRole = typeof user?.role === "string" ? user.role.toUpperCase() : user?.role?.name?.toUpperCase();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-950">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <span className="ml-2 text-lg text-gray-900 dark:text-white">Loading review...</span>
    </div>
  );

  if (!review) return (
    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
      Review not found.
      <button onClick={() => navigate(-1)} className="ml-2 text-blue-500 underline">Go back</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Details</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {review.cycleId?.name} — {review.employeeId?.firstName} {review.employeeId?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(review.status)}`}>
              {review.status?.toUpperCase()}
            </span>

            {/* FIXED: role check uses normalized uppercase comparison */}
            {review.status === "completed" && userRole === "HR_MANAGER" && (
              <button
                onClick={() => setShowApprovePanel(!showApprovePanel)}
                className="flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
              >
                <ThumbsUp className="w-4 h-4" />
                Approve Review
              </button>
            )}

            {review.status === "approved" && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Approved
              </div>
            )}
          </div>
        </div>

        {/* Approve Panel */}
        {showApprovePanel && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Approve this Review</h3>
            <textarea
              rows={3}
              placeholder="Optional HR Manager feedback before approving..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowApprovePanel(false); setFeedback(""); }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {approving
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Approving...</>
                  : "Confirm Approve"
                }
              </button>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Employee</h3>
            <p className="font-bold text-gray-900 dark:text-white text-lg">
              {review.employeeId?.firstName} {review.employeeId?.lastName}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{review.employeeId?.email}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{review.employeeId?.department}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">Reviewer</h3>
            <p className="font-bold text-gray-900 dark:text-white text-lg">
              {review.reviewerId?.firstName} {review.reviewerId?.lastName}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{review.reviewerId?.email}</p>
            {review.submittedAt && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Submitted: {new Date(review.submittedAt).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            )}
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-xl p-6 flex items-center justify-between">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Overall Rating</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`h-6 w-6 fill-current ${
                    star <= Math.round(review.overallRating)
                      ? "text-orange-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(review.overallRating || 0).toFixed(1)}/5
            </span>
          </div>
        </div>

        {/* Competency Ratings */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Competency Ratings</h3>
          <div className="space-y-4">
            {review.competencies?.length > 0 ? (
              review.competencies.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{comp.name}</p>
                    {comp.comments && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{comp.comments}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 fill-current ${
                          star <= comp.rating ? "text-orange-400" : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {comp.rating}/5
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No competency ratings yet.</p>
            )}
          </div>
        </div>

        {/* Manager Comments */}
        {review.managerComments && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Manager Comments</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{review.managerComments}</p>
          </div>
        )}

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Strengths</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{review.strengths || "—"}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Areas for Improvement</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{review.areasForImprovement || "—"}</p>
          </div>
        </div>

        {/* HR Manager Feedback */}
        {review.status === "approved" && review.adminFeedback && (
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">HR Manager Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{review.adminFeedback}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewDetailPage;
