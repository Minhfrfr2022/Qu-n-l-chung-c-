"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Clock, Calendar, TrendingDown } from "lucide-react";
import type { Bill } from "../types";

interface OverdueBillsListProps {
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const calculateDaysOverdue = (dueDate?: string) => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

export function OverdueBillsList({ bills, onSelectBill }: OverdueBillsListProps) {
  if (bills.length === 0) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-600" />
            Hóa đơn quá hạn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-600">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Không có hóa đơn quá hạn</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-600" />
          Hóa đơn quá hạn ({bills.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-50 border-b border-red-200">
                <TableHead className="font-semibold text-gray-700">Căn hộ</TableHead>
                <TableHead className="font-semibold text-gray-700">Chủ hộ</TableHead>
                <TableHead className="font-semibold text-gray-700">Kỳ</TableHead>
                <TableHead className="text-right font-semibold text-gray-700">Số tiền</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Quá hạn</TableHead>
                <TableHead className="text-center font-semibold text-gray-700">Nhắc nhở</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill, idx) => {
                const daysOverdue = calculateDaysOverdue(bill.due_date);
                return (
                  <TableRow
                    key={`${bill.apt_id}-${bill.period}`}
                    className={`border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                    onClick={() => onSelectBill(bill)}
                  >
                    <TableCell className="font-medium text-gray-900">{bill.apt_id}</TableCell>
                    <TableCell className="text-gray-700">{bill.owner}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {bill.period}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(bill.total)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${
                        daysOverdue > 30 ? 'bg-red-600' : daysOverdue > 15 ? 'bg-orange-500' : 'bg-yellow-500'
                      } text-white`}>
                        {daysOverdue} ngày
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-gray-600">
                      {bill.reminder_count || 0} lần
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
