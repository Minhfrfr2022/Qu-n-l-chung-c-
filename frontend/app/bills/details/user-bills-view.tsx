"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Receipt, AlertCircle } from "lucide-react"
import { BillDetailDialog } from "./bill-detail-dialog"
import type { Bill } from "../types";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import BackButton from "../../../components/BackButton";
import SubmitBillsModal from "../../../components/SubmitBillsModal";
import { billsAPI } from '@/lib/api';
import { ApiCall } from "@/app/helper/api"
import { useAuth } from "@/contexts/AuthContext";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

const getCurrentDate = () => {
  const date = new Date()
  return `25/${date.getMonth() + 1}/${date.getFullYear()}`
}

export function UserBillsView() {
  const api = new ApiCall();
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const [currentBills, setCurrentBill] = useState<Bill[]>([]);
  const [isLoadingBills, setLoadingBills] = useState(true);
  const [errorFetchBill, setErrorFetchBills] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);

  const itemsPerPage = 10;

  const fetchAllBills = async() => {
    setLoadingBills(true);
    setErrorFetchBills(null);
    try {
      const aptNumber = user?.apartmentNumber || (user as any)?.apartment_number || "";
      const filter: any = {};
      
      if (aptNumber) {
        filter.apt_id = aptNumber;
      } else if (user?.fullName) {
        filter.owner = user.fullName;
      } else if (user?.username) {
        filter.owner = user.username;
      }

      if (filterPeriod) {
        filter.period = filterPeriod;
      }

      const res = await api.query_bill_with_filter(filter, currentPage, itemsPerPage);
      const bills = res.data || [];
      let total = 0;
      for(const bill of bills) {
        if (!bill.paid && bill.status !== 'paid') {
          total += (bill.total_due || (bill.electric + bill.water + bill.pre_debt + bill.vehicles + bill.service));
        }
      }
      setTotalDebt(total);
      setCurrentBill(bills);
      setTotalPages(res.total_pages || 1);
    }
    catch(error: any) {
      setErrorFetchBills(error?.message || "Lỗi tải hóa đơn");
      console.log("Fetch error: ", error);
    } finally {
      setLoadingBills(false);
    }
  }

  // Load available periods from configurations and default to the latest period
  useEffect(() => {
    (async () => {
      try {
        const resp = await billsAPI.getAvailablePeriods();
        const periods = resp?.periods || [];
        setAvailablePeriods(periods);
        if (periods.length > 0 && !filterPeriod) {
          setFilterPeriod(periods[0]);
        }
      } catch (e) {
        console.error('Failed to load periods', e);
      }
    })();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllBills();
    }
  }, [user, currentPage, filterPeriod]);

  const handleViewDetail = (bill: Bill) => {
    setSelectedBill(bill)
    setIsDetailOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="ml-4 lg:ml-72 p-6 relative z-30 text-slate-100">
        <Header />
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Back Button & Action Bar */}
          <div className="flex items-center justify-between">
            <BackButton />
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white rounded-xl transition font-semibold shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <span>🚰</span> Gửi số liệu tiêu thụ
            </button>
          </div>

          <SubmitBillsModal 
            isOpen={showSubmitModal} 
            onClose={() => setShowSubmitModal(false)} 
            period={filterPeriod} 
            onSubmitted={fetchAllBills} 
          />

          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-300">Kỳ thanh toán:</label>
                <select
                  value={filterPeriod ?? ''}
                  onChange={(e) => { setFilterPeriod(e.target.value || null); setCurrentPage(1); }}
                  className="px-3 py-2 border border-slate-700 rounded-xl text-white bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                >
                  <option value="">-- Tất cả các kỳ --</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>Kỳ {p}</option>
                  ))}
                </select>
                {filterPeriod && (
                  <button 
                    className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition" 
                    onClick={() => setFilterPeriod(null)}
                  >
                    Xem tất cả
                  </button>
                )}
              </div>

              {user?.apartmentNumber && (
                <div className="text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
                  Căn hộ: <span className="font-semibold text-white">{user.apartmentNumber}</span> ({user.fullName || user.username})
                </div>
              )}
            </div>

            {/* Overview Card */}
            <div className="grid gap-6 md:grid-cols-1">
              <Card className="border-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-xl rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Receipt className="h-5 w-5 text-blue-200" />
                    Tổng tiền cần thanh toán {filterPeriod ? `(Kỳ ${filterPeriod})` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold tracking-tight">{formatCurrency(totalDebt)}</div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-blue-200">
                    <AlertCircle className="h-4 w-4 text-yellow-300" />
                    {totalDebt > 0 ? "Vui lòng thanh toán trước ngày 25 hàng tháng để tránh phí phạt trễ hạn." : "Bạn không có hóa đơn nào chưa thanh toán."}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bills Table */}
            <Card className="border border-slate-800 bg-slate-900/80 rounded-2xl shadow-xl backdrop-blur-md">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-slate-100 text-lg font-bold flex items-center justify-between">
                  <span>Danh sách hóa đơn của căn hộ {user?.apartmentNumber || ''}</span>
                  <span className="text-xs font-normal text-slate-400">Tổng: {currentBills.length} hóa đơn</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoadingBills ? (
                  <div className="py-12 text-center text-slate-400">Đang tải dữ liệu hóa đơn...</div>
                ) : currentBills.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-base font-semibold text-slate-300">Chưa có hóa đơn nào cho kỳ này</p>
                    <p className="text-xs text-slate-500">Bạn có thể bấm "Gửi số liệu tiêu thụ" ở trên để ghi nhận số điện, nước tháng này.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-800 bg-slate-950/40">
                        <TableHead className="font-semibold text-slate-300">Căn hộ</TableHead>
                        <TableHead className="font-semibold text-slate-300">Chủ hộ</TableHead>
                        <TableHead className="font-semibold text-slate-300">Kỳ thanh toán</TableHead>
                        <TableHead className="font-semibold text-slate-300 text-center">Trạng thái</TableHead>
                        <TableHead className="text-right font-semibold text-slate-300">Tổng số tiền</TableHead>
                        <TableHead className="text-center font-semibold text-slate-300">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentBills.map((bill) => {
                        const isPaid = bill.paid || bill.status === 'paid';
                        const billTotal = bill.total_due || (bill.water + bill.electric + bill.pre_debt + bill.service + bill.vehicles);
                        return (
                          <TableRow key={`${bill.apt_id}-${bill.period || 'none'}`} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                            <TableCell className="font-bold text-slate-100">{bill.apt_id}</TableCell>
                            <TableCell className="text-slate-300">{bill.owner}</TableCell>
                            <TableCell className="text-slate-300 text-sm font-medium">{bill.period ?? '-'}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isPaid 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {isPaid ? '✓ Đã thanh toán' : '⏳ Chưa thanh toán'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-100">
                              {formatCurrency(billTotal)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDetail(bill)}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs rounded-lg"
                              >
                                Xem chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="text-xs text-slate-400">
                      Trang {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="bg-slate-800 text-slate-300 border-slate-700 text-xs"
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-slate-800 text-slate-300 border-slate-700 text-xs"
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bill Detail Dialog */}
            <BillDetailDialog bill={selectedBill} isOpen={isDetailOpen} onOpenChange={setIsDetailOpen} viewMode="user" />
          </div>
        </div>
      </div>
    </div>
  )
}
