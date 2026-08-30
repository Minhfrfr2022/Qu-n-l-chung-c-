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

  const itemsPerPage = 10


  const fetchAllBills = async() => {
    setLoadingBills(true);
    setErrorFetchBills(null);
    try {
      let res: any;
      if (filterPeriod) {
        const filter = { owner: user?.username, period: filterPeriod };
        res = await api.query_bill_with_filter(filter, currentPage, itemsPerPage);
      } else {
        // don't load bills if no period selected
        return setCurrentBill([]), setTotalPages(0), setTotalDebt(0);
      }
      const bills = res.data;
      let total = 0;
      for(const bill of bills) {
        total = total + bill.electric + bill.water + bill.pre_debt + bill.vehicles + bill.service;
      }
      setTotalDebt(total);
      setCurrentBill(bills);
      setTotalPages(res.total_pages);
    }
    catch(error) {
      setErrorFetchBills(error.message);
      console.log("Fetch error: ", error);
    } finally {
      setLoadingBills(false);
    }
  }

  useEffect(() => {
    fetchAllBills();
  },[user, currentPage, totalPages, totalDebt, filterPeriod])

  // load available periods from configurations
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="ml-4 lg:ml-72 p-6 relative z-30 text-slate-100">
        <Header />
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Back Button */}
          <div className="flex items-center justify-between">
            <BackButton />
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              🚰 Gửi số liệu
            </button>
          </div>
          <SubmitBillsModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} period={filterPeriod} onSubmitted={fetchAllBills} />

          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-slate-300 mr-2">Chọn kỳ:</label>
            <select
              value={filterPeriod ?? ''}
              onChange={(e) => { setFilterPeriod(e.target.value || null); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded text-gray-900 dark:text-white dark:bg-gray-700"
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

      {/* Overview Card */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Tổng nợ kỳ này
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{formatCurrency(totalDebt)}</div>
            <p className="mt-2 flex items-center gap-1 text-sm text-blue-100">
              <AlertCircle className="h-4 w-4" />
              Hóa đơn được tính đến ngày {getCurrentDate()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bills Table */}
      <Card className="border border-gray-700 bg-white/5 dark:bg-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-white">Danh sách hóa đơn của bạn</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 bg-gray-50/40 dark:bg-gray-700">
                  <TableHead className="font-semibold text-slate-300">Căn hộ</TableHead>
                  <TableHead className="font-semibold text-slate-300">Chủ sở hữu</TableHead>
                  <TableHead className="font-semibold text-slate-300">Kỳ</TableHead>
                  <TableHead className="text-right font-semibold text-slate-300">Tổng số tiền</TableHead>
                  <TableHead className="text-center font-semibold text-slate-300">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentBills.map((bill) => (
                <TableRow key={`${bill.apt_id}-${bill.period || 'none'}`} className="border-b border-gray-700 bg-transparent hover:bg-slate-700/40 transition-colors">
                    <TableCell className="font-medium text-slate-100">{bill.apt_id}</TableCell>
                    <TableCell className="text-slate-200">{bill.owner}</TableCell>
                    <TableCell className="text-slate-300 text-sm">{bill.period ?? '-'}</TableCell>
                    <TableCell className="text-right font-semibold text-slate-100">
                      {formatCurrency(bill.water + bill.electric + bill.pre_debt + bill.service + bill.vehicles)}
                    </TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetail(bill)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
      <BillDetailDialog bill={selectedBill} isOpen={isDetailOpen} onOpenChange={setIsDetailOpen} viewMode="user" />
    </div>
    </div>
    </div>
  </div>
  )
}
