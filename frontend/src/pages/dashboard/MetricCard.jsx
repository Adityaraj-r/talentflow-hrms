import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  color = 'blue',
  trend,
  trendValue,
  className 
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10',
      border: 'border-l-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    green: {
      bg: 'from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10',
      border: 'border-l-green-500',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-500/10 dark:bg-green-500/20',
    },
    yellow: {
      bg: 'from-yellow-500/10 to-yellow-600/5 dark:from-yellow-500/20 dark:to-yellow-600/10',
      border: 'border-l-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    },
    red: {
      bg: 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10',
      border: 'border-l-red-500',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-500/10 dark:bg-red-500/20',
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10',
      border: 'border-l-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-lg dark:hover:shadow-xl",
        `bg-gradient-to-br ${colors.bg}`,
        colors.border,
        "border-slate-200 dark:border-slate-700",
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn("p-3 rounded-xl", colors.iconBg)}>
                <Icon className={cn("h-6 w-6", colors.text)} />
              </div>
            )}
          </div>
          <div className={cn("text-sm font-medium text-slate-600 dark:text-slate-400")}>
            {title}
          </div>
        </div>

        <div className="space-y-2">
          <div className={cn("text-4xl font-bold", colors.text)}>
            {value}
          </div>
          
          {subtitle && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}

          {trend && trendValue && (
            <div className="flex items-center gap-2 text-sm">
              <span className={cn(
                "font-medium",
                trend === 'up' ? 'text-green-600 dark:text-green-400' : 
                trend === 'down' ? 'text-red-600 dark:text-red-400' : 
                'text-slate-600 dark:text-slate-400'
              )}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </span>
              <span className="text-slate-500 dark:text-slate-500">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
