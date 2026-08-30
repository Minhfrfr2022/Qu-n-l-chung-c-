"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { BillAnalytics } from "../types";

interface BillAnalyticsChartProps {
  data: BillAnalytics[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export function BillAnalyticsChart({ data }: BillAnalyticsChartProps) {
  const chartData = data.map(item => ({
    period: item.period,
    "Đã thu": item.paid_amount,
    "Quá hạn": item.overdue_amount,
    "Tổng phải thu": item.total_amount,
  }));

  const paymentRateData = data.map(item => ({
    period: item.period,
    "Tỷ lệ thanh toán (%)": item.total_bills > 0 
      ? ((item.paid_bills / item.total_bills) * 100).toFixed(1)
      : 0,
  }));

  const latestPeriod = data[0];
  const pieData = latestPeriod ? [
    { name: 'Đã thanh toán', value: latestPeriod.paid_bills },
    { name: 'Quá hạn', value: latestPeriod.overdue_bills },
    { name: 'Chưa thanh toán', value: latestPeriod.total_bills - latestPeriod.paid_bills - latestPeriod.overdue_bills },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="space-y-6">
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <span className="inline-block w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
            Biểu Đồ Thu Chi Theo Kỳ
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
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Đã thu" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Quá hạn" fill="#ef4444" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Tổng phải thu" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <span className="inline-block w-1 h-6 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></span>
              Tỷ Lệ Thanh Toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentRateData}>
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
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="Tỷ lệ thanh toán (%)" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {pieData.length > 0 && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <span className="inline-block w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></span>
                Tình Trạng Hóa Đơn ({latestPeriod.period})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
