"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { IncomeByPeriod } from "@/lib/financialApi";

interface IncomeChartProps {
  data: IncomeByPeriod[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function IncomeChart({ data }: IncomeChartProps) {
  const chartData = data.map(item => ({
    period: item.period,
    "Thu nhập": item.total_income,
    "Phí phải thu": item.total_charges || 0,
    "Nợ": item.total_debt || 0,
  }));

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <span className="inline-block w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></span>
          Biểu đồ Thu Chi Theo Thời Gian
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="period" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              tickFormatter={formatCurrency}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="Thu nhập" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Phí phải thu" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Nợ" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
