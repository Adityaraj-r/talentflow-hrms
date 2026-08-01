export default function ReportsHeader() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Department insights and team performance summary
        </p>
      </div>
    </div>
  );
}