"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/bills/components/ui/card";
import { Button } from "@/app/bills/components/ui/button";
import { Badge } from "@/app/bills/components/ui/badge";
import { Loader2, Download, FileText, Calendar, Printer } from "lucide-react";
import { financialAPI } from "@/lib/financialApi";
import type { SettlementReport as SettlementReportType } from "@/lib/financialApi";
import { format } from "date-fns";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function SettlementReport() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [report, setReport] = useState<SettlementReportType | null>(null);

  const fetchReport = async () => {
    if (!period) {
      alert("Vui lòng chọn kỳ");
      return;
    }

    setLoading(true);
    try {
      const res = await financialAPI.getMonthlySettlementReport(period);
      setReport(res?.data ?? null);
    } catch (error: any) {
      console.error("Fetch error:", error.message);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    
    // Generate PDF content
    const printContent = document.getElementById("settlement-report-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Báo cáo quyết toán ${period}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1f2937; text-align: center; }
            h2 { color: #374151; margin-top: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .text-green { color: #10b981; }
            .text-red { color: #ef4444; }
            .text-orange { color: #f59e0b; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (!report) return;

    // Create CSV content
    let csv = `BÁO CÁO QUYẾT TOÁN THÁNG ${period}\n`;
    csv += `Ngày tạo: ${format(new Date(report.generated_at), "dd/MM/yyyy HH:mm")}\n\n`;

    csv += `TỔNG HỢP\n`;
    csv += `Tổng thu,${report.summary.total_income}\n`;
    csv += `Tổng phải thu,${report.summary.total_charges}\n`;
    csv += `Tổng nợ cũ,${report.summary.total_debt}\n`;
    csv += `Tỷ lệ thu,${report.summary.collection_rate}\n\n`;

    csv += `CHI TIẾT CÁC LOẠI PHÍ\n`;
    csv += `Tiền điện,${report.summary.fee_breakdown.electric}\n`;
    csv += `Tiền nước,${report.summary.fee_breakdown.water}\n`;
    csv += `Phí dịch vụ,${report.summary.fee_breakdown.service}\n`;
    csv += `Phí xe,${report.summary.fee_breakdown.vehicles}\n`;
    csv += `Tổng,${report.summary.fee_breakdown.total}\n\n`;

    csv += `CHI TIẾT TỪNG CĂN HỘ\n`;
    csv += `Căn hộ,Chủ hộ,Tầng,Điện,Nước,Dịch vụ,Xe,Nợ cũ,Tổng HĐ,Đã trả,Còn lại,Trạng thái\n`;

    report.apartments.forEach((apt) => {
      csv += `${apt.apt_id},${apt.owner_name},${apt.floor},${apt.electric},${apt.water},${apt.service},${apt.vehicles},${apt.pre_debt},${apt.total_bill},${apt.total_paid},${apt.balance},${apt.status}\n`;
    });

    // Download CSV
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bao_cao_quyet_toan_${period}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    if (status === "Đã thanh toán")
      return <Badge className="bg-green-500 text-white">Đã thanh toán</Badge>;
    if (status === "Thanh toán một phần")
      return <Badge className="bg-yellow-500 text-white">Thanh toán một phần</Badge>;
    return <Badge className="bg-red-500 text-white">Chưa thanh toán</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 3.3.1 Tạo báo cáo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            3.3.1 Tạo báo cáo quyết toán tháng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Chọn kỳ</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Tạo báo cáo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Report */}
      {report && (
        <>
          {/* 3.3.2 Export Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                3.3.2 Xuất báo cáo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={handleExportPDF} variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  In / Xuất PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <div id="settlement-report-content">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <CardTitle className="text-2xl">
                  BÁO CÁO QUYẾT TOÁN THÁNG {period}
                </CardTitle>
                <p className="text-sm opacity-90">
                  Ngày tạo: {format(new Date(report.generated_at), "dd/MM/yyyy HH:mm")}
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Summary */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Tổng hợp</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Tổng đã thu</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(report.summary.total_income)}
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Tổng phải thu</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(report.summary.total_charges)}
                      </div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Tổng nợ cũ</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(report.summary.total_debt)}
                      </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Tỷ lệ thu</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {report.summary.collection_rate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Chi tiết các loại phí</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Tiền điện</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(report.summary.fee_breakdown.electric)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Tiền nước</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(report.summary.fee_breakdown.water)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-600">Phí dịch vụ</div>
                      <div className="text-lg font-bold text-yellow-600">
                        {formatCurrency(report.summary.fee_breakdown.service)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-gray-600">Phí xe</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatCurrency(report.summary.fee_breakdown.vehicles)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600">Tổng cộng</div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(report.summary.fee_breakdown.total)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Thống kê</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Tổng căn hộ</div>
                      <div className="text-xl font-bold">{report.statistics.total_apartments}</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Đã thanh toán</div>
                      <div className="text-xl font-bold text-green-600">
                        {report.statistics.paid_apartments}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-600">Thanh toán 1 phần</div>
                      <div className="text-xl font-bold text-yellow-600">
                        {report.statistics.partial_paid}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-sm text-gray-600">Chưa thanh toán</div>
                      <div className="text-xl font-bold text-red-600">
                        {report.statistics.unpaid_apartments}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600">Tổng còn nợ</div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatCurrency(report.statistics.total_outstanding)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* By Floor */}
                {report.by_floor.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2">Thống kê theo tầng</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Tầng
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Đã thu
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Phải thu
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                              Nợ cũ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              Tỷ lệ thu
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {report.by_floor.map((floor) => (
                            <tr key={floor.floor} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium">{floor.display}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                                {formatCurrency(floor.total_paid)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                {formatCurrency(floor.total_due_current)}
                              </td>
                              <td className="px-4 py-3 text-sm text-right text-orange-600">
                                {formatCurrency(floor.current_pre_debt)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <Badge variant="outline">{floor.collection_rate}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Apartment Details */}
                <div>
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">
                    Chi tiết từng căn hộ ({report.apartments.length} căn hộ)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Căn hộ
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Chủ hộ
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Tầng
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Điện
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Nước
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Dịch vụ
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Xe
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Nợ cũ
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Tổng HĐ
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Đã trả
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Còn lại
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.apartments.map((apt) => (
                          <tr key={apt.apt_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-semibold">{apt.apt_id}</td>
                            <td className="px-3 py-2">{apt.owner_name}</td>
                            <td className="px-3 py-2 text-center">{apt.floor}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(apt.electric)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(apt.water)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(apt.service)}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(apt.vehicles)}</td>
                            <td className="px-3 py-2 text-right text-orange-600">
                              {formatCurrency(apt.pre_debt)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {formatCurrency(apt.total_bill)}
                            </td>
                            <td className="px-3 py-2 text-right text-green-600">
                              {formatCurrency(apt.total_paid)}
                            </td>
                            <td className="px-3 py-2 text-right text-red-600 font-bold">
                              {formatCurrency(apt.balance)}
                            </td>
                            <td className="px-3 py-2 text-center">{getStatusBadge(apt.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3.3.3 Footer note */}
                <div className="mt-8 pt-4 border-t text-sm text-gray-600">
                  <p>
                    📌 <strong>3.3.3 Lưu trữ:</strong> Báo cáo này có thể được lưu trữ dưới dạng
                    PDF hoặc CSV để tra cứu sau này.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
