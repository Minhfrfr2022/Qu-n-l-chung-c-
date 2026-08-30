"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { FileText, Receipt, Search, Bell, Download, Filter as FilterIcon, TrendingUp } from "lucide-react"
import { BillDetailDialog } from "./bill-detail-dialog"
import { EditBillDialog } from "./edit-bill-dialog"
import type { Bill, PaymentStats, BillAnalytics } from "../types"
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import BackButton from "../../../components/BackButton";
import SubmitBillsModal from "../../../components/SubmitBillsModal";
import { billsAPI } from '@/lib/api';
import { Input } from "../components/ui/input";
import { ApiCall } from "@/app/helper/api";
import { BillStatsCards } from "../components/BillStatsCards";
import { BillAnalyticsChart } from "../components/BillAnalyticsChart";
import { QuickActionsDialog } from "../components/QuickActionsDialog";
import { Badge } from "../components/ui/badge";
import { billsEnhancedAPI } from "@/lib/billsEnhancedApi";
import { supabase } from "@/lib/supabase";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Mock data
const mockAdminBills: Bill[] = Array.from({ length: 25 }, (_, i) => ({
  apt_id: `A${String(i + 101).padStart(3, "0")}`,
  owner: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
  electric: Math.floor(Math.random() * 1000000) + 500000,
  water: Math.floor(Math.random() * 200000) + 100000,
  service: 500000,
  vehicles: Math.floor(Math.random() * 400000) + 200000,
  pre_debt: Math.floor(Math.random() * 1000000),
  total: 0,
})).map((bill) => ({
  ...bill,
  currentTotal: bill.electric + bill.water + bill.service + bill.vehicles,
}))

