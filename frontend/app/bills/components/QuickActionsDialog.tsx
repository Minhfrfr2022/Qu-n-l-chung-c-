"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { Bill } from "../types";

interface QuickActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill | null;
  onMarkPaid: (aptId: string, period: string, paymentMethod: string) => Promise<void>;
  onAddLateFee: (aptId: string, period: string, lateFee: number) => Promise<void>;
  onApplyDiscount: (aptId: string, period: string, discount: number) => Promise<void>;
  onSendReminder: (aptId: string, period: string) => Promise<void>;
}

export function QuickActionsDialog({
  isOpen,
  onOpenChange,
  bill,
  onMarkPaid,
  onAddLateFee,
  onApplyDiscount,
  onSendReminder,
}: QuickActionsDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [lateFee, setLateFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!bill) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      await onMarkPaid(bill.apt_id, bill.period || "", paymentMethod);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to mark paid:", error);
      alert("Không thể đánh dấu đã thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLateFee = async () => {
    if (lateFee <= 0) {
      alert("Phí trễ hạn phải lớn hơn 0");
      return;
    }
    setLoading(true);
    try {
      await onAddLateFee(bill.apt_id, bill.period || "", lateFee);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add late fee:", error);
      alert("Không thể thêm phí trễ hạn");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (discount <= 0) {
      alert("Giảm giá phải lớn hơn 0");
      return;
    }
    setLoading(true);
    try {
      await onApplyDiscount(bill.apt_id, bill.period || "", discount);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply discount:", error);
      alert("Không thể áp dụng giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    setLoading(true);
    try {
      await onSendReminder(bill.apt_id, bill.period || "");
      onOpenChange(false);
      alert("Đã gửi nhắc nhở thanh toán");
    } catch (error) {
      console.error("Failed to send reminder:", error);
      alert("Không thể gửi nhắc nhở");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount =
    bill.electric + bill.water + bill.service + bill.vehicles + bill.pre_debt +
    (bill.late_fee || 0) - (bill.discount || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Hành động nhanh - Căn hộ {bill.apt_id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Kỳ:</span>
              <span className="font-semibold">{bill.period || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền:</span>
              <span className="font-semibold text-lg">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`font-semibold ${bill.paid ? "text-green-600" : "text-red-600"}`}>
                {bill.paid ? "Đã thu" : "Chưa thu"}
              </span>
            </div>
          </div>

          {/* Mark as Paid */}
          {!bill.paid && (
            <div className="space-y-3 p-4 border border-green-200 rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-900">Đánh dấu đã thanh toán</h3>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
                <select
                  id="paymentMethod"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="card">Thẻ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <Button onClick={handleMarkPaid} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                Xác nhận đã thu
              </Button>
            </div>
          )}

          {/* Add Late Fee */}
          {!bill.paid && (
            <div className="space-y-3 p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-semibold text-red-900">Thêm phí trễ hạn</h3>
              <div className="space-y-2">
                <Label htmlFor="lateFee">Số tiền phí trễ hạn</Label>
                <Input
                  id="lateFee"
                  type="number"
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleAddLateFee} disabled={loading || lateFee <= 0} variant="destructive" className="w-full">
                Áp dụng phí trễ hạn
              </Button>
            </div>
          )}

          {/* Apply Discount */}
          {!bill.paid && (
            <div className="space-y-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-900">Áp dụng giảm giá</h3>
              <div className="space-y-2">
                <Label htmlFor="discount">Số tiền giảm</Label>
                <Input
                  id="discount"
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleApplyDiscount} disabled={loading || discount <= 0} className="w-full bg-blue-600 hover:bg-blue-700">
                Áp dụng giảm giá
              </Button>
            </div>
          )}

          {/* Send Reminder */}
          {!bill.paid && (
            <div className="space-y-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <h3 className="font-semibold text-yellow-900">Gửi nhắc nhở thanh toán</h3>
              <p className="text-sm text-yellow-700">
                Gửi thông báo nhắc nhở thanh toán cho cư dân
                {bill.reminder_count && bill.reminder_count > 0 && (
                  <span className="ml-2 text-xs">
                    (Đã gửi {bill.reminder_count} lần)
                  </span>
                )}
              </p>
              <Button onClick={handleSendReminder} disabled={loading} variant="outline" className="w-full border-yellow-600 text-yellow-900 hover:bg-yellow-100">
                Gửi nhắc nhở
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
