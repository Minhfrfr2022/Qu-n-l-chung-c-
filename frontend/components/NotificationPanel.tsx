"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Megaphone,
  Settings,
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification, NotificationType } from "@/types/notification";
import { useRouter } from "next/navigation";

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    setIsSettingsOpen,
  } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case NotificationType.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case NotificationType.ERROR:
        return <XCircle className="w-5 h-5 text-red-400" />;
      case NotificationType.ANNOUNCEMENT:
        return <Megaphone className="w-5 h-5 text-purple-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return "border-green-500/20 bg-green-500/5";
      case NotificationType.WARNING:
        return "border-yellow-500/20 bg-yellow-500/5";
      case NotificationType.ERROR:
        return "border-red-500/20 bg-red-500/5";
      case NotificationType.ANNOUNCEMENT:
        return "border-purple-500/20 bg-purple-500/5";
      default:
        return "border-blue-500/20 bg-blue-500/5";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
      setIsOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-all group"
      >
        <Bell
          className={`w-5 h-5 transition-colors ${
            unreadCount > 0
              ? "text-blue-400 group-hover:text-blue-300"
              : "text-slate-300 dark:text-slate-400 group-hover:text-blue-400"
          }`}
        />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-[10px] text-white flex items-center justify-center font-semibold shadow-lg animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 dark:bg-slate-950 border-b border-slate-700 dark:border-slate-800 p-4 z-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-200 dark:text-slate-300">Thông báo</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Cài đặt thông báo"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              {unreadCount > 0 ? (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Đánh dấu tất cả đã đọc
                </button>
              ) : (
                <span className="text-xs text-slate-500">Đã đọc tất cả thông báo</span>
              )}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs text-slate-400 hover:text-slate-300 transition"
              >
                Tùy chỉnh ⚙️
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[500px]">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">Đang tải...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 dark:text-slate-500">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 transition-all cursor-pointer ${
                      !notification.read
                        ? "bg-blue-500/5 hover:bg-blue-500/10"
                        : "hover:bg-slate-800/50 dark:hover:bg-slate-800/30"
                    } ${notification.link ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl border ${getNotificationColor(
                          notification.type
                        )} flex items-center justify-center`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`text-sm font-semibold ${
                              !notification.read ? "text-slate-100 dark:text-slate-200" : "text-slate-300 dark:text-slate-400"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 dark:text-slate-600">
                            {formatTime(notification.createdAt)}
                          </span>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification.id)}
                                className="p-1.5 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Đánh dấu đã đọc"
                              >
                                <Check className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-green-400" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="p-1.5 hover:bg-slate-700 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
