"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { FeeBreakdown } from "@/lib/financialApi";

interface FeeBreakdownChartProps {
  data: FeeBreakdown;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function FeeBreakdownChart({ data }: FeeBreakdownChartProps) {
  const chartData = [
    { name: 'Điện', value: data.electric },
    { name: 'Nước', value: data.water },
    { name: 'Dịch vụ', value: data.service },
    { name: 'Phí xe', value: data.vehicles },
  ].filter(item => item.value > 0);

  const renderCustomLabel = ({ name, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <span className="inline-block w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></span>
          Phân Tích Các Loại Phí
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-3">
              {chartData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="font-medium text-gray-700">{item.name}</span>
                  </div>
                  <span className="text-gray-900 font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <span className="font-bold text-gray-700">Tổng cộng</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
