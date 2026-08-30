"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  UserCircle,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  User,
  Home,
  Eye,
} from "lucide-react";
import { populationMovementAPI, movementTypeLabels, statusLabels, PopulationMovement } from "@/lib/populationMovementApi";

export default function AdminPopulationMovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<PopulationMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedMovement, setSelectedMovement] = useState<PopulationMovement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadMovements();
  }, [filter]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const data = await populationMovementAPI.getByStatus(filter);
      setMovements(data);
    } catch (error: any) {
      console.error("Failed to load movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (movementId: string, status: "approved" | "rejected") => {
    try {
      await populationMovementAPI.updateStatus(movementId, status, user?.id || "");
      alert(`Đã ${status === "approved" ? "phê duyệt" : "từ chối"} thành công!`);
      loadMovements();
      setShowDetailModal(false);
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-green-500/20 text-green-400 border-green-500/50">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium text-sm">{statusLabels[status]}</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-red-500/20 text-red-400 border-red-500/50">
            <XCircle className="w-4 h-4" />
            <span className="font-medium text-sm">{statusLabels[status]}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-sm">{statusLabels[status]}</span>
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 p-8">
          <Header />
          <main className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  Quản lý biến động nhân khẩu
                </h1>
                <p className="text-slate-400">
                  Phê duyệt và quản lý các khai báo biến động
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setFilter("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "pending"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500"
                }`}
              >
                Chờ duyệt
              </button>
              <button
                onClick={() => setFilter("approved")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "approved"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500"
                }`}
              >
                Đã duyệt
              </button>
              <button
                onClick={() => setFilter("rejected")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "rejected"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500"
                }`}
              >
                Từ chối
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === "all"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500"
                }`}
              >
                Tất cả
              </button>
            </div>

            {/* List */}
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4 text-slate-400">Đang tải...</p>
                  </div>
                </div>
              ) : movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12">
                  <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg">Không có khai báo nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">
                          Cư dân
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Căn hộ
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Loại biến động
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Thời gian
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Người duyệt
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {movements.map((movement) => (
                        <tr
                          key={movement.id}
                          className="hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-200">
                                {movement.resident?.full_name || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-slate-500" />
                              <span className="text-sm text-slate-300">
                                {movement.apt_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-slate-300">
                              {movementTypeLabels[movement.movement_type] ||
                                movement.movement_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-300">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(movement.start_date).toLocaleDateString("vi-VN")}
                                {movement.end_date && (
                                  <>
                                    {" - "}
                                    {new Date(movement.end_date).toLocaleDateString("vi-VN")}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(movement.status)}
                          </td>
                          <td className="px-6 py-4">
                            {movement.approved_by && movement.approved_at ? (
                              <div className="text-sm text-slate-300">
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium text-slate-200">
                                    {movement.approved_by}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {new Date(movement.approved_at).toLocaleString("vi-VN")}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">Chưa duyệt</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMovement(movement);
                                  setShowDetailModal(true);
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                Chi tiết
                              </button>
                              {movement.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(movement.id, "approved")}
                                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(movement.id, "rejected")}
                                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-1"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Từ chối
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
          </main>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMovement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Chi tiết biến động</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">Cư dân</label>
                <p className="text-slate-200">{selectedMovement.resident?.full_name || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Căn hộ</label>
                <p className="text-slate-200">{selectedMovement.apt_id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">CCCD</label>
                <p className="text-slate-200">{selectedMovement.resident?.cccd || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Loại biến động</label>
                <p className="text-slate-200">
                  {movementTypeLabels[selectedMovement.movement_type] || selectedMovement.movement_type}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Lý do</label>
                <p className="text-slate-200">{selectedMovement.reason || "-"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Ngày bắt đầu</label>
                  <p className="text-slate-200">
                    {new Date(selectedMovement.start_date).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Ngày kết thúc</label>
                  <p className="text-slate-200">
                    {selectedMovement.end_date
                      ? new Date(selectedMovement.end_date).toLocaleDateString("vi-VN")
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Ghi chú</label>
                <p className="text-slate-200">{selectedMovement.notes || "-"}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">Trạng thái</label>
                <div className="mt-1">{getStatusBadge(selectedMovement.status)}</div>
              </div>

              {/* Approval history */}
              {selectedMovement.status !== "pending" && selectedMovement.approved_at && (
                <div className="border-t border-slate-700 pt-4 mt-4">
                  <h3 className="font-semibold text-slate-200 mb-3">Lịch sử duyệt</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Người duyệt:</span>
                      <span className="text-sm font-medium text-slate-200">
                        {selectedMovement.approved_by || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Thời gian:</span>
                      <span className="text-sm font-medium text-slate-200">
                        {new Date(selectedMovement.approved_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Kết quả:</span>
                      {getStatusBadge(selectedMovement.status)}
                    </div>
                  </div>
                </div>
              )}

              {selectedMovement.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedMovement.id, "approved")}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedMovement.id, "rejected")}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
