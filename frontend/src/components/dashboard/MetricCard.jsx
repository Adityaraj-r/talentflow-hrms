import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ 
  title, 
  value, 
  label, 
  trend, 
  trendValue, 
  icon: Icon,
  color = 'blue',
  onClick 
}) => {
  const isClickable = Boolean(onClick);

  const colorClasses = {
    blue: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-purple-500',
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div 
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? "button" : undefined}
      className={`relative bg-card dark:bg-slate-900/90 border border-border/80 rounded-xl shadow-sm cursor-pointer p-6 transition-all duration-300 ease-out ${
        isClickable 
          ? "group hover:border-primary/40 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-slate-950/40 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
          : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue} ${isClickable ? "transition-transform duration-300 group-hover:scale-110" : ""}`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-foreground dark:text-white mb-1 tracking-tight">{value}</h3>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label || title}</p>
      </div>
    </div>
  );
};

export default MetricCard;
