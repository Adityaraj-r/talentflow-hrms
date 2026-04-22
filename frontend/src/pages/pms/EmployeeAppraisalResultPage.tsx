import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/contexts/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMyPublishedAppraisalResult } from "@/api/pmsApi";
import { formatRatingBandLabel } from "@/constants/appraisalRatingBands";

function normalizeRole(role: unknown): string {
  const r = typeof role === "string" ? role : (role as { name?: string })?.name || "";
  return r.toUpperCase().replace(/\s+/g, "_");
}

export default function EmployeeAppraisalResultPage() {
  const { user } = useUser();
  const role = normalizeRole(user?.role);
  const isEmployee = role === "EMPLOYEE";

  const query = useQuery({
    queryKey: ["myPublishedAppraisalResult"],
    queryFn: fetchMyPublishedAppraisalResult,
    enabled: isEmployee,
  });

  if (!isEmployee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appraisal result</CardTitle>
          <CardDescription>This page is only available to employees.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-48 w-full max-w-lg" />
      </div>
    );
  }

  const data = query.data;

  if (!data) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Results not yet published</CardTitle>
          <CardDescription>
            Your appraisal outcomes will appear here after HR completes the cycle (processed). Check back
            later or reach out to HR if you believe this is an error.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Your appraisal result</h1>
        <p className="text-muted-foreground">Published cycle — bonus aligned with payroll snapshot.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{data.cycleName}</CardTitle>
          <CardDescription>
            Overall rating: <strong>{data.overallRating.toFixed(2)}</strong> / 5
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-b pb-2">
              <dt className="text-muted-foreground">Rating band</dt>
              <dd className="font-medium">{formatRatingBandLabel(data.ratingBand)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b pb-2">
              <dt className="text-muted-foreground">Bonus % (applied)</dt>
              <dd className="font-medium tabular-nums">{data.bonusPercent}%</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Bonus amount</dt>
              <dd className="font-semibold tabular-nums">
                {data.bonusAmount.toLocaleString(undefined, {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 2,
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
