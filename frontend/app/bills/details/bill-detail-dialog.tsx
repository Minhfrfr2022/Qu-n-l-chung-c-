"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog"
import { Button } from "../components/ui/button"
import { Zap, Droplet, Wrench, Car, AlertCircle } from "lucide-react"
import type { Bill } from "../types"
import { billsAPI } from '@/lib/api';
import { useState } from 'react';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

interface BillDetailDialogProps {
  bill: Bill | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  viewMode: "user" | "admin"
  onEdit?: (bill: Bill) => void
  onReset?: (bill: Bill) => void
}

export function BillDetailDialog({ bill, isOpen, onOpenChange, viewMode, onEdit, onReset }: BillDetailDialogProps) {
  if (!bill) return null
  const [waterUnits, setWaterUnits] = useState<number | ''>('');
  const [parkingUnits, setParkingUnits] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-grey-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Chi tiết hóa đơn - Căn hộ {bill.apt_id}</DialogTitle>
          <DialogDescription className="text-gray-600">Chủ sở hữu: {bill.owner}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-yellow-100 p-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="font-medium text-gray-600">Tiền điện</span>
              </div>
              <span className="font-semibold text-gray-600">{formatCurrency(bill.electric)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Droplet className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-600">Tiền nước</span>
              </div>
              <span className="font-semibold text-gray-600">{formatCurrency(bill.water)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Wrench className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium text-gray-600">Tiền dịch vụ</span>
              </div>
              <span className="font-semibold text-gray-600">{formatCurrency(bill.service)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-medium text-gray-600">Phí trông xe</span>
              </div>
              <span className="font-semibold text-gray-600">{formatCurrency(bill.vehicles)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <span className="font-medium text-red-700">Tổng dư nợ các kỳ trước</span>
              </div>
              <span className="font-semibold text-red-700">{formatCurrency(bill.pre_debt)}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border-2 border-primary bg-primary/5 p-4">
              <span className="text-lg font-bold text-gray-600">Tổng phải trả kỳ này</span>
              <span className="text-2xl font-bold text-primary text-gray-600">{formatCurrency(bill.electric + bill.pre_debt + bill.water + bill.vehicles + bill.service)}</span>
            </div>
          </div>

          {viewMode === "admin" && onEdit && onReset && (
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1 bg-transparent text-gray-600 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" onClick={() => onReset(bill)}>
                Reset Bill
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent text-gray-600 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group" onClick={() => onEdit(bill)}>
                Sửa Bill
              </Button>
            </div>
          )}

          {viewMode === 'user' && (
            <div className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600">Số mét khối nước (m³)</label>
                  <input type="number" value={waterUnits} onChange={(e) => setWaterUnits(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">Số chỗ đậu xe</label>
                  <input type="number" value={parkingUnits} onChange={(e) => setParkingUnits(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 border rounded text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={async () => {
                  if (!window.confirm('Gửi số liệu tiêu thụ cho căn hộ ' + bill.apt_id + '?')) return;
                  setSubmitting(true);
                  try {
                    const units: any[] = [];
                    if (waterUnits !== '') units.push({ name: 'Nước', units: Number(waterUnits) });
                    if (parkingUnits !== '') units.push({ name: 'Xe', units: Number(parkingUnits) });
                    if (units.length === 0) {
                      alert('Vui lòng nhập ít nhất một số liệu');
                      return;
                    }
                    await billsAPI.submitUnits(bill.apt_id, units);
                    alert('Gửi số liệu thành công');
                    setWaterUnits('');
                    setParkingUnits('');
                  } catch (err) {
                    alert('Lỗi khi gửi số liệu: ' + (err as Error).message);
                  } finally {
                    setSubmitting(false);
                  }
                }} disabled={submitting} className="w-full">
                  Gửi số liệu tiêu thụ
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
