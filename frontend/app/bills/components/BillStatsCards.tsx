"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import type { PaymentStats } from "../types";

interface BillStatsCardsProps {
  stats: PaymentStats | null;
  loading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export function BillStatsCards({ stats, loading }: BillStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <DollarSign className="h-5 w-5" />
            Tổng hóa đơn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_bills}</div>
          <p className="text-sm opacity-90 mt-2">
            {formatCurrency(stats.total_amount)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <CheckCircle2 className="h-5 w-5" />
            Đã thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.paid_bills}</div>
          <p className="text-sm opacity-90 mt-2">
            {formatCurrency(stats.paid_amount)}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">{stats.payment_rate.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <Clock className="h-5 w-5" />
            Chưa thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.unpaid_bills}</div>
          <p className="text-sm opacity-90 mt-2">
            {formatCurrency(stats.unpaid_amount)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-medium">
            <AlertCircle className="h-5 w-5" />
            Quá hạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.overdue_bills}</div>
          <p className="text-sm opacity-90 mt-2">
            {formatCurrency(stats.overdue_amount)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
