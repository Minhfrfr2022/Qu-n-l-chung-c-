"use client";

import React, { useEffect, useState } from "react";
import { accessCardAPI, userAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AccessCard, CardAccessLog, CardHistory, CardFee, CardStatistics } from "@/types/access";
import { AlertCircle, Plus, Eye, Trash2, Lock, Unlock, BarChart3, History, DollarSign, Activity, RefreshCw } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";

export default function AccessControlPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<CardStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<AccessCard | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'lost' | 'blocked'>('all');
  
  // Detail modal tabs
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'logs' | 'fees'>('info');
  const [cardHistory, setCardHistory] = useState<CardHistory[]>([]);
  const [accessLogs, setAccessLogs] = useState<CardAccessLog[]>([]);
  const [cardFees, setCardFees] = useState<CardFee[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Renew modal
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewData, setRenewData] = useState({ expiry_date: '', notes: '' });
  
  const [formData, setFormData] = useState({
    resident_id: '',
    card_number: '',
    card_type: 'resident',
    expiry_date: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'manager')) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [cardsData, residentsData, statsData] = await Promise.all([
        accessCardAPI.getAll(),
        userAPI.getAll(),
        accessCardAPI.getStatistics().catch(() => null)
      ]);
      setCards(cardsData);
      setResidents(residentsData.users || []);
      setStatistics(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardDetails = async (cardId: string) => {
    setLoadingDetails(true);
    try {
      const [history, logs, fees] = await Promise.all([
        accessCardAPI.getHistory(cardId).catch(() => []),
        accessCardAPI.getAccessLogs(cardId, 20, 0).then(res => res?.data || []).catch(() => []),
        accessCardAPI.getFees(cardId).catch(() => [])
      ]);
      setCardHistory(history || []);
      setAccessLogs(logs || []);
      setCardFees(fees || []);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resident_id || !formData.card_number) {
      setError('Vui lòng nhập đầy đủ cư dân và số thẻ');
      return;
    }

    try {
      const cardDataToSend = {
        ...formData,
        resident_id: formData.resident_id,
        card_number: formData.card_number,
        card_type: formData.card_type as 'resident' | 'guest' | 'staff',
        expiry_date: formData.expiry_date || undefined,
        notes: formData.notes || undefined
      };

      await accessCardAPI.create(cardDataToSend);
      
      setFormData({
        resident_id: '',
        card_number: '',
        card_type: 'resident',
        expiry_date: '',
        notes: ''
      });
      setShowModal(false);
      await fetchData();
      alert('Tạo thẻ mới thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo thẻ');
    }
  };

  const handleStatusUpdate = async (cardId: string, newStatus: 'active' | 'inactive' | 'lost' | 'blocked') => {
    const statusText = { active: 'kích hoạt', inactive: 'vô hiệu hóa', lost: 'đánh dấu mất', blocked: 'khóa' };
    if (!confirm(`Bạn có chắc muốn ${statusText[newStatus]} thẻ này?`)) return;
    
    try {
      await accessCardAPI.updateStatus(cardId, newStatus);
      await fetchData();
      alert('Cập nhật trạng thái thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái');
    }
  };

  const handleRenewCard = async () => {
    if (!selectedCard || !renewData.expiry_date) {
      setError('Vui lòng nhập ngày hết hạn mới');
      return;
    }

    try {
      await accessCardAPI.renew(selectedCard.id, renewData.expiry_date, renewData.notes);
      setShowRenewModal(false);
      setRenewData({ expiry_date: '', notes: '' });
      await fetchData();
      alert('Gia hạn thẻ thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gia hạn thẻ');
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thẻ này? Hành động này không thể hoàn tác!')) return;
    try {
      await accessCardAPI.delete(cardId);
      await fetchData();
      alert('Xóa thẻ thành công!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa thẻ');
    }
  };

  const filteredCards = cards.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'lost': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'blocked': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'lost': return 'Đã mất';
      case 'blocked': return 'Bị khóa';
      default: return status;
    }
  };

  const getCardTypeText = (type: string) => {
    switch (type) {
      case 'resident': return 'Cư dân';
      case 'guest': return 'Khách';
      case 'staff': return 'Nhân viên';
      default: return type;
    }
  };

  const getAccessTypeText = (type: string) => type === 'entry' ? 'Vào' : 'Ra';
  
  const getAccessStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Thành công';
      case 'denied': return 'Bị từ chối';
      case 'expired': return 'Hết hạn';
      case 'blocked': return 'Bị khóa';
      default: return status;
    }
  };

  const getActionTypeText = (action: string) => {
    switch (action) {
      case 'created': return 'Tạo thẻ';
      case 'activated': return 'Kích hoạt';
      case 'deactivated': return 'Vô hiệu hóa';
      case 'lost_reported': return 'Báo mất';
      case 'blocked': return 'Khóa thẻ';
      case 'renewed': return 'Gia hạn';
      case 'expired': return 'Hết hạn';
      case 'damaged_reported': return 'Báo hỏng';
      case 'replaced': return 'Thay thế';
      default: return action;
    }
  };

  const getFeeTypeText = (type: string) => {
    switch (type) {
      case 'lost': return 'Phí mất thẻ';
      case 'damaged': return 'Phí thẻ hỏng';
      case 'late_return': return 'Phí trả muộn';
      case 'replacement': return 'Phí thay thẻ';
      case 'other': return 'Phí khác';
      default: return type;
    }
  };

  const getFeeStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thanh toán';
      case 'paid': return 'Đã thanh toán';
      case 'waived': return 'Đã miễn giảm';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Unlock className="w-5 h-5 text-green-500" />;
      case 'blocked': return <Lock className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">Quản Lý Thẻ Cư Dân</h1>
              <p className="text-slate-400">Quản lý và kiểm soát thẻ ra vào của cư dân</p>
            </div>
            <button
              onClick={() => {
                setFormData({
                  resident_id: '',
                  card_number: '',
                  card_type: 'resident',
                  expiry_date: '',
                  notes: ''
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
            >
              <Plus className="w-5 h-5" />
              Cấp Thẻ Mới
            </button>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Tổng số thẻ</p>
                    <p className="text-3xl font-bold text-slate-100">{statistics.total}</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Đang hoạt động</p>
                    <p className="text-3xl font-bold text-green-400">{statistics.active}</p>
                  </div>
                  <Unlock className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Thẻ mất</p>
                    <p className="text-3xl font-bold text-orange-400">{statistics.lost}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Bị khóa</p>
                    <p className="text-3xl font-bold text-red-400">{statistics.blocked}</p>
                  </div>
                  <Lock className="w-12 h-12 text-red-500 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'active', 'inactive', 'lost', 'blocked'] as const).map((f) => (
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
                  ({f === 'all' ? cards.length : cards.filter(c => c.status === f).length})
                </span>
              </button>
            ))}
          </div>

          {/* Cards Table */}
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {filteredCards.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Không tìm thấy thẻ nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Số Thẻ</th>
                      <th className="px-6 py-4 text-left font-semibold">Cư Dân</th>
                      <th className="px-6 py-4 text-left font-semibold">Loại</th>
                      <th className="px-6 py-4 text-left font-semibold">Trạng Thái</th>
                      <th className="px-6 py-4 text-left font-semibold">Ngày Cấp</th>
                      <th className="px-6 py-4 text-left font-semibold">Hết Hạn</th>
                      <th className="px-6 py-4 text-left font-semibold">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredCards.map((card) => (
                      <tr key={card.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-semibold text-slate-200">{card.card_number}</td>
                        <td className="px-6 py-4">
                          <div className="text-slate-200 font-medium">{card.resident?.full_name}</div>
                          <div className="text-sm text-slate-400">Căn hộ #{card.resident?.apartment_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-full text-sm font-medium">
                            {getCardTypeText(card.card_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(card.status)}`}>
                            {getStatusIcon(card.status)}
                            <span className="font-medium text-sm">{getStatusText(card.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(card.issued_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('vi-VN') : 'Không hết hạn'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCard(card);
                                setShowDetailModal(true);
                                setActiveTab('info');
                                fetchCardDetails(card.id);
                              }}
                              className="p-2 hover:bg-blue-900/50 rounded-lg transition-colors text-blue-400"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCard(card);
                                setRenewData({ 
                                  expiry_date: card.expiry_date ? new Date(card.expiry_date).toISOString().split('T')[0] : '',
                                  notes: ''
                                });
                                setShowRenewModal(true);
                              }}
                              className="p-2 hover:bg-green-900/50 rounded-lg transition-colors text-green-400"
                              title="Gia hạn thẻ"
                            >
                              <RefreshCw className="w-5 h-5" />
                            </button>
                            {card.status !== 'blocked' && (
                              <button
                                onClick={() => handleStatusUpdate(card.id, 'blocked')}
                                className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-400"
                                title="Khóa thẻ"
                              >
                                <Lock className="w-5 h-5" />
                              </button>
                            )}
                            {card.status === 'blocked' && (
                              <button
                                onClick={() => handleStatusUpdate(card.id, 'active')}
                                className="p-2 hover:bg-green-900/50 rounded-lg transition-colors text-green-400"
                                title="Kích hoạt thẻ"
                              >
                                <Unlock className="w-5 h-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(card.id)}
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

          {/* Create Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-700">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-200 mb-6">Cấp Thẻ Cư Dân Mới</h2>
                  
                  <form onSubmit={handleCreateCard} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Chọn Cư Dân *</label>
                      <select
                        required
                        value={formData.resident_id}
                        onChange={(e) => setFormData({ ...formData, resident_id: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Chọn cư dân...</option>
                        {residents.map((resident) => (
                          <option key={resident.id} value={resident.id}>
                            {resident.full_name} (Căn hộ #{resident.apartment_number})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Số Thẻ *</label>
                      <input
                        type="text"
                        required
                        value={formData.card_number}
                        onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder:text-slate-500"
                        placeholder="VD: RC-2024-0001"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Loại Thẻ</label>
                        <select
                          value={formData.card_type}
                          onChange={(e) => setFormData({ ...formData, card_type: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="resident">Cư dân</option>
                          <option value="guest">Khách</option>
                          <option value="staff">Nhân viên</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Ngày Hết Hạn</label>
                        <input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                          className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Ghi Chú</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-500"
                        rows={3}
                        placeholder="Thông tin bổ sung"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Cấp Thẻ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Renew Modal */}
          {showRenewModal && selectedCard && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-700">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-200 mb-6">Gia Hạn Thẻ</h2>
                  <p className="text-slate-400 mb-4">Thẻ: <span className="font-mono font-semibold text-slate-200">{selectedCard.card_number}</span></p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Ngày Hết Hạn Mới *</label>
                      <input
                        type="date"
                        required
                        value={renewData.expiry_date}
                        onChange={(e) => setRenewData({ ...renewData, expiry_date: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Ghi Chú</label>
                      <textarea
                        value={renewData.notes}
                        onChange={(e) => setRenewData({ ...renewData, notes: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-700 text-slate-200 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder:text-slate-500"
                        rows={2}
                        placeholder="Lý do gia hạn"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        onClick={() => setShowRenewModal(false)}
                        className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleRenewCard}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Gia Hạn
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {showDetailModal && selectedCard && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700">
                <div className="p-6 border-b border-slate-700">
                  <h2 className="text-2xl font-bold text-slate-200">Chi Tiết Thẻ Cư Dân</h2>
                  <p className="text-sm text-slate-400 mt-1">Số thẻ: {selectedCard.card_number}</p>
                </div>

                <div className="flex border-b border-slate-700 px-6">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'info' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />Thông tin</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2"><History className="w-4 h-4" />Lịch sử</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'logs' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2"><Activity className="w-4 h-4" />Quét thẻ</div>
                  </button>
                  <button
                    onClick={() => setActiveTab('fees')}
                    className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'fees' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2"><DollarSign className="w-4 h-4" />Phí</div>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'info' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Số thẻ</label>
                              <p className="text-lg font-mono font-semibold text-slate-200">{selectedCard.card_number}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Trạng thái</label>
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedCard.status)}`}>
                                {getStatusIcon(selectedCard.status)}
                                <span className="font-medium">{getStatusText(selectedCard.status)}</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Cư dân</label>
                              <p className="text-slate-200">{selectedCard.resident?.full_name}</p>
                              <p className="text-sm text-slate-400">Căn hộ #{selectedCard.resident?.apartment_number}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Loại thẻ</label>
                              <p className="text-slate-200">{getCardTypeText(selectedCard.card_type)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Ngày cấp</label>
                              <p className="text-slate-200">{new Date(selectedCard.issued_date).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Hết hạn</label>
                              <p className="text-slate-200">{selectedCard.expiry_date ? new Date(selectedCard.expiry_date).toLocaleDateString('vi-VN') : 'Không hết hạn'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-400 mb-2">Người cấp</label>
                              <p className="text-slate-200">{selectedCard.issuer?.full_name || 'Hệ thống'}</p>
                            </div>
                            {selectedCard.reason_for_status && (
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Lý do</label>
                                <p className="text-red-400">{selectedCard.reason_for_status}</p>
                              </div>
                            )}
                            {selectedCard.notes && (
                              <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-400 mb-2">Ghi chú</label>
                                <p className="text-slate-200">{selectedCard.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'history' && (
                        <div className="space-y-4">
                          {cardHistory.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Chưa có lịch sử</p>
                          ) : (
                            cardHistory.map((item) => (
                              <div key={item.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <span className="font-semibold text-slate-200">{getActionTypeText(item.action_type)}</span>
                                    <p className="text-sm text-slate-400 mt-1">Bởi: {item.action_user?.full_name || 'Hệ thống'}</p>
                                  </div>
                                  <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                {item.old_status && item.new_status && (
                                  <p className="text-sm text-slate-300">
                                    Trạng thái: <span className="font-medium">{getStatusText(item.old_status)}</span> → <span className="font-medium">{getStatusText(item.new_status)}</span>
                                  </p>
                                )}
                                {item.reason && <p className="text-sm text-slate-400 mt-1">Lý do: {item.reason}</p>}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'logs' && (
                        <div className="space-y-3">
                          {accessLogs.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Chưa có lịch sử quét thẻ</p>
                          ) : (
                            accessLogs.map((log) => (
                              <div key={log.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${log.access_type === 'entry' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'}`}>
                                      {getAccessTypeText(log.access_type)}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${log.access_status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
                                      {getAccessStatusText(log.access_status)}
                                    </span>
                                    <span className="font-semibold text-slate-200">{log.access_point}</span>
                                  </div>
                                  {log.notes && <p className="text-sm text-slate-400">{log.notes}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-200 font-medium">{new Date(log.access_time).toLocaleTimeString('vi-VN')}</p>
                                  <p className="text-xs text-slate-500">{new Date(log.access_time).toLocaleDateString('vi-VN')}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeTab === 'fees' && (
                        <div className="space-y-4">
                          {cardFees.length === 0 ? (
                            <p className="text-center text-slate-400 py-8">Không có khoản phí</p>
                          ) : (
                            cardFees.map((fee) => (
                              <div key={fee.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <span className="font-semibold text-slate-200">{getFeeTypeText(fee.fee_type)}</span>
                                    <p className="text-sm text-slate-400 mt-1">{fee.description}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-slate-200">{formatCurrency(fee.amount)}</p>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                      fee.status === 'paid' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 
                                      fee.status === 'waived' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 
                                      'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                                    }`}>
                                      {getFeeStatusText(fee.status)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-600">
                                  <span>Tạo: {new Date(fee.created_at).toLocaleDateString('vi-VN')}</span>
                                  {fee.paid_at && <span>Thanh toán: {new Date(fee.paid_at).toLocaleDateString('vi-VN')}</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-3 justify-end p-6 border-t border-slate-700">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedCard(null);
                    }}
                    className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
