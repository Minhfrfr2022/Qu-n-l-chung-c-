"use client";

import React, { useState } from "react";
import { X, Bell, ShieldAlert, Receipt, Car, Users, Megaphone, Save, Check } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const { settings, updateSettings } = useNotifications();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof typeof localSettings) => {
    if (key === "emergency") return; // Cannot toggle emergency
    setLocalSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Cài đặt thông báo</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh các loại thông báo bạn muốn nhận</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Emergency - Locked On */}
          <div className="flex items-center justify-between p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200">Cảnh báo khẩn cấp & Báo cháy</p>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-red-500/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40">
                    Bắt buộc
                  </span>
                </div>
                <p className="text-xs text-slate-400">Sự cố PCCC, mất điện nước đột xuất</p>
              </div>
            </div>
            <div className="w-11 h-6 bg-red-500 rounded-full flex items-center justify-end px-1 opacity-70 cursor-not-allowed">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Bills */}
          <div
            onClick={() => handleToggle("bills")}
            className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800/70 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Hóa đơn & Tiền dịch vụ</p>
                <p className="text-xs text-slate-400">Phát hành hóa đơn, xác nhận đã thanh toán</p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                localSettings.bills ? "bg-blue-600 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>

          {/* Vehicles */}
          <div
            onClick={() => handleToggle("vehicles")}
            className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800/70 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Thẻ xe & Phương tiện</p>
                <p className="text-xs text-slate-400">Duyệt thẻ xe, nhắc hạn đóng phí gửi xe</p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                localSettings.vehicles ? "bg-emerald-600 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>

          {/* Visitors */}
          <div
            onClick={() => handleToggle("visitors")}
            className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800/70 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Khách đến thăm</p>
                <p className="text-xs text-slate-400">Duyệt đăng ký khách ra vào căn hộ</p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                localSettings.visitors ? "bg-amber-600 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>

          {/* Announcements */}
          <div
            onClick={() => handleToggle("announcements")}
            className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-slate-700/60 rounded-xl cursor-pointer hover:bg-slate-800/70 transition"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Bản tin tòa nhà & Lịch bảo trì</p>
                <p className="text-xs text-slate-400">Tin tức từ BQL, thông báo bảo dưỡng thang máy</p>
              </div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${
                localSettings.announcements ? "bg-purple-600 justify-end" : "bg-slate-700 justify-start"
              }`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/30 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                Đã lưu!
              </>
            ) : isSaving ? (
              "Đang lưu..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu cài đặt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
