import { StatsCard as GlobalStatsCard } from "@/components/ui/stats-card";

const StatsCard = ({ title, value, description, subtitle, icon, isLoading, variant, trend, isActive, onClick }) => {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-6 border shadow-sm h-[140px] flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start">
          <div className="h-4 w-1/2 bg-muted rounded"></div>
          <div className="h-10 w-10 bg-muted rounded-full"></div>
        </div>
        <div>
          <div className="h-8 w-1/3 bg-muted rounded mt-2"></div>
          <div className="h-3 w-2/3 bg-muted rounded mt-2"></div>
        </div>
      </div>
    );
  }

  return (
    <GlobalStatsCard
      title={title}
      value={value}
      subtitle={subtitle || description}
      icon={icon}
      variant={variant || "blue"}
      trend={trend}
      isActive={isActive}
      onClick={onClick}
    />
  );
};

export default StatsCard;