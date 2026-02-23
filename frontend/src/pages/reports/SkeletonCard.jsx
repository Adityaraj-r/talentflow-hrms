export default function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm animate-pulse">
      {/* Label Placeholder */}
      <div className="h-3 w-24 bg-muted rounded mb-4" />

      {/* Value Placeholder */}
      <div className="h-6 w-20 bg-muted rounded" />
    </div>
  );
}