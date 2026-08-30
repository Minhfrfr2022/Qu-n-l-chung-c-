"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import type { CollectionRate } from "@/lib/financialApi";

interface CollectionRateChartProps {
  data: CollectionRate[];
}

export default function CollectionRateChart({ data }: CollectionRateChartProps) {
  const chartData = data.map(item => ({
    period: item.period,
    "Tỷ lệ thu (%)": parseFloat(item.collection_rate.toString()),
  }));

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <span className="inline-block w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
          Tỷ Lệ Thu Theo Thời Gian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(2)}%`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area 
              type="monotone" 
              dataKey="Tỷ lệ thu (%)" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorRate)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
