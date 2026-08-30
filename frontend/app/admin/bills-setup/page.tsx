'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { billsAPI } from '@/lib/api';
import { Bell, Plus, Trash2, Send, Edit2 } from 'lucide-react';

interface Service {
  name: string;
  unit_cost: number;
  number_of_units?: number;
  unit: string;
}

interface BillConfiguration {
  id: string;
  period?: string;
  services: Service[];
  status: 'draft' | 'active' | 'completed';
  created_at: string;
  published_at?: string;
}

export default function BillsSetupPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [configs, setConfigs] = useState<BillConfiguration[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Period is optional for price configurations; services only require unit_cost and unit
  const [period, setPeriod] = useState('');
  const [services, setServices] = useState<Service[]>([
    { name: 'Điện', unit_cost: 3500, unit: 'kWh' },
    { name: 'Nước', unit_cost: 8000, unit: 'm³' },
    { name: 'Vệ sinh', unit_cost: 50000, unit: 'căn' },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Redirect if not admin or manager
  useEffect(() => {
    if (!isLoading && user?.role !== 'admin' && user?.role !== 'manager') {
      router.push('/unauthorized');
    }
  }, [user, isLoading, router]);

  // Load configurations
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = async () => {
    try {
      setIsLoadingConfigs(true);
      const data = await billsAPI.getAllConfigurations();
      setConfigs(data.data || []);
    } catch (err) {
      console.error('Error loading configurations:', err);
    } finally {
      setIsLoadingConfigs(false);
    }
  };

  const calculateTotal = (servicesList: Service[]) => {
    return servicesList.reduce((sum, service) => {
      return sum + (service.unit_cost * (service.number_of_units || 0));
    }, 0);
  };

  const handleAddService = () => {
    setServices([...services, { name: '', unit_cost: 0, unit: '' }]);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: keyof Service, value: any) => {
    const newServices = [...services];
    if (field === 'unit_cost' || field === 'number_of_units') {
      // allow empty string for optional number_of_units
      newServices[index][field] = value === '' ? undefined : (isNaN(value) ? 0 : Number(value));
    } else {
      newServices[index][field] = value;
    }
    setServices(newServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate: period is optional for price configs
    if (services.length === 0) {
      setError('Vui lòng thêm ít nhất một dịch vụ');
      return;
    }

    // Check all services have required fields (number_of_units is optional)
    for (const service of services) {
      if (!service.name || service.unit_cost === undefined || service.unit_cost < 0 || !service.unit) {
        setError('Vui lòng điền đầy đủ thông tin dịch vụ (tên, giá/đơn vị, đơn vị)');
        return;
      }
      if (service.number_of_units !== undefined && service.number_of_units < 0) {
        setError('Số lượng mặc định phải là số không âm nếu được cung cấp');
        return;
      }
    }

    try {
      if (editingId) {
        // Update
        await billsAPI.updateConfiguration(editingId, period || undefined, services);
      } else {
        // Create
        await billsAPI.setupBills(period || undefined, services);
      }

      setSuccess(editingId ? 'Cập nhật cấu hình thành công' : 'Tạo cấu hình mới thành công');
      setShowForm(false);
      setEditingId(null);
      setPeriod('');
      setServices([
        { name: 'Điện', unit_cost: 3500, unit: 'kWh' },
        { name: 'Nước', unit_cost: 8000, unit: 'm³' },
        { name: 'Vệ sinh', unit_cost: 50000, unit: 'căn' },
      ]);
      loadConfigurations();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePublish = async (configId: string) => {
    setPublishingId(configId);
    try {
      await billsAPI.publishConfiguration(configId);

      setSuccess('Công bố cấu hình và thông báo cho tất cả khách hàng thành công');
      loadConfigurations();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPublishingId(null);
    }
  };

  const handleEdit = (config: BillConfiguration) => {
    setEditingId(config.id);
    setPeriod(config.period);
    setServices(config.services);
    setShowForm(true);
  };

  const handleDelete = async (configId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cấu hình này?')) return;

    try {
      await billsAPI.deleteConfiguration(configId);

      setSuccess('Xóa cấu hình thành công');
      loadConfigurations();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Toast helpers
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  };

  useEffect(() => {
    if (error) {
      addToast(error, 'error');
      setError('');
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      addToast(success, 'success');
      setSuccess('');
    }
  }, [success]);

  // Lock background scroll while form modal open
  useEffect(() => {
    if (showForm) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showForm]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <BackButton />

        {/* Toasts */}
        <div className="fixed right-4 top-20 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`max-w-xs px-4 py-2 rounded-lg shadow-sm text-sm flex items-center justify-between gap-3 border ${
                t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div>{t.message}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="text-blue-600 dark:text-blue-400" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cấu hình giá dịch vụ</h1>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setPeriod('');
              setServices([
                { name: 'Điện', unit_cost: 3500, number_of_units: 100, unit: 'kWh' },
                { name: 'Nước', unit_cost: 8000, number_of_units: 50, unit: 'm³' },
                { name: 'Vệ sinh', unit_cost: 50000, number_of_units: 1, unit: 'căn' },
              ]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            <Plus size={20} />
            Tạo mới
          </button>
        </div>

        

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingId(null); }} />
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingId ? 'Cập nhật cấu hình' : 'Tạo cấu hình mới'}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-3 py-1 rounded-md text-sm bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                  >
                    Hủy
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Đây là trang cấu hình giá dịch vụ. Nhập tên dịch vụ, đơn giá trên mỗi đơn vị và đơn vị đo (ví dụ: kWh, m³). Kỳ (period) là tùy chọn và chỉ cần khi bạn muốn gắn cấu hình cho một kỳ cụ thể.
                  </p>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kỳ (tùy chọn)</label>
                  <input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dịch vụ</h3>
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 transition"
                    >
                      <Plus size={16} />
                      Thêm
                    </button>
                  </div>

                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div key={index} className="p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <input
                            type="text"
                            placeholder="Tên dịch vụ (e.g., Điện)"
                            value={service.name}
                            onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-200"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Giá/đơn vị"
                            value={service.unit_cost}
                            onChange={(e) => handleServiceChange(index, 'unit_cost', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-200"
                          />
                          <input
                            type="number"
                            step="any"
                            placeholder="Số lượng mặc định (tùy chọn)"
                            value={service.number_of_units ?? ''}
                            onChange={(e) => handleServiceChange(index, 'number_of_units', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-200"
                          />
                          <input
                            type="text"
                            placeholder="Đơn vị (e.g., kWh)"
                            value={service.unit}
                            onChange={(e) => handleServiceChange(index, 'unit', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-900 text-sm focus:ring-2 focus:ring-blue-200"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {service.number_of_units ? (service.unit_cost * service.number_of_units).toLocaleString('vi-VN') + 'đ' : (service.unit_cost?.toLocaleString('vi-VN') + 'đ / ' + service.unit)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Tổng (dựa trên số lượng mặc định nếu có): {calculateTotal(services).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    {editingId ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoadingConfigs ? (
          <div className="text-center py-8">Đang tải cấu hình...</div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            Không có cấu hình giá dịch vụ nào. Hãy tạo một cấu hình mới.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {configs.map((config) => (
              <div
                key={config.id}
                className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {config.period ? `Kỳ ${config.period}` : 'Cấu hình giá chung'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tạo lúc: {new Date(config.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        config.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : config.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {config.status === 'draft'
                        ? 'Nháp'
                        : config.status === 'active'
                        ? 'Đã công bố'
                        : 'Hoàn thành'}
                    </span>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  {config.services.map((service, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        {service.name}: {service.unit_cost?.toLocaleString('vi-VN')}đ/{service.unit} {service.number_of_units ? `× ${service.number_of_units}` : ''}
                      </span>
                      <span className="font-semibold">
                        {(service.unit_cost * service.number_of_units).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between font-semibold text-gray-900 dark:text-white">
                      <span>Tổng:</span>
                      <span>{calculateTotal(config.services).toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {config.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleEdit(config)}
                        className="flex items-center gap-2 flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition text-sm"
                      >
                        <Edit2 size={16} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handlePublish(config.id)}
                        disabled={publishingId === config.id}
                        className="flex items-center gap-2 flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                        {publishingId === config.id ? 'Đang gửi...' : 'Công bố & Thông báo'}
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {config.status === 'active' && (
                    <div className="flex-1 px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg text-center text-sm font-medium">
                      ✓ Đã gửi thông báo đến tất cả khách hàng
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
