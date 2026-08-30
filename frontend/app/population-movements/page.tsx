"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import {
  UserCircle,
  Plus,
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { populationMovementAPI, movementTypeLabels, statusLabels, PopulationMovement } from "@/lib/populationMovementApi";

export default function PopulationMovementsPage() {
  const { user } = useAuth();
  const [movements, setMovements] = useState<PopulationMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [residentInfo, setResidentInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    movement_type: "temporary_absence",
    reason: "",
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadResidentInfo();
    loadMovements();
  }, [user]);

  const loadResidentInfo = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/residents/user/${user.id}`);
      const result = await response.json();
      if (result.success) {
        setResidentInfo(result.data);
      }
    } catch (error: any) {
      console.error("Failed to load resident info:", error);
    }
  };

  const loadMovements = async () => {
    try {
      setLoading(true);
      if (residentInfo?.id) {
        const data = await populationMovementAPI.listByResident(residentInfo.id);
        setMovements(data);
      }
    } catch (error: any) {
      console.error("Failed to load movements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!residentInfo?.id || !residentInfo?.apt_id) {
      alert("Bạn chưa được liên kết với hồ sơ cư dân. Vui lòng liên hệ quản lý để được hỗ trợ.");
      return;
    }

    setSubmitting(true);

    try {
      await populationMovementAPI.create({
        ...formData,
        resident_id: residentInfo.id,
        apt_id: residentInfo.apt_id,
        requested_by: user?.id,
        status: "pending",
      });

      alert("Khai báo biến động nhân khẩu thành công!");
      setShowForm(false);
      setFormData({
        movement_type: "temporary_absence",
        reason: "",
        start_date: "",
        end_date: "",
        notes: "",
      });
      loadMovements();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setSubmitting(false);
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
    <ProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar />
        <div className="ml-72 p-8">
          <Header />
          <main className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  Biến động nhân khẩu
                </h1>
                <p className="text-slate-400">
                  Khai báo tạm vắng, tạm trú và các biến động khác
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg font-medium flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Khai báo mới
              </button>
            </div>

            {/* Warning if no resident info */}
            {!loading && !residentInfo && (
              <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-400">Chưa có hồ sơ cư dân</h3>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      Bạn chưa được liên kết với hồ sơ cư dân trong hệ thống. Vui lòng liên hệ ban quản lý để được hỗ trợ.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            {showForm && (
              <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Khai báo biến động nhân khẩu
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Loại biến động *
                    </label>
                    <select
                      value={formData.movement_type}
                      onChange={(e) =>
                        setFormData({ ...formData, movement_type: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="temporary_absence">Tạm vắng</option>
                      <option value="temporary_residency">Tạm trú</option>
                      <option value="permanent_move">Chuyển hộ khẩu</option>
                      <option value="visit">Thăm viếng</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Lý do *
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Ngày bắt đầu *
                      </label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData({ ...formData, start_date: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData({ ...formData, end_date: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Ghi chú
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-slate-700 text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                    >
                      {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                  <p className="text-slate-400 text-lg">Chưa có khai báo nào</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">
                          Loại biến động
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Lý do
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Thời gian
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Trạng thái
                        </th>
                        <th className="px-6 py-4 text-left font-semibold">
                          Ngày tạo
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
                            <span className="text-sm font-medium text-slate-200">
                              {movementTypeLabels[movement.movement_type] ||
                                movement.movement_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-300">
                              {movement.reason || "-"}
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
                            <span className="text-sm text-slate-300">
                              {new Date(movement.created_at).toLocaleDateString("vi-VN")}
                            </span>
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
    </ProtectedRoute>
  );
}
