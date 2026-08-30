"use client";

import React, { useEffect, useState } from "react";
import { accessCardAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AccessCard, CardAccessLog, CardHistory, CardFee } from "@/types/access";
import { AlertCircle, Eye, AlertTriangle, History, DollarSign, Activity, XCircle } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import Header from "@/components/Header";

export default function MyCardsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<AccessCard | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Các tab trong modal chi tiết
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'logs' | 'fees'>('info');
  const [cardHistory, setCardHistory] = useState<CardHistory[]>([]);
  const [accessLogs, setAccessLogs] = useState<CardAccessLog[]>([]);
  const [cardFees, setCardFees] = useState<CardFee[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Modal báo lỗi
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<'lost' | 'damaged'>('lost');
  const [reportDescription, setReportDescription] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchCards();
    }
  }, [user]);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const data = await accessCardAPI.getAll();
      setCards(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy danh sách thẻ');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCardDetails = async (cardId: string) => {
    setLoadingDetails(true);
    try {
      // Lấy lịch sử thay đổi
      const history = await accessCardAPI.getHistory(cardId);
      setCardHistory(history || []);

      // Lấy lịch sử quét thẻ
      const logs = await accessCardAPI.getAccessLogs(cardId, 20, 0);
      setAccessLogs(logs?.data || []);

      // Lấy danh sách phí
      const fees = await accessCardAPI.getFees(cardId);
      setCardFees(fees || []);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết thẻ:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedCard) return;
    
    try {
      if (reportType === 'lost') {
        await accessCardAPI.reportLost(selectedCard.id);
        alert('Đã báo mất thẻ thành công! Bạn sẽ bị tính phí 100,000 VNĐ. Vui lòng liên hệ ban quản lý để được cấp thẻ mới.');
      } else {
        if (!reportDescription.trim()) {
          setError('Vui lòng mô tả tình trạng hỏng của thẻ');
          return;
        }
        await accessCardAPI.reportDamaged(selectedCard.id, reportDescription);
        alert('Đã báo hỏng thẻ thành công! Bạn sẽ bị tính phí 50,000 VNĐ. Vui lòng liên hệ ban quản lý để được thay thẻ mới.');
      }
      
      setShowReportModal(false);
      setReportDescription('');
      setShowDetail(false);
      setSelectedCard(null);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi báo cáo');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'lost':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'blocked':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Không hoạt động';
      case 'lost': return 'Đã mất';
      case 'blocked': return 'Bị khóa';
      default: return status;
    }
  };

  const getCardTypeText = (type: string) => {
    switch (type) {
      case 'resident': return 'Thẻ cư dân';
      case 'guest': return 'Thẻ khách';
      case 'staff': return 'Thẻ nhân viên';
      default: return type;
    }
  };

  const getAccessTypeText = (type: string) => {
    return type === 'entry' ? 'Vào' : 'Ra';
  };

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
    if (status === 'blocked' || status === 'lost') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-gray-500" />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Sidebar />
      <div className="ml-72 p-8">
        <Header />
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <BackButton />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Thẻ Cư Dân Của Tôi</h1>
            <p className="text-gray-600">Xem và quản lý thẻ cư dân của bạn</p>
          </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.length === 0 ? (
            <div className="col-span-full">
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Chưa có thẻ cư dân</p>
                <p className="text-sm text-gray-400 mt-2">Vui lòng liên hệ ban quản lý để được cấp thẻ</p>
              </div>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                <div className={`h-2 ${card.status === 'active' ? 'bg-green-500' : card.status === 'blocked' ? 'bg-red-500' : card.status === 'lost' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{getCardTypeText(card.card_type)}</h3>
                      <p className="text-sm text-gray-500 mt-1">Số thẻ: {card.card_number}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(card.status)}`}>
                      {getStatusIcon(card.status)}
                      <span className="font-medium text-sm">{getStatusText(card.status)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngày cấp:</span>
                      <span className="font-medium text-gray-900">{new Date(card.issued_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hết hạn:</span>
                      <span className="font-medium text-gray-900">
                        {card.expiry_date ? new Date(card.expiry_date).toLocaleDateString('vi-VN') : 'Không hết hạn'}
                      </span>
                    </div>
                    {card.reason_for_status && (
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600">Lý do:</span>
                        <span className="font-medium text-red-600 text-sm">{card.reason_for_status}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedCard(card);
                        setShowDetail(true);
                        setActiveTab('info');
                        fetchCardDetails(card.id);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                    {card.status !== 'lost' && card.status !== 'blocked' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            setReportType('lost');
                            setReportDescription('');
                            setShowReportModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm"
                          title="Báo mất thẻ"
                        >
                          Báo mất
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCard(card);
                            setReportType('damaged');
                            setReportDescription('');
                            setShowReportModal(true);
                          }}
                          className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors font-medium text-sm"
                          title="Báo hỏng thẻ"
                        >
                          Báo hỏng
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cards.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
            <h3 className="font-semibold text-blue-900 mb-2">Lưu ý về thẻ cư dân</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Giữ thẻ ở nơi an toàn, tránh bị mất hoặc hỏng</li>
              <li>✓ Báo mất hoặc hỏng thẻ ngay lập tức với ban quản lý</li>
              <li>✓ Không chia sẻ thẻ cho người khác sử dụng</li>
              <li>✓ Phí mất thẻ: 100,000 VNĐ - Phí thẻ hỏng: 50,000 VNĐ</li>
              <li>✓ Liên hệ ban quản lý để gia hạn thẻ khi sắp hết hạn</li>
            </ul>
          </div>
        )}

        {showDetail && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết thẻ cư dân</h2>
                <p className="text-sm text-gray-500 mt-1">Số thẻ: {selectedCard.card_number}</p>
              </div>

              <div className="flex border-b border-gray-200 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Thông tin
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Lịch sử thay đổi
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'logs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Lịch sử quét thẻ
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('fees')}
                  className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'fees'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Phí phạt
                  </div>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số thẻ</label>
                            <p className="text-lg font-mono font-semibold text-gray-900">{selectedCard.card_number}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(selectedCard.status)}`}>
                              {getStatusIcon(selectedCard.status)}
                              <span className="font-medium">{getStatusText(selectedCard.status)}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Loại thẻ</label>
                            <p className="text-gray-900">{getCardTypeText(selectedCard.card_type)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày cấp</label>
                            <p className="text-gray-900">{new Date(selectedCard.issued_date).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hết hạn</label>
                            <p className="text-gray-900">{selectedCard.expiry_date ? new Date(selectedCard.expiry_date).toLocaleDateString('vi-VN') : 'Không hết hạn'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Người cấp</label>
                            <p className="text-gray-900">{selectedCard.issuer?.full_name || 'Hệ thống'}</p>
                          </div>
                          {selectedCard.reason_for_status && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Lý do trạng thái</label>
                              <p className="text-red-600">{selectedCard.reason_for_status}</p>
                            </div>
                          )}
                          {selectedCard.notes && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                              <p className="text-gray-900">{selectedCard.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'history' && (
                      <div className="space-y-4">
                        {cardHistory.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Chưa có lịch sử thay đổi</p>
                        ) : (
                          cardHistory.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-gray-900">{getActionTypeText(item.action_type)}</span>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Bởi: {item.action_user?.full_name || 'Hệ thống'}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(item.created_at).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              {item.old_status && item.new_status && (
                                <p className="text-sm text-gray-700">
                                  Trạng thái: <span className="font-medium">{getStatusText(item.old_status)}</span> → <span className="font-medium">{getStatusText(item.new_status)}</span>
                                </p>
                              )}
                              {item.reason && (
                                <p className="text-sm text-gray-600 mt-1">Lý do: {item.reason}</p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-600 mt-1">Ghi chú: {item.notes}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'logs' && (
                      <div className="space-y-3">
                        {accessLogs.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Chưa có lịch sử quét thẻ</p>
                        ) : (
                          accessLogs.map((log) => (
                            <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    log.access_type === 'entry' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {getAccessTypeText(log.access_type)}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    log.access_status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {getAccessStatusText(log.access_status)}
                                  </span>
                                  <span className="font-semibold text-gray-900">{log.access_point}</span>
                                </div>
                                {log.notes && (
                                  <p className="text-sm text-gray-600">{log.notes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-900 font-medium">
                                  {new Date(log.access_time).toLocaleTimeString('vi-VN')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(log.access_time).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {activeTab === 'fees' && (
                      <div className="space-y-4">
                        {cardFees.length === 0 ? (
                          <p className="text-center text-gray-500 py-8">Không có khoản phí nào</p>
                        ) : (
                          cardFees.map((fee) => (
                            <div key={fee.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <span className="font-semibold text-gray-900">{getFeeTypeText(fee.fee_type)}</span>
                                  <p className="text-sm text-gray-600 mt-1">{fee.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(fee.amount)}</p>
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                    fee.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                    fee.status === 'waived' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {getFeeStatusText(fee.status)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-300">
                                <span>Tạo: {new Date(fee.created_at).toLocaleDateString('vi-VN')}</span>
                                {fee.paid_at && (
                                  <span>Thanh toán: {new Date(fee.paid_at).toLocaleDateString('vi-VN')}</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedCard(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Báo Lỗi Thẻ */}
        {showReportModal && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${reportType === 'lost' ? 'bg-orange-100' : 'bg-yellow-100'}`}>
                    {reportType === 'lost' ? (
                      <XCircle className="w-6 h-6 text-orange-600" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {reportType === 'lost' ? 'Báo Mất Thẻ' : 'Báo Hỏng Thẻ'}
                    </h2>
                    <p className="text-sm text-gray-500">Thẻ: {selectedCard.card_number}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className={`p-4 rounded-lg border-l-4 ${reportType === 'lost' ? 'bg-orange-50 border-orange-500' : 'bg-yellow-50 border-yellow-500'}`}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${reportType === 'lost' ? 'text-orange-600' : 'text-yellow-600'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 mb-2">
                        {reportType === 'lost' ? 'Lưu ý về báo mất thẻ:' : 'Lưu ý về báo hỏng thẻ:'}
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                        {reportType === 'lost' ? (
                          <>
                            <li>Bạn sẽ bị tính phí <strong>100,000 VNĐ</strong> để cấp thẻ mới</li>
                            <li>Thẻ cũ sẽ bị vô hiệu hóa ngay lập tức</li>
                            <li>Liên hệ ban quản lý để nhận thẻ mới</li>
                            <li>Hành động này không thể hoàn tác</li>
                          </>
                        ) : (
                          <>
                            <li>Bạn sẽ bị tính phí <strong>50,000 VNĐ</strong> để thay thẻ mới</li>
                            <li>Thẻ cũ sẽ bị vô hiệu hóa</li>
                            <li>Vui lòng mô tả rõ tình trạng hỏng</li>
                            <li>Liên hệ ban quản lý để nhận thẻ mới</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {reportType === 'damaged' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả tình trạng hỏng <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
                      rows={4}
                      placeholder="VD: Thẻ bị gãy góc, không quét được, mất từ tính..."
                      required
                    />
                  </div>
                )}

                {reportType === 'lost' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Xác nhận:</strong> Tôi xác nhận rằng tôi đã mất thẻ cư dân và đồng ý thanh toán phí cấp thẻ mới là 100,000 VNĐ.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportDescription('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmitReport}
                  className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                    reportType === 'lost' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  Xác Nhận Báo {reportType === 'lost' ? 'Mất' : 'Hỏng'}
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
