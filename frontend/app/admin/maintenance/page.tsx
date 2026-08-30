"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";
import {
  MaintenanceRequest,
  MaintenanceStats,
  getAllMaintenanceRequests,
  confirmMaintenanceRequest,
  updateMaintenanceRequest,
  completeMaintenanceRequest,
  getMaintenanceStatistics,
  formatCost,
  getStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
} from "@/lib/maintenanceApi";

interface UpdateModalData {
  request: MaintenanceRequest;
  action: "confirm" | "update_status" | "complete";
}

export default function AdminMaintenancePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<UpdateModalData | null>(null);
  const [modalData, setModalData] = useState({
    estimated_cost: "",
    actual_cost: "",
    notes: "",
    assigned_to: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        getAllMaintenanceRequests(),
        getMaintenanceStatistics(),
      ]);
      setRequests(requestsData);
      setFilteredRequests(requestsData);
      setStats(statsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
      alert("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    let filtered = requests;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.apt_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.resident_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.issue_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, priorityFilter, requests]);

  const handleConfirm = async () => {
    if (!selectedRequest) return;

    try {
      await confirmMaintenanceRequest(selectedRequest.request.id, {
        estimated_cost: modalData.estimated_cost
          ? parseFloat(modalData.estimated_cost)
          : undefined,
        notes: modalData.notes || undefined,
        assigned_to: modalData.assigned_to || undefined,
      });
      await fetchData();
      setSelectedRequest(null);
      setModalData({ estimated_cost: "", actual_cost: "", notes: "", assigned_to: "" });
      alert("Xác nhận yêu cầu thành công!");
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể xác nhận yêu cầu. Vui lòng thử lại.");
    }
  };

  const handleUpdateStatus = async (request: MaintenanceRequest, status: string) => {
    try {
      await updateMaintenanceRequest(request.id, {
        status: status as any,
      });
      await fetchData();
      alert("Cập nhật trạng thái thành công!");
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;

    try {
      await completeMaintenanceRequest(selectedRequest.request.id, {
        actual_cost: modalData.actual_cost ? parseFloat(modalData.actual_cost) : undefined,
        notes: modalData.notes || undefined,
      });
      await fetchData();
      setSelectedRequest(null);
      setModalData({ estimated_cost: "", actual_cost: "", notes: "", assigned_to: "" });
      alert("Hoàn thành yêu cầu và cập nhật doanh thu thành công!");
    } catch (error) {
      console.error("Lỗi:", error);
      alert("Không thể hoàn thành yêu cầu. Vui lòng thử lại.");
    }
  };

  const openModal = (request: MaintenanceRequest, action: "confirm" | "update_status" | "complete") => {
    setSelectedRequest({ request, action });
    setModalData({
      estimated_cost: request.estimated_cost?.toString() || "",
      actual_cost: request.actual_cost?.toString() || "",
      notes: request.notes || "",
      assigned_to: request.assigned_to || "",
    });
  };

  if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Không có quyền truy cập</h2>
          <p className="text-gray-600 mt-2">Chỉ admin và manager mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar />
      <div className="ml-72">
        <Header />

        <div className="p-6">
          <div className="mb-6">
            <BackButton />
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-xl rounded-xl mb-6 p-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Wrench className="w-8 h-8" />
                  Quản lý Bảo trì
                </h1>
                <p className="text-orange-100 mt-2">Xác nhận và xử lý yêu cầu bảo trì từ cư dân</p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
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
                    <div className="text-gray-600 text-sm font-medium">Đã xác nhận</div>
                    <div className="text-3xl font-bold text-blue-600 mt-1">{stats.confirmed}</div>
                  </div>
                  <CheckCircle className="w-10 h-10 text-blue-400" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-600 text-sm font-medium">Đang xử lý</div>
                    <div className="text-3xl font-bold text-purple-600 mt-1">
                      {stats.in_progress}
                    </div>
                  </div>
                  <Wrench className="w-10 h-10 text-purple-400" />
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

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo căn hộ, cư dân, hoặc vấn đề..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="in_progress">Đang xử lý</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Tất cả mức độ</option>
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-gray-600 mt-4">Đang tải dữ liệu...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Không tìm thấy yêu cầu nào.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Căn hộ
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Cư dân
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Vấn đề
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Ưu tiên
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Chi phí
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                          {request.apt_id}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="text-gray-800 font-medium">{request.resident_name}</div>
                          {request.phone && (
                            <div className="text-gray-500 text-xs">{request.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                          <div className="line-clamp-2">{request.issue_description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                              request.priority
                            )}`}
                          >
                            {getPriorityLabel(request.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div>
                            {request.estimated_cost && (
                              <div className="text-blue-600">
                                DK: {formatCost(request.estimated_cost)}
                              </div>
                            )}
                            {request.actual_cost && (
                              <div className="text-green-600 font-semibold">
                                TT: {formatCost(request.actual_cost)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(request.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            {request.status === "pending" && (
                              <button
                                onClick={() => openModal(request, "confirm")}
                                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition"
                              >
                                Xác nhận
                              </button>
                            )}
                            {(request.status === "confirmed" || request.status === "in_progress") && (
                              <>
                                {request.status === "confirmed" && (
                                  <button
                                    onClick={() => handleUpdateStatus(request, "in_progress")}
                                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition"
                                  >
                                    Bắt đầu
                                  </button>
                                )}
                                <button
                                  onClick={() => openModal(request, "complete")}
                                  className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition"
                                >
                                  Hoàn thành
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedRequest.action === "confirm" && "Xác nhận yêu cầu"}
                {selectedRequest.action === "complete" && "Hoàn thành yêu cầu"}
              </h3>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Căn hộ:</span>
                    <span className="ml-2 font-semibold">{selectedRequest.request.apt_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cư dân:</span>
                    <span className="ml-2 font-semibold">
                      {selectedRequest.request.resident_name}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Vấn đề:</span>
                    <p className="mt-1 text-gray-800">{selectedRequest.request.issue_description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {selectedRequest.action === "confirm" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Chi phí dự kiến (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={modalData.estimated_cost}
                        onChange={(e) =>
                          setModalData({ ...modalData, estimated_cost: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập chi phí dự kiến"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phân công cho
                      </label>
                      <input
                        type="text"
                        value={modalData.assigned_to}
                        onChange={(e) =>
                          setModalData({ ...modalData, assigned_to: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tên người phụ trách"
                      />
                    </div>
                  </>
                )}

                {selectedRequest.action === "complete" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chi phí thực tế (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={modalData.actual_cost}
                      onChange={(e) =>
                        setModalData({ ...modalData, actual_cost: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nhập chi phí thực tế"
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      Chi phí sẽ được cập nhật vào doanh thu của kỳ{" "}
                      {selectedRequest.request.period}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                  <textarea
                    value={modalData.notes}
                    onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={4}
                    placeholder="Thêm ghi chú..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedRequest.action === "confirm" && (
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
                  >
                    Xác nhận
                  </button>
                )}
                {selectedRequest.action === "complete" && (
                  <button
                    onClick={handleComplete}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
                  >
                    Hoàn thành
                  </button>
                )}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2.5 px-6 rounded-lg transition-all"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
