import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';

const ChartWidget = ({ 
  title, 
  subtitle, 
  children,
  actions,
  className 
}) => {
  return (
    <Card className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
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
        {actions && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartWidget;
