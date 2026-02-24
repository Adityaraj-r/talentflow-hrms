import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const PendingApprovalsChart = ({ data }) => {
  return (
    <Card className="shadow-sm h-[350px] flex flex-col overflow-hidden">
      <CardHeader className="pb-0 pt-4 px-4">
        <CardTitle className="text-lg font-medium">Pending Action Items</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pt-4 pr-6">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          {/* layout="vertical" flips the chart so it reads like a list */}
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.1)" />
            
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis 
              dataKey="module" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: 'currentColor' }} 
            />
            
            <Tooltip 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
              contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }}
              itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            
            {/* radius curves the right side of the bars */}
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={35}>
              {data?.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};