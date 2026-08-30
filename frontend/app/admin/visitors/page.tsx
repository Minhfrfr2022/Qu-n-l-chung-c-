"use client";

import React, { useEffect, useState } from "react";
import { visitorAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Visitor } from "@/types/access";
import { AlertCircle, CheckCircle, XCircle, Clock, Eye, Trash2, Users, Calendar, TrendingUp, Ban, Check, X } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";

export default function VisitorsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchVisitors();
    }
  }, [user]);

  const fetchVisitors = async () => {
    try {
      setIsLoading(true);
      const data = await visitorAPI.getAll();
      setVisitors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khách');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (visitorId: string, newStatus: 'approved' | 'rejected') => {
    const statusText = newStatus === 'approved' ? 'phê duyệt' : 'từ chối';
    if (!confirm(`Bạn có chắc muốn ${statusText} yêu cầu này?`)) return;
    
    try {
      await visitorAPI.updateStatus(visitorId, newStatus, actionNotes);
      setActionNotes('');
      setSelectedVisitor(null);
      setShowModal(false);
      await fetchVisitors();
      alert(`Đã ${statusText} thành công!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Không thể ${statusText}`);
    }
  };

  const handleDelete = async (visitorId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này? Hành động này không thể hoàn tác!')) return;
    try {
      await visitorAPI.delete(visitorId);
      await fetchVisitors();
      alert('Đã xóa thành công');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa bản ghi');
    }
  };

  const filteredVisitors = visitors.filter(v => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const stats = {
    total: visitors.length,
    pending: visitors.filter(v => v.status === 'pending').length,
    approved: visitors.filter(v => v.status === 'approved').length,
    rejected: visitors.filter(v => v.status === 'rejected').length,
    completed: visitors.filter(v => v.status === 'completed').length,
    todayExpected: visitors.filter(v => {
      const today = new Date().toDateString();
      const arrivalDate = new Date(v.expected_arrival).toDateString();
      return arrivalDate === today && v.status === 'approved';
    }).length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <Ban className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Bị từ chối';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />
      <div className="ml-72 p-8">
        <Header />
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">Quản Lý Khách Thăm</h1>
              <p className="text-slate-400">Phê duyệt và quản lý khách ghé thăm cư dân</p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Tổng số khách</p>
                  <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
                </div>
                <Users className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Chờ duyệt</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
              </div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Đã duyệt</p>
                  <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Hoàn thành</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.completed}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-blue-400 opacity-20" />
              </div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Bị từ chối</p>
                  <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-500 opacity-20" />
              </div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Đến hôm nay</p>
                  <p className="text-3xl font-bold text-purple-400">{stats.todayExpected}</p>
                </div>
                <Calendar className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500'
                }`}
              >
                {f === 'all' ? 'Tất cả' : getStatusText(f)}
                <span className="ml-2 text-sm">
                  ({f === 'all' ? visitors.length : visitors.filter(v => v.status === f).length})
                </span>
              </button>
            ))}
          </div>

          {/* Visitors Table */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {filteredVisitors.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">
                  {filter === 'all' ? 'Chưa có khách nào' : `Không có khách ${getStatusText(filter).toLowerCase()}`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Tên Khách</th>
                      <th className="px-6 py-4 text-left font-semibold">Mục Đích</th>
                      <th className="px-6 py-4 text-left font-semibold">Cư Dân</th>
                      <th className="px-6 py-4 text-left font-semibold">Thời Gian Đến</th>
                      <th className="px-6 py-4 text-left font-semibold">Trạng Thái</th>
                      <th className="px-6 py-4 text-left font-semibold">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredVisitors.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-200">{visitor.visitor_name}</div>
                          {visitor.visitor_phone && (
                            <div className="text-sm text-slate-400">{visitor.visitor_phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">{visitor.purpose}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-200">{visitor.resident?.full_name}</div>
                          <div className="text-sm text-slate-400">Căn hộ #{visitor.resident?.apartment_number}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(visitor.expected_arrival).toLocaleDateString('vi-VN')} {new Date(visitor.expected_arrival).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(visitor.status)}`}>
                            {getStatusIcon(visitor.status)}
                            <span className="font-medium text-sm">{getStatusText(visitor.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedVisitor(visitor);
                                setShowModal(true);
                              }}
                              className="p-2 hover:bg-blue-900/50 rounded-lg transition-colors text-blue-400"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {visitor.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(visitor.id, 'approved')}
                                  className="p-2 hover:bg-green-900/50 rounded-lg transition-colors text-green-400"
                                  title="Phê duyệt"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(visitor.id, 'rejected')}
                                  className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-400"
                                  title="Từ chối"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(visitor.id)}
                              className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-400"
                              title="Xóa"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Modal */}
          {showModal && selectedVisitor && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-200 mb-6">Chi Tiết Khách</h2>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Tên Khách</label>
                      <p className="text-slate-200">{selectedVisitor.visitor_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Trạng Thái</label>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedVisitor.status)}`}>
                        {getStatusIcon(selectedVisitor.status)}
                        <span className="font-medium">{getStatusText(selectedVisitor.status)}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Số Điện Thoại</label>
                      <p className="text-slate-200">{selectedVisitor.visitor_phone || 'Không có'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                      <p className="text-slate-200">{selectedVisitor.visitor_email || 'Không có'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Mục Đích</label>
                      <p className="text-slate-200">{selectedVisitor.purpose}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Thời Gian Đến</label>
                      <p className="text-slate-200">{new Date(selectedVisitor.expected_arrival).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Thời Gian Đi</label>
                      <p className="text-slate-200">{selectedVisitor.expected_departure ? new Date(selectedVisitor.expected_departure).toLocaleString('vi-VN') : 'Chưa xác định'}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Cư Dân</label>
                      <p className="text-slate-200">{selectedVisitor.resident?.full_name} (Căn hộ #{selectedVisitor.resident?.apartment_number})</p>
                      {selectedVisitor.resident?.email && (
                        <p className="text-sm text-slate-400">Email: {selectedVisitor.resident.email}</p>
                      )}
                    </div>
                    {selectedVisitor.approved_at && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Người Duyệt</label>
                          <p className="text-slate-200">{selectedVisitor.approver?.full_name || 'Không rõ'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Thời Gian Duyệt</label>
                          <p className="text-slate-200">{new Date(selectedVisitor.approved_at).toLocaleString('vi-VN')}</p>
                        </div>
                      </>
                    )}
                    {selectedVisitor.notes && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Ghi Chú</label>
                        <p className="text-slate-200">{selectedVisitor.notes}</p>
                      </div>
                    )}
                  </div>

                  {selectedVisitor.status === 'pending' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Ghi Chú Phê Duyệt (Tùy chọn)</label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-500"
                        rows={3}
                        placeholder="Ghi chú về quyết định (nếu từ chối, vui lòng ghi rõ lý do)"
                      />
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    {selectedVisitor.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedVisitor.id, 'rejected')}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Từ Chối
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedVisitor.id, 'approved')}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Phê Duyệt
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedVisitor(null);
                        setActionNotes('');
                      }}
                      className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
