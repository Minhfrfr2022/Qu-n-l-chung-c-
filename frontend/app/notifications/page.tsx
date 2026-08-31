"use client";

import React, { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { UserRole } from "@/types/auth";
import { NotificationType } from "@/types/notification";
import {
  createNotification,
  createAnnouncementForAll,
  createNotificationForRole,
} from "@/lib/notifications";
import {
  Bell,
  Send,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Megaphone,
  Info,
  CheckCheck,
  Trash2,
  Filter,
  Inbox,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isLoading,
  } = useNotifications();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"inbox" | "send_announcement" | "feedback">("inbox");
  const [filterType, setFilterType] = useState<string>("all");

  // Admin Broadcast form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notifType, setNotifType] = useState<NotificationType>(NotificationType.ANNOUNCEMENT);
  const [targetGroup, setTargetGroup] = useState<"all" | "admin" | "user">("all");
  const [link, setLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Resident Feedback state
  const [feedbackCategory, setFeedbackCategory] = useState("Dịch vụ & Vận hành");
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitSuccess(null);
    try {
      if (targetGroup === "all") {
        await createAnnouncementForAll({
          type: notifType,
          title,
          message,
          link: link || undefined,
        });
      } else {
        await createNotificationForRole(targetGroup, {
          type: notifType,
          title,
          message,
          link: link || undefined,
        });
      }

      await refreshNotifications();
      setSubmitSuccess("Thông báo đã được phát hành thành công tới cư dân!");
      setTitle("");
      setMessage("");
      setLink("");
    } catch (err: any) {
      alert("Lỗi khi gửi thông báo: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTitle.trim() || !feedbackContent.trim()) return;

    setIsSubmitting(true);
    try {
      // Send notification alert to Admin about resident feedback
      await createNotificationForRole("admin", {
        type: NotificationType.INFO,
        title: `[Góp ý - ${feedbackCategory}] ${feedbackTitle}`,
        message: `Cư dân ${user?.fullName || user?.username} (${user?.apartmentNumber || "Căn hộ"}) gửi góp ý: ${feedbackContent}`,
        link: "/notifications",
      });

      setFeedbackSuccess(true);
      setFeedbackTitle("");
      setFeedbackContent("");
      await refreshNotifications();
    } catch (err: any) {
      alert("Lỗi khi gửi phản hồi: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: NotificationType) => {
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

  const filteredNotifications = notifications.filter((item) => {
    if (filterType === "unread") return !item.read;
    if (filterType === "maintenance") return item.link?.includes("maintenance");
    if (filterType === "bills") return item.link?.includes("bills") || item.link?.includes("payments");
    return true;
  });

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex-1 lg:ml-72 flex flex-col">
          <Header />

          <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
            {/* Top Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20 text-white">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    Thông báo & Góp ý
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                        {unreadCount} chưa đọc
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-slate-400">
                    Theo dõi các thông báo nghiệp vụ, cập nhật sửa chữa và gửi ý kiến phản hồi
                  </p>
                </div>
              </div>

              {/* Action Tabs */}
              <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "inbox"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Hộp thư ({notifications.length})
                </button>

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab("send_announcement")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                      activeTab === "send_announcement"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    Phát thông báo
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === "feedback"
                      ? "bg-teal-600 text-white shadow-md shadow-teal-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Send className="w-4 h-4" />
                  Gửi phản hồi
                </button>
              </div>
            </div>

            {/* TAB 1: INBOX NOTIFICATIONS */}
            {activeTab === "inbox" && (
              <div className="space-y-4">
                {/* Control bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-300">Bộ lọc:</span>
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        filterType === "all" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setFilterType("unread")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        filterType === "unread" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Chưa đọc ({unreadCount})
                    </button>
                    <button
                      onClick={() => setFilterType("maintenance")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        filterType === "maintenance" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sửa chữa & Bảo trì
                    </button>
                    <button
                      onClick={() => setFilterType("bills")}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        filterType === "bills" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Hóa đơn
                    </button>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                {isLoading ? (
                  <div className="p-12 text-center text-slate-400">Đang tải danh sách thông báo...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-lg font-semibold text-slate-300">Không có thông báo nào</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Các thông báo mới về duyệt sửa chữa, hóa đơn và đăng ký khách sẽ xuất hiện ở đây.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredNotifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.read) markAsRead(item.id);
                          if (item.link) router.push(item.link);
                        }}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                          item.read
                            ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300"
                            : "bg-slate-800/80 border-blue-500/30 hover:border-blue-500/60 shadow-lg text-slate-100"
                        }`}
                      >
                        <div className="mt-1 flex-shrink-0">{getIcon(item.type)}</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-base flex items-center gap-2">
                              {item.title}
                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-ping"></span>
                              )}
                            </h4>
                            <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(item.createdAt).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>

                          {item.link && (
                            <div className="mt-2 flex items-center text-xs font-medium text-blue-400 group-hover:text-blue-300 transition">
                              <span>Xem chi tiết nghiệp vụ</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(item.id);
                              }}
                              title="Đánh dấu đã đọc"
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(item.id);
                            }}
                            title="Xóa thông báo"
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADMIN BROADCAST ANNOUNCEMENT */}
            {activeTab === "send_announcement" && isAdmin && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                  <Megaphone className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Phát thông báo tòa nhà</h3>
                    <p className="text-xs text-slate-400">Gửi thông báo tới toàn bộ cư dân hoặc nhóm chức năng</p>
                  </div>
                </div>

                {submitSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    {submitSuccess}
                  </div>
                )}

                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Đối tượng nhận</label>
                      <select
                        value={targetGroup}
                        onChange={(e: any) => setTargetGroup(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="all">Toàn bộ cư dân (Tất cả)</option>
                        <option value="user">Chỉ cư dân</option>
                        <option value="admin">Chỉ Ban quản lý / Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Mức độ ưu tiên</label>
                      <select
                        value={notifType}
                        onChange={(e: any) => setNotifType(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={NotificationType.ANNOUNCEMENT}>Bản tin / Thông báo chung</option>
                        <option value={NotificationType.WARNING}>Khẩn cấp / Cảnh báo bảo trì</option>
                        <option value={NotificationType.INFO}>Thông tin hướng dẫn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tiêu đề thông báo</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Thông báo bảo trì thang máy tòa A ngày 05/09"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nội dung chi tiết</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Nhập nội dung thông báo đầy đủ để gửi tới cư dân..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Đường dẫn liên kết (Tùy chọn)</label>
                    <input
                      type="text"
                      placeholder="VD: /building-info hoặc /bills"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Đang phát hành..." : "Phát hành thông báo"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: RESIDENT FEEDBACK */}
            {activeTab === "feedback" && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                  <Send className="w-6 h-6 text-teal-400" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">Gửi góp ý & Phản ánh tới Ban Quản Lý</h3>
                    <p className="text-xs text-slate-400">
                      Ý kiến của bạn sẽ được chuyển thẳng tới hòm thư của Ban Quản Lý chung cư
                    </p>
                  </div>
                </div>

                {feedbackSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    Ý kiến đóng góp của bạn đã được gửi thành công đến Ban Quản Lý!
                  </div>
                )}

                <form onSubmit={handleSendFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Chủ đề góp ý</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Dịch vụ & Vận hành">Dịch vụ & Vận hành tòa nhà</option>
                      <option value="An ninh & Trật tự">An ninh & Trật tự</option>
                      <option value="Vệ sinh môi trường">Vệ sinh & Môi trường chung</option>
                      <option value="Gửi xe & Giao thông">Bãi giữ xe & Phương tiện</option>
                      <option value="Khác">Góp ý khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tiêu đề phản hồi</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Góp ý về giờ chiếu sáng sảnh tầng 5"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nội dung chi tiết</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Trình bày chi tiết vấn đề hoặc đề xuất cải tiến của bạn..."
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold rounded-xl transition shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Đang gửi góp ý..." : "Gửi góp ý tới Ban Quản Lý"}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