export function AdminBillsView() {
  const api = new ApiCall();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1)
  const [currentBills, setCurrentBills] = useState<Bill[]>([]);
  const [isLoadingBills, setLoadingBills] = useState(true);
  const [errorFetchBill, setErrorFetchBills] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const [totalToCollect, setTotalToCollect] = useState(0);
  const [totalCollected, setTotalCollected] = useState(0);

  const [searchApartment, setSearchApartment] = useState("");
  const [searchOwner, setSearchOwner] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  // Analytics state
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [billAnalytics, setBillAnalytics] = useState<BillAnalytics[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  const filteredBills = mockAdminBills.filter((bill) => {
    const matchApartment = bill.apt_id.toLowerCase().includes(searchApartment.toLowerCase())
    const matchOwner = bill.owner.toLowerCase().includes(searchOwner.toLowerCase())
    return matchApartment && matchOwner
  })

  const itemsPerPage = 10;

  const fetchBills = async() => {
    let filter: any = {};
    if(searchApartment) filter.apt_id = searchApartment;
    if(searchOwner) filter.owner = searchOwner;
    if(filterPeriod) filter.period = filterPeriod;
    if(filterStatus && filterStatus !== 'all') filter.status = filterStatus;

    setLoadingBills(true);
    setErrorFetchBills(null);
    try {
      const res = await api.query_bill_with_filter(filter, currentPage, itemsPerPage);
      const bills = res.data;

      // Calculate totals from bills data
      let totalDue = 0;  // Tổng cần thu (chưa thu)
      let totalPaid = 0; // Tổng đã thu

      for(const bill of bills) {
        const billTotal = Number(bill.electric || 0) + Number(bill.water || 0) +
                         Number(bill.pre_debt || 0) + Number(bill.vehicles || 0) +
                         Number(bill.service || 0);

        if (bill.paid) {
          totalPaid += billTotal;
        } else {
          totalDue += billTotal;
        }
      }

      setTotalToCollect(totalDue);
      setTotalCollected(totalPaid);

      // If period is selected, try to get more accurate totals from backend
      if (filterPeriod) {
        try {
          const summary = await billsAPI.getPeriodSummary(filterPeriod);
          if (summary.total_due !== undefined) setTotalToCollect(Number(summary.total_due || 0));
          if (summary.total_received !== undefined) setTotalCollected(Number(summary.total_received || 0));
        } catch (e) {
          console.warn('Failed to fetch period summary, using calculated totals', e);
        }
      }

      setCurrentBills(bills);
      setTotalPages(res.total_pages);
    }
    catch(error) {
      setErrorFetchBills(error.message);
      console.log("Fetch error: ", error.message);
    } finally {
      setLoadingBills(false);
    }
  }

  const fetchAnalytics = async() => {
    setLoadingStats(true);
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      // Fetch payment stats
      const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/bills/payment-stats${filterPeriod ? `?period=${filterPeriod}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setPaymentStats(statsData.data);
      }

      // Fetch analytics data
      const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/bills/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const analyticsData = await analyticsResponse.json();
      if (analyticsData.success) {
        setBillAnalytics(analyticsData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingStats(false);
    }
  };



  useEffect(() => {
    fetchBills();
  }, [currentPage, totalPages, searchApartment, searchOwner, totalCollected, totalToCollect, filterPeriod, filterStatus]);

  useEffect(() => {
    if (showAnalytics) {
      fetchAnalytics();
    }
  }, [showAnalytics, filterPeriod]);

  // load available periods
  useEffect(() => {
    (async () => {
      try {
        const resp = await billsAPI.getAvailablePeriods();
        const periods = resp?.periods || [];
        setAvailablePeriods(periods);
      } catch (e) {
        console.error('Failed to load periods', e);
      }
    })();
  }, []);

  const handleViewDetail = (bill: Bill) => {
    setSelectedBill(bill)
    setIsDetailOpen(true)
  }

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill)
    setIsEditOpen(true)
  }

  const handleResetBill = async(bill: Bill) => {
    try {
      // Mark bill as paid (backend records payment and updates totals)
      await api.reset_bill(bill.apt_id, bill.period);
      // Refresh list and aggregates
      await fetchBills();
    }
    catch(error) {
      console.log(error.message);
    }

    alert(`Đã đánh dấu là 'Đã thu' cho căn hộ ${bill.apt_id} (kỳ ${bill.period || '-'})`)
  }

  const handleSaveEdit = async(updatedBill: Bill) => {
    try {

      const new_value: any = {};
      console.log(updatedBill.apt_id);
      if(updatedBill.water) new_value.water = updatedBill.water;
      if(updatedBill.electric) new_value.electric = updatedBill.electric;
      if(updatedBill.service) new_value.service = updatedBill.service;
      if(updatedBill.vehicles) new_value.vehicles = updatedBill.vehicles;
      if(updatedBill.pre_debt) new_value.pre_debt = updatedBill.pre_debt;
      console.log("new value: ", new_value);

      const res = await api.update_bill(updatedBill.apt_id, new_value);
      await fetchBills();
      setSelectedBill(updatedBill)
      setIsEditOpen(false)
      setIsDetailOpen(true)
    }
    catch(error) {
      console.log("Edit error: ", error.message);
    }
  }

  // Quick Actions Handlers
  const handleMarkPaid = async (aptId: string, period: string, paymentMethod: string) => {
    try {
      await billsEnhancedAPI.markBillAsPaid(aptId, period, paymentMethod);
      await fetchBills();
      if (showAnalytics) await fetchAnalytics();
    } catch (error) {
      console.error('Failed to mark bill as paid:', error);
      throw error;
    }
  };

  const handleAddLateFee = async (aptId: string, period: string, lateFee: number) => {
    try {
      await billsEnhancedAPI.addLateFee(aptId, period, lateFee);
      await fetchBills();
    } catch (error) {
      console.error('Failed to add late fee:', error);
      throw error;
    }
  };

  const handleApplyDiscount = async (aptId: string, period: string, discount: number) => {
    try {
      await billsEnhancedAPI.applyDiscount(aptId, period, discount);
      await fetchBills();
    } catch (error) {
      console.error('Failed to apply discount:', error);
      throw error;
    }
  };

  const handleSendReminder = async (aptId: string, period: string) => {
    try {
      await billsEnhancedAPI.sendReminder(aptId, period);
      await fetchBills();
    } catch (error) {
      console.error('Failed to send reminder:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="ml-4 lg:ml-72 p-6 relative z-30 text-slate-100">
        <Header />
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <BackButton />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAnalytics(!showAnalytics)}
                variant="outline"
                className="gap-2 border-gray-300 hover:bg-gray-50"
              >
                <TrendingUp className="h-4 w-4" />
                {showAnalytics ? 'Ẩn thống kê' : 'Xem thống kê'}
              </Button>
              <a
                href="/admin/bills-setup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 shadow-md"
              >
                ⚙️ Cấu hình giá dịch vụ
              </a>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold flex items-center gap-2 shadow-md"
              >
                🚰 Gửi số liệu
              </button>
            </div>
            <SubmitBillsModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} period={filterPeriod} onSubmitted={fetchBills} />
          </div>

          {/* Analytics Section */}
          {showAnalytics && (
            <div className="space-y-6">
              <BillStatsCards stats={paymentStats} loading={loadingStats} />
              {billAnalytics.length > 0 && <BillAnalyticsChart data={billAnalytics} />}
            </div>
          )}

          <div className="space-y-6">

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <FileText className="h-5 w-5" />
              Tổng cần thu kỳ này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(totalToCollect)}</div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <Receipt className="h-5 w-5" />
              Tổng đã thu kỳ này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card className="border-0 bg-white/5 dark:bg-slate-800 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-md">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-xl">Danh sách hóa đơn các căn hộ</CardTitle>
              </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <Input
                placeholder="Tìm kiếm theo căn hộ..."
                value={searchApartment}
                onChange={(e) => {
                  setSearchApartment(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 text-gray-600"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              <Input
                placeholder="Tìm kiếm theo chủ sở hữu..."
                value={searchOwner}
                onChange={(e) => {
                  setSearchOwner(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 text-gray-600"
              />
            </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Chọn kỳ:</label>
                <select
                  value={filterPeriod ?? ''}
                  onChange={(e) => { setFilterPeriod(e.target.value || null); setCurrentPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded text-gray-900"
                >
                  <option value="">-- Chọn kỳ --</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {filterPeriod && (
                  <button className="ml-2 px-3 py-2 text-sm bg-gray-200 rounded" onClick={() => setFilterPeriod(null)}>
                    Xóa
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-600" />
                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-2 border border-gray-300 rounded text-gray-900"
                >
                  <option value="all">Tất cả</option>
                  <option value="paid">Đã thu</option>
                  <option value="unpaid">Chưa thu</option>
                  <option value="overdue">Quá hạn</option>
                </select>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 bg-gray-50/40 dark:bg-gray-700">
                  <TableHead className="font-semibold text-slate-300">Căn hộ</TableHead>
                  <TableHead className="font-semibold text-slate-300">Chủ sở hữu</TableHead>
                  <TableHead className="font-semibold text-slate-300">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-slate-300">Kỳ</TableHead>
                  <TableHead className="font-semibold text-slate-300">Hạn thanh toán</TableHead>
                  <TableHead className="text-right font-semibold text-slate-300">Tổng số tiền</TableHead>
                  <TableHead className="text-center font-semibold text-slate-300">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentBills.map((bill) => {
                const isOverdue = bill.due_date && new Date(bill.due_date) < new Date() && !bill.paid;
                const statusBadge = bill.paid ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Đã thu</Badge>
                ) : isOverdue ? (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Quá hạn</Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Chưa thu</Badge>
                );

                return (
                  <TableRow key={`${bill.apt_id}-${bill.period || 'none'}`} className="border-b border-gray-700 bg-transparent hover:bg-slate-700/40 transition-colors">
                    <TableCell className="font-medium text-slate-100">{bill.apt_id}</TableCell>
                    <TableCell className="text-slate-200">{bill.owner}</TableCell>
                    <TableCell>{statusBadge}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{bill.period ?? '-'}</TableCell>
                    <TableCell className="text-slate-300 text-sm">
                      {bill.due_date ? new Date(bill.due_date).toLocaleDateString('vi-VN') : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-100">
                      {formatCurrency(bill.electric + bill.pre_debt + bill.water + bill.service + bill.vehicles)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetail(bill)}>
                          Xem chi tiết
                        </Button>
                        {!bill.paid && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedBill(bill);
                              setIsQuickActionsOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Hành động
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill Detail Dialog */}
      <BillDetailDialog
        bill={selectedBill}
        isOpen={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        viewMode="admin"
        onEdit={handleEditBill}
        onReset={handleResetBill}
      />

      {/* Edit Bill Dialog */}
      <EditBillDialog
        bill={selectedBill}
        isOpen={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open)
          if (!open) setIsDetailOpen(true)
        }}
        onSave={handleSaveEdit}
      />

      {/* Quick Actions Dialog */}
      <QuickActionsDialog
        isOpen={isQuickActionsOpen}
        onOpenChange={setIsQuickActionsOpen}
        bill={selectedBill}
        onMarkPaid={handleMarkPaid}
        onAddLateFee={handleAddLateFee}
        onApplyDiscount={handleApplyDiscount}
        onSendReminder={handleSendReminder}
      />
    </div>
          </div>
      </div>
    </div>
  )
}
