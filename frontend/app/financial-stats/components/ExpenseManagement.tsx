"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/bills/components/ui/card";
import { Button } from "@/app/bills/components/ui/button";
import { Badge } from "@/app/bills/components/ui/badge";
import { Loader2, Wrench, DollarSign, Calendar, Filter, CheckCircle2, AlertTriangle, Hammer } from "lucide-react";
import { financialAPI } from "@/lib/financialApi";
import type { ExpensesByCategory, MaintenanceExpenseItem } from "@/lib/financialApi";
import { format, subMonths } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ExpenseManagement() {
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<ExpensesByCategory | null>(null);
  const [expenseList, setExpenseList] = useState<MaintenanceExpenseItem[]>([]);
  const [totalExpensesAllTime, setTotalExpensesAllTime] = useState(0);

  const currentDate = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(format(currentDate, "yyyy-MM"));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoryRes, listRes] = await Promise.all([
        financialAPI.getExpensesByCategory(selectedPeriod),
        financialAPI.getExpensesList({ limit: 50 }),
      ]);

      setExpenseData(categoryRes?.data ?? null);
      setExpenseList(listRes?.data?.data ?? []);
      setTotalExpensesAllTime(listRes?.data?.total_cost ?? 0);
    } catch (error: any) {
      console.error("Expense fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-rose-400 mx-auto mb-4" />
          <p className="text-slate-400">Đang tải dữ liệu chi phí bảo trì...</p>
        </div>
      </div>
    );
  }

  const pieChartData = (expenseData?.breakdown || [])
    .filter(item => item.total > 0)
    .map(item => ({
      name: item.name,
      value: item.total,
      count: item.count,
    }));

  const barChartData = (expenseData?.breakdown || []).map(item => ({
    name: item.name,
    "Chi phí": item.total,
    "Số lượt": item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Tổng chi bảo trì (Kỳ {selectedPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(expenseData?.total_expense || 0)}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {expenseData?.total_requests || 0} yêu cầu sửa chữa đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Hạng mục tốn kém nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {expenseData?.breakdown?.[0]?.name || "Chưa có"}
            </div>
            <p className="text-xs opacity-80 mt-1">
              {formatCurrency(expenseData?.breakdown?.[0]?.total || 0)} ({expenseData?.breakdown?.[0]?.percentage || 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Tổng chi tích lũy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totalExpensesAllTime)}
            </div>
            <p className="text-xs opacity-80 mt-1">
              Toàn bộ các đợt bảo trì từ trước đến nay
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-rose-400" />
            <span className="text-sm font-medium text-slate-300">Chọn kỳ phân tích chi phí:</span>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Làm mới
          </Button>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Structure */}
        <Card className="bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Cơ cấu chi phí theo danh mục sự cố
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Kỳ {selectedPeriod} không có chi phí bảo trì
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar Chart: Breakdown */}
        <Card className="bg-slate-800 border-slate-700 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Chi phí theo từng loại bảo trì
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="Chi phí" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detail Table */}
      <Card className="bg-slate-800 border-slate-700 text-slate-100">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Danh sách các đợt sửa chữa & bảo trì</span>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {expenseList.length} hạng mục
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/60 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Vị trí / Căn hộ</th>
                  <th className="px-4 py-3">Hạng mục sự cố</th>
                  <th className="px-4 py-3">Phân loại</th>
                  <th className="px-4 py-3 text-right">Chi phí</th>
                  <th className="px-4 py-3 text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Ngày hoàn thành</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {expenseList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Chưa có dữ liệu sửa chữa
                    </td>
                  </tr>
                ) : (
                  expenseList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {item.apt_id ? `Phòng ${item.apt_id}` : "Khu vực chung"}
                      </td>
                      <td className="px-4 py-3">{item.issue_description}</td>
                      <td className="px-4 py-3">
                        <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                          {item.category_name || "Sửa chữa khác"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-400">
                        {formatCurrency(item.cost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={item.status === 'completed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500" : "bg-amber-500/20 text-amber-400 border-amber-500"}>
                          {item.status === 'completed' ? 'Đã hoàn thành' : 'Đang xử lý'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        {item.completed_at ? format(new Date(item.completed_at), "dd/MM/yyyy") : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

