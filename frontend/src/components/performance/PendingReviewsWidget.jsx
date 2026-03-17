import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { reviewApi } from "../../services/reviewApi";
import { toast } from "sonner";

const PendingReviewsWidget = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingReviews();
  }, []);

  const loadPendingReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getPendingReviews();
      setPendingReviews(response.data || []);
    } catch (error) {
      console.error("Failed to load pending reviews:", error);
      toast.error("Failed to load pending reviews");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-[200px]">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-3 bg-muted rounded w-20"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[200px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Pending Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {pendingReviews.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No pending reviews</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            {pendingReviews.slice(0, 4).map((review) => (
              <div key={review._id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                <div className="space-y-1">
                  <p className="font-medium text-sm line-clamp-1">
                    {review.employeeId?.firstName} {review.employeeId?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.cycleId?.name || "Q1 2026"}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {review.status || "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="px-6 pb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start h-8 text-xs"
            onClick={() => window.location.href = '/admin/performance'}
          >
            View all reviews
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingReviewsWidget;
