"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { BarChart3, Loader2, DollarSign, TrendingUp, AlertCircle, Percent, RefreshCw, Download, Calendar, Filter } from "lucide-react";
import { financialAPI } from "@/lib/financialApi";
import type {
  IncomeByApartment,
  IncomeByFloor,
  FinancialByFloor,
  ApartmentFinancialSummary,
  BuildingFinancialSummary,
  IncomeByPeriod,
  FeeBreakdown,
  CollectionRate,
  PeriodComparison,
} from "@/lib/financialApi";
import IncomeChart from "./components/IncomeChart";
import CollectionRateChart from "./components/CollectionRateChart";
import FeeBreakdownChart from "./components/FeeBreakdownChart";
import ComparisonCard from "./components/ComparisonCard";
import { format, subMonths } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function FinancialPage() {
  const [incomeByApartment, setIncomeByApartment] = useState<IncomeByApartment[]>([]);
  const [incomeByFloor, setIncomeByFloor] = useState<IncomeByFloor[]>([]);
  const [financialByFloor, setFinancialByFloor] = useState<FinancialByFloor[]>([]);
  const [debtApartments, setDebtApartments] = useState<ApartmentFinancialSummary[]>([]);
  const [buildingSummary, setBuildingSummary] = useState<BuildingFinancialSummary | null>(null);
  const [incomeByPeriod, setIncomeByPeriod] = useState<IncomeByPeriod[]>([]);
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [collectionRate, setCollectionRate] = useState<CollectionRate[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date range for charts - initialize with memo to ensure stable values
  const currentDate = new Date();
  const defaultStartPeriod = format(subMonths(currentDate, 11), 'yyyy-MM');
  const defaultEndPeriod = format(currentDate, 'yyyy-MM');
  const defaultComparisonPeriod1 = format(subMonths(currentDate, 1), 'yyyy-MM');
  const defaultComparisonPeriod2 = format(currentDate, 'yyyy-MM');
  
  const [startPeriod, setStartPeriod] = useState(defaultStartPeriod);
  const [endPeriod, setEndPeriod] = useState(defaultEndPeriod);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultEndPeriod);
  
  // Comparison periods
  const [comparisonPeriod1, setComparisonPeriod1] = useState(defaultComparisonPeriod1);
  const [comparisonPeriod2, setComparisonPeriod2] = useState(defaultComparisonPeriod2);

  const fetchChartData = useCallback(async () => {
    try {
      const [incomeRes, feeRes, rateRes] = await Promise.all([
        financialAPI.getIncomeByPeriod(startPeriod, endPeriod),
        financialAPI.getFeeBreakdown(selectedPeriod),
        financialAPI.getCollectionRateByPeriod(startPeriod, endPeriod),
      ]);

      setIncomeByPeriod(incomeRes?.data ?? []);
      setFeeBreakdown(feeRes?.data ?? null);
      setCollectionRate(rateRes?.data ?? []);
    } catch (error: any) {
      console.error("Chart data fetch error:", error.message);
    }
  }, [startPeriod, endPeriod, selectedPeriod]);

  const fetchComparison = useCallback(async () => {
    if (!comparisonPeriod1 || !comparisonPeriod2) {
      console.warn('Comparison periods not set, skipping fetch');
      return;
    }
    
    // Validate period format
    const periodRegex = /^\d{4}-\d{2}$/;
    if (!periodRegex.test(comparisonPeriod1) || !periodRegex.test(comparisonPeriod2)) {
      console.error('Invalid period format. Expected YYYY-MM, got:', { comparisonPeriod1, comparisonPeriod2 });
      return;
    }
    
    try {
      console.log('Fetching comparison for periods:', comparisonPeriod1, comparisonPeriod2);
      const compRes = await financialAPI.comparePeriodsFinancial(comparisonPeriod1, comparisonPeriod2);
      setComparison(compRes?.data ?? null);
    } catch (error: any) {
      console.error("Comparison fetch error:", error.message);
      // Don't show alert to avoid interrupting user experience
    }
  }, [comparisonPeriod1, comparisonPeriod2]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [incomeApartmentRes, incomeFloorRes, financialFloorRes, debtRes, summaryRes] = await Promise.all([
        financialAPI.getIncomeByApartment({ page: 1, page_size: 100 }),
        financialAPI.getIncomeByFloor(),
        financialAPI.getFinancialByFloor(),
        financialAPI.getApartmentsInDebt({ page: 1, page_size: 100 }),
        financialAPI.getBuildingFinancialSummary(),
      ]);

      setIncomeByApartment(incomeApartmentRes?.data ?? []);
      setIncomeByFloor(incomeFloorRes?.data ?? []);
      setFinancialByFloor(financialFloorRes?.data ?? []);
      setDebtApartments(debtRes?.data ?? []);
      setBuildingSummary(summaryRes?.data ?? null);
      
      // Fetch new chart data
      await fetchChartData();
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Mã căn hộ', 'Chủ hộ', 'Tổng đã thanh toán'],
      ...incomeByApartment.map(item => [item.apt_id, item.owner_name || '-', item.total_paid])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `financial_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Initial load only
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 mr-4">
          <Header />
          <main className="p-6">
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Thống kê thu chi</h1>
                    <p className="text-slate-400 mt-1">Tài chính tòa nhà - Phân tích chi tiết</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={exportToCSV} variant="outline" className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button onClick={fetchAll} className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md text-white">
                    <RefreshCw className="h-4 w-4" />
                    Tải lại dữ liệu
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-green-400 mx-auto mb-4" />
                    <p className="text-slate-400">Đang tải dữ liệu...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary Cards */}
                  {buildingSummary && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg font-medium">
                            <DollarSign className="h-5 w-5" />
                            Tổng thu nhập
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatCurrency(buildingSummary.total_income)}</div>
                          <p className="text-sm opacity-90 mt-2">Từ trước đến nay</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg font-medium">
                            <TrendingUp className="h-5 w-5" />
                            Tổng phải thu
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatCurrency(buildingSummary.total_due_current)}</div>
                          <p className="text-sm opacity-90 mt-2">Kỳ hiện tại</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-0 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg font-medium">
                            <AlertCircle className="h-5 w-5" />
                            Tổng nợ
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{formatCurrency(buildingSummary.total_pre_debt)}</div>
                          <p className="text-sm opacity-90 mt-2">Nợ cũ mang sang</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg font-medium">
                            <Percent className="h-5 w-5" />
                            Tỷ lệ nợ
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{buildingSummary.debt_ratio}</div>
                          <p className="text-sm opacity-90 mt-2">
                            {buildingSummary.apartments_in_debt} / {buildingSummary.total_apartments} căn hộ
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Charts Section */}
                  <div className="space-y-6">
                    {/* Date Range Filter */}
                    <Card className="bg-slate-800/90 border border-slate-700 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-slate-400" />
                          Bộ lọc thời gian
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Từ tháng</label>
                            <input
                              type="month"
                              value={startPeriod}
                              onChange={(e) => setStartPeriod(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Đến tháng</label>
                            <input
                              type="month"
                              value={endPeriod}
                              onChange={(e) => setEndPeriod(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kỳ phân tích phí</label>
                            <input
                              type="month"
                              value={selectedPeriod}
                              onChange={(e) => setSelectedPeriod(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button 
                            onClick={fetchChartData} 
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md text-white"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Cập nhật biểu đồ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Charts Grid */}
                    {incomeByPeriod.length > 0 && (
                      <div className="grid lg:grid-cols-2 gap-6">
                        <IncomeChart data={incomeByPeriod} />
                        {collectionRate.length > 0 && <CollectionRateChart data={collectionRate} />}
                      </div>
                    )}

                    {feeBreakdown && <FeeBreakdownChart data={feeBreakdown} />}

                    {/* Comparison Section */}
                    <Card className="bg-slate-800/90 border border-slate-700 shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                          <Filter className="h-5 w-5 text-slate-400" />
                          So sánh giữa các kỳ
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kỳ 1</label>
                            <input
                              type="month"
                              value={comparisonPeriod1}
                              onChange={(e) => setComparisonPeriod1(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Kỳ 2</label>
                            <input
                              type="month"
                              value={comparisonPeriod2}
                              onChange={(e) => setComparisonPeriod2(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            onClick={fetchComparison} 
                            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md text-white"
                          >
                            <RefreshCw className="h-4 w-4" />
                            So sánh ngay
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {comparison && <ComparisonCard data={comparison} />}
                  </div>
                  {/* Data Tables */}
                  <Card className="bg-slate-800/90 border border-slate-700 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-slate-200">Dữ liệu chi tiết</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="income-apartment" className="w-full">
                        <TabsList className="bg-slate-900 border border-slate-700 p-1 grid grid-cols-4 gap-1">
                          <TabsTrigger value="income-apartment" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400 data-[state=active]:shadow-sm">
                            Thu theo căn hộ
                          </TabsTrigger>
                          <TabsTrigger value="income-floor" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400 data-[state=active]:shadow-sm">
                            Thu theo tầng
                          </TabsTrigger>
                          <TabsTrigger value="financial-floor" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400 data-[state=active]:shadow-sm">
                            Tài chính theo tầng
                          </TabsTrigger>
                          <TabsTrigger value="debt" className="data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100 text-slate-400 data-[state=active]:shadow-sm">
                            Căn hộ có nợ
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="income-apartment" className="mt-6">
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                            {incomeByApartment.length === 0 ? (
                              <div className="text-center py-12 text-slate-400">Không có dữ liệu</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-2 border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                                      <TableHead className="font-bold text-slate-200">Mã căn hộ</TableHead>
                                      <TableHead className="font-bold text-slate-200">Chủ hộ</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Tổng đã thanh toán</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {incomeByApartment.map((item, idx) => (
                                      <TableRow 
                                        key={item.apt_id} 
                                        className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}
                                      >
                                        <TableCell className="font-semibold text-blue-400">{item.apt_id}</TableCell>
                                        <TableCell className="text-slate-300">{item.owner_name || "-"}</TableCell>
                                        <TableCell className="text-right font-semibold text-green-400">
                                          {formatCurrency(item.total_paid)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="income-floor" className="mt-6">
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                            {incomeByFloor.length === 0 ? (
                              <div className="text-center py-12 text-slate-400">Không có dữ liệu</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-2 border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                                      <TableHead className="font-bold text-slate-200">Tầng</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Tổng đã thanh toán</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {incomeByFloor.map((item, index) => (
                                      <TableRow key={index} className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                        <TableCell className="font-medium text-slate-200">
                                          {item.floor !== null ? `Tầng ${item.floor}` : "Không xác định"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-400">
                                          {formatCurrency(item.total_paid)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="financial-floor" className="mt-6">
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                            {financialByFloor.length === 0 ? (
                              <div className="text-center py-12 text-slate-400">Không có dữ liệu</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-2 border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                                      <TableHead className="font-bold text-slate-200">Tầng</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Đã thanh toán</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Nợ hiện tại</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Nợ cũ</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Tỷ lệ thu</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {financialByFloor.map((item, index) => (
                                      <TableRow key={index} className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                        <TableCell className="font-medium text-slate-200">{item.display}</TableCell>
                                        <TableCell className="text-right font-semibold text-green-400">
                                          {formatCurrency(item.total_paid)}
                                        </TableCell>
                                        <TableCell className="text-right text-orange-400">
                                          {formatCurrency(item.total_due_current)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-400">
                                          {formatCurrency(item.current_pre_debt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">{item.collection_rate}</Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="debt" className="mt-6">
                          <div className="bg-slate-800/50 rounded-lg border border-slate-700">
                            {debtApartments.length === 0 ? (
                              <div className="text-center py-12 text-slate-400">Không có căn hộ nào có nợ</div>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-2 border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-900">
                                      <TableHead className="font-bold text-slate-200">Mã căn hộ</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Phí mới</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Nợ cũ</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Tổng nợ</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Đã thanh toán</TableHead>
                                      <TableHead className="text-right font-bold text-slate-200">Còn nợ</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {debtApartments.map((item, idx) => (
                                      <TableRow key={item.apt_id} className={`border-b border-slate-700 hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                        <TableCell className="font-semibold text-blue-400">{item.apt_id}</TableCell>
                                        <TableCell className="text-right text-slate-300">
                                          {formatCurrency(item.new_charges_current)}
                                        </TableCell>
                                        <TableCell className="text-right text-red-400">
                                          {formatCurrency(item.pre_debt)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-orange-400">
                                          {formatCurrency(item.total_due_current)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-400">
                                          {formatCurrency(item.total_paid_all_time)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Badge className="bg-red-500/20 text-red-400 border-red-500 font-semibold">
                                            {formatCurrency(item.current_remaining_debt)}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
