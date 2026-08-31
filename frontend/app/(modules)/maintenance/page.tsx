"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle, Clock, Wrench, ChevronRight, Shield } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/auth";
import {
  MaintenanceRequest,
  MaintenanceStats,
  getAllMaintenanceRequests,
  createMaintenanceRequest,
  getMaintenanceStatistics,
  formatCost,
  getStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
} from "@/lib/maintenanceApi";

interface FormData {
  apt_id: string;
  resident_name: string;
  phone: string;
  issue_description: string;
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    apt_id: "",
    resident_name: "",
    phone: "",
    issue_description: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        getAllMaintenanceRequests(),
        getMaintenanceStatistics(),
      ]);
      setRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      alert("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
        router.replace("/admin/maintenance");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        apt_id: prev.apt_id || user.apartmentNumber || "",
        resident_name: prev.resident_name || user.fullName || user.username || "",
      }));
      fetchData();
    }
  }, [user, router]);

  const handleAddRequest = async () => {
    if (!formData.apt_id || !formData.resident_name || !formData.issue_description) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSubmitting(true);
      await createMaintenanceRequest(formData);
      setFormData({
        apt_id: "",
        resident_name: "",
        phone: "",
        issue_description: "",
      });
      setShowForm(false);
      await fetchData();
      alert("Tạo yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể tạo yêu cầu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
      case "in_progress":
        return <Wrench className="w-5 h-5" />;
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="ml-72">
        <Header />

        {/* Content */}
        <div className="p-6">
          {/* Back Button */}
          <div className="mb-6">
            <BackButton />
          </div>

          {/* Header */}
          <div className="bg-white shadow-lg rounded-xl mb-6">
            <div className="px-6 py-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <Wrench className="w-8 h-8 text-orange-500" />
                  Yêu cầu Bảo trì
                </h1>
                <p className="text-gray-600 mt-2">Tạo và theo dõi yêu cầu bảo trì của bạn</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Yêu cầu mới
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 text-sm font-medium">Tổng yêu cầu</div>
                    <div className="text-3xl font-bold text-gray-800 mt-1">{stats.total}</div>
                  </div>
                  <AlertCircle className="w-10 h-10 text-gray-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 text-sm font-medium">Chờ xác nhận</div>
                    <div className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</div>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 text-sm font-medium">Đang xử lý</div>
                    <div className="text-3xl font-bold text-blue-600 mt-1">
                      {stats.confirmed + stats.in_progress}
                    </div>
                  </div>
                  <Wrench className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 text-sm font-medium">Hoàn thành</div>
                    <div className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</div>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
              </div>
            </div>
          )}

          {/* Form Thêm yêu cầu */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-500" />
                Tạo yêu cầu bảo trì mới
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số căn hộ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: A101"
                    value={formData.apt_id}
                    onChange={(e) => setFormData({ ...formData, apt_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên cư dân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    value={formData.resident_name}
                    onChange={(e) => setFormData({ ...formData, resident_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả vấn đề <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Mô tả chi tiết vấn đề cần bảo trì..."
                    value={formData.issue_description}
                    onChange={(e) =>
                      setFormData({ ...formData, issue_description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddRequest}
                  disabled={submitting}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  {submitting ? "Đang tạo..." : "Tạo yêu cầu"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 px-6 rounded-lg transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}

          {/* Danh sách yêu cầu */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600">
              <h2 className="text-xl font-bold text-white">Danh sách yêu cầu của bạn</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có yêu cầu bảo trì nào.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Tạo yêu cầu đầu tiên →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-bold text-gray-800">
                            {request.apt_id}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{getStatusLabel(request.status)}</span>
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {getPriorityLabel(request.priority)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{request.issue_description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 {new Date(request.created_at).toLocaleDateString("vi-VN")}</span>
                          {request.estimated_cost && (
                            <span>💰 Dự kiến: {formatCost(request.estimated_cost)}</span>
                          )}
                          {request.actual_cost && (
                            <span>💵 Thực tế: {formatCost(request.actual_cost)}</span>
                          )}
                        </div>
                        {request.notes && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Ghi chú:</strong> {request.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}