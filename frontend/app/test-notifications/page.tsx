"use client";

import { useState } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createNotification,
  createBulkNotifications,
  createNotificationForRole,
  createAnnouncementForAll,
} from "@/lib/notifications";
import { NotificationType } from "@/types/notification";
import { Bell, Send, Users, Megaphone, User, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";

export default function NotificationTestPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, refreshNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>(NotificationType.INFO);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSelfNotification = async () => {
    if (!user || !title || !message) return;

    setLoading(true);
    try {
      await createNotification({
        userId: user.id,
        type,
        title,
        message,
        link: link || undefined,
      });
      await refreshNotifications();
      alert("Thông báo đã được tạo và gửi thành công!");
      setTitle("");
      setMessage("");
      setLink("");
    } catch (error: any) {
      alert("Lỗi tạo thông báo: " + (error?.message || error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncementForAll = async () => {
    if (!title || !message) return;

    setLoading(true);
    try {
      await createAnnouncementForAll({
        type: NotificationType.ANNOUNCEMENT,
        title,
        message,
        link: link || undefined,
      });
      await refreshNotifications();
      alert("Thông báo toàn tòa nhà đã được gửi thành công!");
      setTitle("");
      setMessage("");
      setLink("");
    } catch (error: any) {
      alert("Lỗi gửi thông báo toàn tòa: " + (error?.message || error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForRole = async (role: string) => {
    if (!title || !message) return;

    setLoading(true);
    try {
      await createNotificationForRole(role, {
        type,
        title,
        message,
        link: link || undefined,
      });
      await refreshNotifications();
      alert(`Đã gửi thông báo cho tất cả ${role}!`);
      setTitle("");
      setMessage("");
      setLink("");
    } catch (error: any) {
      alert("Lỗi gửi thông báo theo nhóm: " + (error?.message || error));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createQuickNotification = async (
    notifType: NotificationType,
    notifTitle: string,
    notifMessage: string
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      await createNotification({
        userId: user.id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
      });
      await refreshNotifications();
    } catch (error: any) {
      console.error(error);
      alert("Lỗi: " + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-12">
      {/* Top Header with Bell Notification Panel */}
      <Header />

      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/admin"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
                title="Quay lại Admin"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-3xl font-bold text-white">
                Notification System Test Page
              </h1>
            </div>
            <p className="text-slate-400">
              Kiểm thử và phát thông báo Realtime Firebase cho hệ thống BlueMoon
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm">Total Notifications</p>
                <p className="text-2xl font-bold text-white">
                  {notifications.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-slate-400 text-sm">Unread</p>
                <p className="text-2xl font-bold text-white">{unreadCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-slate-400 text-sm">Read</p>
                <p className="text-2xl font-bold text-white">
                  {notifications.length - unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Notification Form */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">
              Create Notification
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={NotificationType.INFO}>Info</option>
                  <option value={NotificationType.SUCCESS}>Success</option>
                  <option value={NotificationType.WARNING}>Warning</option>
                  <option value={NotificationType.ERROR}>Error</option>
                  <option value={NotificationType.ANNOUNCEMENT}>
                    Announcement
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Link (optional)
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/admin/dashboard"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCreateSelfNotification}
                  disabled={loading || !title || !message}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Send to Me
                </button>
                <button
                  onClick={handleCreateAnnouncementForAll}
                  disabled={loading || !title || !message}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Megaphone className="w-4 h-4" />
                  Send to All
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleCreateForRole("admin")}
                  disabled={loading || !title || !message}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Admins
                </button>
                <button
                  onClick={() => handleCreateForRole("manager")}
                  disabled={loading || !title || !message}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Managers
                </button>
                <button
                  onClick={() => handleCreateForRole("user")}
                  disabled={loading || !title || !message}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  Users
                </button>
              </div>
            </div>
          </div>

          {/* Quick Test Buttons */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Quick Tests</h2>
            <p className="text-slate-400 text-sm mb-4">
              Click to create sample notifications
            </p>

            <div className="space-y-3">
              <button
                onClick={() =>
                  createQuickNotification(
                    NotificationType.SUCCESS,
                    "Thanh toán thành công",
                    "Bạn đã thanh toán phí quản lý tháng 12/2025 thành công"
                  )
                }
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 transition-colors"
              >
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">
                  Payment Success
                </span>
              </button>

              <button
                onClick={() =>
                  createQuickNotification(
                    NotificationType.WARNING,
                    "Nhắc nhở thanh toán",
                    "Phí quản lý tháng 12 sẽ đến hạn vào ngày 15/12/2025"
                  )
                }
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-yellow-400 transition-colors"
              >
                <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">
                  Payment Reminder
                </span>
              </button>

              <button
                onClick={() =>
                  createQuickNotification(
                    NotificationType.INFO,
                    "Yêu cầu được xử lý",
                    "Yêu cầu bảo trì của bạn đang được xử lý bởi đội kỹ thuật"
                  )
                }
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 rounded-lg text-blue-400 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">
                  Request Update
                </span>
              </button>

              <button
                onClick={() =>
                  createQuickNotification(
                    NotificationType.ERROR,
                    "Thanh toán thất bại",
                    "Giao dịch của bạn không thành công. Vui lòng thử lại"
                  )
                }
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-lg text-red-400 transition-colors"
              >
                <div className="w-8 h-8 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">
                  Payment Failed
                </span>
              </button>

              <button
                onClick={() =>
                  createQuickNotification(
                    NotificationType.ANNOUNCEMENT,
                    "Thông báo họp cư dân",
                    "Chung cư tổ chức họp cư dân vào 19h ngày 20/12/2025"
                  )
                }
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 rounded-lg text-purple-400 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left font-medium">
                  Meeting Announcement
                </span>
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">
                💡 <strong>Tip:</strong> Check the notification bell in the
                header to see your notifications in real-time!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
