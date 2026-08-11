export default function ReportsHeader() {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-white">
          Reports & Analytics
        </h1>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
          Department insights and team performance summary
        </p>
      </div>
    </div>
  );
}