import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const ActivityFeed = ({ 
  title = "Recent Activities",
  subtitle,
  activities = [],
  maxHeight = "400px",
  className 
}) => {
  const getActivityColor = (type) => {
    const colors = {
      create: 'text-green-600 bg-green-500/10 dark:text-green-400 dark:bg-green-500/20',
      update: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20',
      delete: 'text-red-600 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
      login: 'text-purple-600 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-500/20',
      default: 'text-slate-600 bg-slate-500/10 dark:text-slate-400 dark:bg-slate-500/20',
    };
    return colors[type] || colors.default;
  };

  return (
    <Card className={cn("bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </CardTitle>
          {subtitle && (
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </CardDescription>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </Button>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-4 overflow-y-auto custom-scrollbar pr-2"
          style={{ maxHeight }}
        >
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-slate-400 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400">No recent activities</p>
            </div>
          ) : (
            activities.map((activity, index) => (
              <div 
                key={index}
                className="flex gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                  getActivityColor(activity.type)
                )}>
                  <Clock className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6);
        }
      `}</style>
    </Card>
  );
};

export default ActivityFeed;
