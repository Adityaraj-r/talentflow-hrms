import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const PendingApprovalsChart = ({ data }) => {
  const navigate = useNavigate();

  const handleBarClick = (entry) => {
    if (!entry || !entry.module) return;

    switch (entry.module) {
      case 'KYC Documents':
        navigate('/digital-locker');
        break;
      case 'Transfers':
        navigate('/employee-transfer');
        break;
      case 'Requisitions':
        navigate('/staff-requisition');
        break;
      case 'Leave Requests': 
        navigate('/attendance/leave-management');
        break;
      default:
        break;
    }
  };

  return (
    <Card className="shadow-sm h-[350px] flex flex-col overflow-hidden">
      <CardHeader className="pb-0 pt-1 px-4">
        <CardTitle className="text-lg font-medium">Pending Approvals</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pt-4 pr-6">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
            
            {/* 2. Add the onClick handler and style it so the cursor turns into a pointer */}
            <Bar 
              dataKey="count" 
              radius={[0, 4, 4, 0]} 
              barSize={35}
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }} 
            >
              {data?.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill} 
                  className="hover:brightness-110 transition-all duration-200" 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};