"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { PeriodComparison } from "@/lib/financialApi";

interface ComparisonCardProps {
  data: PeriodComparison;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export default function ComparisonCard({ data }: ComparisonCardProps) {
  const { period1, period2, comparison } = data;

  const renderTrend = (change: number, changePercent: string) => {
    if (change > 0) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold">+{changePercent}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <TrendingDown className="h-5 w-5" />
          <span className="font-semibold">{changePercent}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Minus className="h-5 w-5" />
        <span className="font-semibold">0%</span>
      </div>
    );
  };

  return (
    <Card className="bg-slate-800/90 border border-slate-700 shadow-xl">
      <CardHeader>
        <CardTitle className="text-slate-200 flex items-center gap-2">
          <span className="inline-block w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></span>
          So Sánh Tài Chính Giữa Các Kỳ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Kỳ 1 */}
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Kỳ 1</p>
              <p className="text-xl font-bold text-blue-400">{period1.period}</p>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Thu nhập</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(period1.total_income)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Phí phải thu</p>
                <p className="text-lg font-semibold text-orange-400">{formatCurrency(period1.total_charges)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Tỷ lệ thu</p>
                <p className="text-lg font-semibold text-blue-400">{period1.collection_rate}</p>
              </div>
            </div>
          </div>

          {/* Thay đổi */}
          <div className="flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-slate-300 mb-2 text-center font-medium">Thay đổi thu nhập</p>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-2xl font-bold text-slate-200">{formatCurrency(comparison.income_change)}</p>
                  {renderTrend(comparison.income_change, comparison.income_change_percent)}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-slate-300 mb-2 text-center font-medium">Thay đổi phí</p>
                <p className="text-xl font-bold text-slate-200 text-center">{formatCurrency(comparison.charges_change)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-slate-300 mb-2 text-center font-medium">Thay đổi nợ</p>
                <p className="text-xl font-bold text-slate-200 text-center">{formatCurrency(comparison.debt_change)}</p>
              </div>
            </div>
          </div>

          {/* Kỳ 2 */}
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Kỳ 2</p>
              <p className="text-xl font-bold text-purple-400">{period2.period}</p>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Thu nhập</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(period2.total_income)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Phí phải thu</p>
                <p className="text-lg font-semibold text-orange-400">{formatCurrency(period2.total_charges)}</p>
              </div>
              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Tỷ lệ thu</p>
                <p className="text-lg font-semibold text-blue-400">{period2.collection_rate}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
