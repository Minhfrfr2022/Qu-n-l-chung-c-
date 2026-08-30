"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/bills/components/ui/card";
import { Button } from "@/app/bills/components/ui/button";
import { Loader2, TrendingUp, DollarSign, Filter, Calendar } from "lucide-react";
import { financialAPI } from "@/lib/financialApi";
import type {
  RevenueGrowth,
  RevenueByFeeType,
  RevenueByFloorOrArea,
} from "@/lib/financialApi";
import { format, subMonths } from "date-fns";
import {
  LineChart,
  Line,
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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function RevenueManagement() {
  const [loading, setLoading] = useState(true);
  const [growthData, setGrowthData] = useState<RevenueGrowth[]>([]);
  const [feeTypeData, setFeeTypeData] = useState<RevenueByFeeType | null>(null);
  const [floorAreaData, setFloorAreaData] = useState<RevenueByFloorOrArea | null>(null);

  const currentDate = new Date();
  const [startPeriod, setStartPeriod] = useState(format(subMonths(currentDate, 11), "yyyy-MM"));
  const [endPeriod, setEndPeriod] = useState(format(currentDate, "yyyy-MM"));
  const [selectedPeriod, setSelectedPeriod] = useState(format(currentDate, "yyyy-MM"));
  const [groupBy, setGroupBy] = useState<"floor" | "area">("floor");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [growthRes, feeTypeRes, floorAreaRes] = await Promise.all([
        financialAPI.getRevenueGrowth(startPeriod, endPeriod),
        financialAPI.getRevenueByFeeType(selectedPeriod),
        financialAPI.getRevenueByFloorOrArea(selectedPeriod, groupBy),
      ]);

      setGrowthData(growthRes?.data ?? []);
      setFeeTypeData(feeTypeRes?.data ?? null);
      setFloorAreaData(floorAreaRes?.data ?? null);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startPeriod, endPeriod, selectedPeriod, groupBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const pieChartData = feeTypeData?.breakdown.map((item) => ({
    name: item.name,
    value: item.total,
    percentage: item.percentage,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-slate-800/90 border border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-slate-200 flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Từ tháng</label>
              <input
                type="month"
                value={startPeriod}
                onChange={(e) => setStartPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Đến tháng</label>
              <input
                type="month"
                value={endPeriod}
                onChange={(e) => setEndPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tháng phân tích</label>
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3.1.1 Biểu đồ tăng trưởng */}
      <Card className="bg-white border border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            3.1.1 Biểu đồ tăng trưởng doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: any, name: string) => {
                  if (name === "Doanh thu") return formatCurrency(value);
                  return `${value}%`;
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_income"
                name="Doanh thu"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="growth_rate"
                name="Tốc độ tăng trưởng (%)"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-gray-600">Doanh thu trung bình</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(
                  growthData.reduce((sum, d) => sum + d.total_income, 0) / (growthData.length || 1)
                )}
              </div>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-gray-600">Tăng trưởng trung bình</div>
              <div className="text-xl font-bold text-green-600">
                {(
                  growthData.reduce((sum, d) => sum + Number(d.growth_rate), 0) /
                  (growthData.length || 1)
                ).toFixed(2)}
                %
              </div>
            </div>
            <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-gray-600">Tổng doanh thu</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(growthData.reduce((sum, d) => sum + d.total_income, 0))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3.1.2 Doanh thu theo loại phí */}
      <Card className="bg-white border border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            3.1.2 Doanh thu theo loại phí ({selectedPeriod})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div>
              <div className="space-y-3">
                {feeTypeData?.breakdown.map((item, index) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-600">
                          {item.apartment_count} căn hộ
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(item.total)}</div>
                      <div className="text-sm text-gray-600">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                <div className="text-sm opacity-90">Tổng doanh thu</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(feeTypeData?.total_revenue ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3.1.3 Phân tích theo tầng/khu */}
      <Card className="bg-white border border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-indigo-600" />
            3.1.3 Phân tích doanh thu theo {groupBy === "floor" ? "tầng" : "khu"}
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant={groupBy === "floor" ? "default" : "outline"}
              onClick={() => setGroupBy("floor")}
            >
              Theo tầng
            </Button>
            <Button
              size="sm"
              variant={groupBy === "area" ? "default" : "outline"}
              onClick={() => setGroupBy("area")}
            >
              Theo khu
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={floorAreaData?.groups || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="electric" name="Điện" fill="#3b82f6" stackId="a" />
              <Bar dataKey="water" name="Nước" fill="#10b981" stackId="a" />
              <Bar dataKey="service" name="Dịch vụ" fill="#f59e0b" stackId="a" />
              <Bar dataKey="vehicles" name="Xe" fill="#ef4444" stackId="a" />
            </BarChart>
          </ResponsiveContainer>

          {/* Detail Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {groupBy === "floor" ? "Tầng" : "Khu"}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Tổng doanh thu
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    % Tổng
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Số căn hộ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    TB/căn hộ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {floorAreaData?.groups.map((group) => (
                  <tr key={group.group} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{group.group}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {formatCurrency(group.total_revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{group.percentage}%</td>
                    <td className="px-4 py-3 text-sm text-right">{group.apartment_count}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(Number(group.average_per_apartment))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchData} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tải...
            </>
          ) : (
            "Làm mới dữ liệu"
          )}
        </Button>
      </div>
    </div>
  );
}
