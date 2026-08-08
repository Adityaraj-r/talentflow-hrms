// export default function SkeletonCard() {
//   return (
//     <div className="bg-card border border-border rounded-2xl p-5 shadow-sm animate-pulse">
//       {/* Label Placeholder */}
//       <div className="h-3 w-24 bg-muted rounded mb-4" />

//       {/* Value Placeholder */}
//       <div className="h-6 w-20 bg-muted rounded" />
//     </div>
//   );
// }

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard() {
  return (
    <Card className="rounded-xl border border-border/80 shadow-sm">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20" />
      </CardContent>
    </Card>
  );
}