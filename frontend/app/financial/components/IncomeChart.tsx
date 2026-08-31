"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    "Thu (Hóa đơn)": item.total_income,
    "Chi (Bảo trì/Sửa chữa)": item.total_expense || 0,
    "Nợ chưa thu": item.total_debt || 0,
    "Lợi nhuận ròng (Thu - Chi)": item.net_profit !== undefined ? item.net_profit : (item.total_income - (item.total_expense || 0)),
  }));

  return (
    <Card className="bg-slate-800 border-slate-700 shadow-xl text-slate-100">
      <CardHeader>
        <CardTitle className="text-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-6 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></span>
            Biểu đồ Thu (Hóa đơn) - Chi (Bảo trì) & Lợi nhuận ròng
          </div>
          <span className="text-xs text-slate-400 font-normal">Đơn vị: VNĐ</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
            <XAxis 
              dataKey="period" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tickFormatter={formatCurrency}
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              formatter={(value: number) => [
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value),
                ""
              ]}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#f8fafc',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
            />
            <Bar dataKey="Thu (Hóa đơn)" fill="#10b981" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Chi (Bảo trì/Sửa chữa)" fill="#ef4444" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Nợ chưa thu" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Line 
              type="monotone" 
              dataKey="Lợi nhuận ròng (Thu - Chi)" 
              stroke="#38bdf8" 
              strokeWidth={3} 
              dot={{ r: 5, fill: '#38bdf8' }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
