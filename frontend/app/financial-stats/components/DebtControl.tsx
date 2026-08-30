"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/bills/components/ui/card";
import { Button } from "@/app/bills/components/ui/button";
import { Badge } from "@/app/bills/components/ui/badge";
import { Loader2, AlertCircle, Search, Filter, Eye } from "lucide-react";
import { financialAPI } from "@/lib/financialApi";
import type {
  UnpaidApartment,
  TotalOutstandingDebt,
  DebtPaymentHistory,
} from "@/lib/financialApi";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function DebtControl() {
  const [loading, setLoading] = useState(true);
  const [unpaidApartments, setUnpaidApartments] = useState<UnpaidApartment[]>([]);
  const [totalDebt, setTotalDebt] = useState<TotalOutstandingDebt | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [period, setPeriod] = useState("");
  const [floor, setFloor] = useState("");
  const [minDebt, setMinDebt] = useState("");
  const [maxDebt, setMaxDebt] = useState("");
  const [sortBy, setSortBy] = useState("debt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);

  // Modal for history
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [history, setHistory] = useState<DebtPaymentHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const filters = {
        period: period || undefined,
        floor: floor ? parseInt(floor) : undefined,
        min_debt: minDebt ? parseFloat(minDebt) : undefined,
        max_debt: maxDebt ? parseFloat(maxDebt) : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        offset,
        limit,
      };

      const [unpaidRes, totalDebtRes] = await Promise.all([
        financialAPI.getUnpaidApartments(filters),
        financialAPI.getTotalOutstandingDebt(),
      ]);

      setUnpaidApartments(unpaidRes?.data ?? []);
      setTotal(unpaidRes?.total ?? 0);
      setSummary(unpaidRes?.summary ?? null);
      setTotalDebt(totalDebtRes?.data ?? null);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (aptId: string) => {
    setHistoryLoading(true);
    try {
      const res = await financialAPI.getDebtPaymentHistory(aptId);
      setHistory(res?.data ?? null);
    } catch (error: any) {
      console.error("History fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [offset, sortBy, sortOrder]);

  const handleFilter = () => {
    setOffset(0);
    fetchData();
  };

  const handleViewHistory = (aptId: string) => {
    setSelectedApt(aptId);
    fetchHistory(aptId);
  };

  const getStatusBadge = (status: string) => {
    if (status === "Đã thanh toán") return <Badge className="bg-green-500">Đã thanh toán</Badge>;
    if (status === "Thanh toán một phần") return <Badge className="bg-yellow-500">Thanh toán một phần</Badge>;
    return <Badge className="bg-red-500">Chưa thanh toán</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 3.2.2 Tổng nợ dư kiện */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-l-4 border-red-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Tổng nợ dư kiện</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt?.total_outstanding_debt ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-orange-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Nợ cũ (Pre-debt)</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalDebt?.total_pre_debt ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-purple-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Căn hộ có nợ</div>
            <div className="text-2xl font-bold text-purple-600">
              {totalDebt?.apartments_with_debt ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Nợ hiện tại (từ filters)</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(summary?.total_unpaid_amount ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3.2.1 Lọc căn hộ chưa đóng phí */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            3.2.1 Bộ lọc căn hộ chưa đóng phí
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Kỳ</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Tất cả"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tầng</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Tất cả"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nợ tối thiểu</label>
              <input
                type="number"
                value={minDebt}
                onChange={(e) => setMinDebt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nợ tối đa</label>
              <input
                type="number"
                value={maxDebt}
                onChange={(e) => setMaxDebt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Không giới hạn"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFilter} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách căn hộ nợ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Danh sách căn hộ chưa thanh toán
            </span>
            <span className="text-sm font-normal text-gray-600">
              {summary?.total_unpaid_apartments ?? 0} căn hộ
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Căn hộ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Chủ hộ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kỳ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                          onClick={() => {
                            setSortBy("debt");
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                          }}>
                        Tổng hóa đơn {sortBy === "debt" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Đã trả
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Còn nợ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Nợ cũ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {unpaidApartments.map((apt) => (
                      <tr key={`${apt.apt_id}-${apt.period}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold">{apt.apt_id}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>{apt.owner_name}</div>
                          <div className="text-xs text-gray-500">Tầng {apt.floor}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{apt.period}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">
                          {formatCurrency(apt.total_bill)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {formatCurrency(apt.paid_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 font-bold">
                          {formatCurrency(apt.unpaid_amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-600">
                          {formatCurrency(apt.pre_debt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {getStatusBadge(apt.payment_status)}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(apt.apt_id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {offset + 1} - {Math.min(offset + limit, total)} / {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 3.2.3 Modal lịch sử trả nợ */}
      {selectedApt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <CardTitle>Lịch sử trả nợ - Căn hộ {selectedApt}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pt-6">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : history ? (
                <>
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-lg">
                    <div className="text-sm opacity-90">Nợ hiện tại</div>
                    <div className="text-3xl font-bold">
                      {formatCurrency(history.current_debt)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {history.history.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-lg font-bold">{item.period}</div>
                          {getStatusBadge(item.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">Hóa đơn</div>
                            <div className="font-semibold">{formatCurrency(item.billed)}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Nợ cũ</div>
                            <div className="font-semibold text-orange-600">
                              {formatCurrency(item.pre_debt)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Đã trả</div>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(item.paid)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Số dư</div>
                            <div className="font-semibold text-red-600">
                              {formatCurrency(item.balance)}
                            </div>
                          </div>
                        </div>

                        {item.payments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-medium text-gray-600 mb-2">
                              Chi tiết thanh toán ({item.payment_count} lần)
                            </div>
                            <div className="space-y-1">
                              {item.payments.map((payment: any, pIdx: number) => (
                                <div
                                  key={pIdx}
                                  className="text-xs flex items-center justify-between"
                                >
                                  <span>
                                    {payment.paid_at
                                      ? format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm")
                                      : "N/A"}{" "}
                                    - {payment.method || "N/A"}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    {formatCurrency(payment.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">Không có dữ liệu</div>
              )}
            </CardContent>
            <div className="border-t p-4 flex justify-end">
              <Button onClick={() => setSelectedApt(null)}>Đóng</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Nợ theo kỳ */}
      {totalDebt && totalDebt.debt_by_period.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nợ theo từng kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {totalDebt.debt_by_period.slice(0, 12).map((item) => (
                <div key={item.period} className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-sm text-gray-600 mb-1">{item.period}</div>
                  <div className="text-xl font-bold text-red-600">
                    {formatCurrency(item.total_debt)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.apartment_count} căn hộ
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
