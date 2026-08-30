"use client";

import React, { useEffect, useState } from "react";
import { residentAPI } from "@/lib/api";
import { apartmentAPI, type Apartment } from "@/lib/apartmentApi";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { Resident } from "@/types/resident";
import { Edit, Trash2, UserPlus, Users as UsersIcon } from "lucide-react";

export default function AdminResidentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apt, setApt] = useState('');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [form, setForm] = useState({ 
    full_name: '', 
    phone: '', 
    email: '', 
    is_owner: false, 
    yearOfBirth: '', 
    hometown: '', 
    gender: '' 
  });

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'manager'))) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => { if (user) fetchList(); }, [user, apt]);

  useEffect(() => { if (user) fetchApartments(); }, [user]);

  const fetchApartments = async () => {
    try {
      const { data } = await apartmentAPI.getAll({ page: 1, page_size: 200 });
      setApartments(data || []);
    } catch (err) {
      console.warn('Failed to fetch apartments for resident filter', err);
    }
  };

  const fetchList = async () => {
    try {
      setIsLoading(true);
      let data: any[] = [];
      if (!apt) {
        data = await residentAPI.listAll();
      } else {
        data = await residentAPI.listByApartment(apt);
      }
      setResidents(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load residents');
    } finally { setIsLoading(false); }
  };

  const handleCreate = async () => {
    if (!apt) {
      setModalError('Vui lòng chọn căn hộ trước khi thêm cư dân');
      return;
    }
    if (!form.full_name || !form.full_name.trim()) {
      setModalError('Họ và tên cư dân là bắt buộc');
      return;
    }
    try {
      setIsSubmitting(true);
      setModalError(null);
      await residentAPI.create({ apt_id: apt, ...form });
      // Đợi load xong danh sách hiển thị trên frontend mới đóng modal và mở khóa lệnh tiếp theo
      await Promise.all([fetchList(), fetchApartments()]);
      setShowForm(false);
      setForm({ full_name: '', phone: '', email: '', is_owner: false, yearOfBirth: '', hometown: '', gender: '' });
    } catch (err) { 
      setModalError(err instanceof Error ? err.message : 'Lỗi khi thêm cư dân'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setModalError(null);
    setForm({
      full_name: resident.full_name || '',
      phone: resident.phone || '',
      email: resident.email || '',
      is_owner: resident.is_owner || false,
      yearOfBirth: resident.yearOfBirth?.toString() || '',
      hometown: resident.hometown || '',
      gender: resident.gender || ''
    });
    setShowEditForm(true);
  };

  const handleUpdate = async () => {
    if (!editingResident) return;
    try {
      setIsSubmitting(true);
      setModalError(null);
      await residentAPI.update(editingResident.id, form);
      // Đợi load xong danh sách hiển thị trên frontend mới đóng modal
      await Promise.all([fetchList(), fetchApartments()]);
      setShowEditForm(false);
      setEditingResident(null);
      setForm({ full_name: '', phone: '', email: '', is_owner: false, yearOfBirth: '', hometown: '', gender: '' });
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi khi cập nhật cư dân');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa cư dân? Nếu là chủ hộ, cần chỉ định chủ hộ mới.')) return;
    try {
      setIsLoading(true);
      setError(null);
      await residentAPI.delete(id);
      await Promise.all([fetchList(), fetchApartments()]);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa cư dân'); 
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">Đang tải...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ">
      <Sidebar />
      <main className="ml-4 lg:ml-72 p-8 app-main text-slate-100 relative z-30">
        <Header />
        <div className="max-w-7xl mx-auto">
          <BackButton />
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Quản Lý Cư Dân</h1>
              <p className="text-slate-300">Quản lý thông tin cư dân trong chung cư</p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6 border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-400 mb-2">Lọc theo căn hộ</label>
                <select 
                  value={apt} 
                  onChange={e => setApt(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Tất cả căn hộ</option>
                  {apartments.map(a => (
                    <option key={a.apt_id} value={a.apt_id}>{a.apt_id} - {a.owner_name || 'Chưa có chủ hộ'}</option>
                  ))}
                </select>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => setShowForm(true)} 
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow font-medium"
                >
                  <UserPlus className="w-5 h-5" />
                  Thêm Cư Dân
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {residents.length === 0 ? (
              <div className="p-12 text-center">
                <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg text-slate-300">Không có cư dân</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Căn hộ</th>
                      <th className="px-6 py-4 text-left font-semibold">Họ tên</th>
                      <th className="px-6 py-4 text-left font-semibold">SĐT</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Vai trò</th>
                      <th className="px-6 py-4 text-left font-semibold">Năm sinh</th>
                      <th className="px-6 py-4 text-left font-semibold">Giới tính</th>
                      <th className="px-6 py-4 text-left font-semibold">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {residents.map(r => (
                      <tr key={r.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{r.apt_id}</td>
                        <td className="px-6 py-4 font-medium text-slate-100">{r.full_name}</td>
                        <td className="px-6 py-4 text-slate-200">{r.phone || '—'}</td>
                        <td className="px-6 py-4 text-slate-200">{r.email || '—'}</td>
                        <td className="px-6 py-4">
                          {r.is_owner ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
                              Chủ hộ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-500/20 text-slate-400 border border-slate-500/50">
                              Thành viên
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-200">{r.yearOfBirth || '—'}</td>
                        <td className="px-6 py-4 text-slate-200">{r.gender === 'male' ? 'Nam' : r.gender === 'female' ? 'Nữ' : r.gender || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEdit(r)} 
                              className="p-2 hover:bg-blue-900/50 rounded-lg transition-colors text-blue-300"
                              title="Sửa"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(r.id)} 
                              className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-300"
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
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-200 mb-6">Thêm Cư Dân Mới</h2>

                {modalError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {modalError}
                  </div>
                )}

                <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Căn hộ *</label>
                    <select 
                      value={apt} 
                      onChange={e => setApt(e.target.value)} 
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      required
                    >
                      <option value="">-- Chọn căn hộ --</option>
                      {apartments.map(a => (
                        <option key={a.apt_id} value={a.apt_id}>
                          {a.apt_id} - {a.owner_name || 'Chưa có chủ hộ'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Họ và tên *</label>
                      <input 
                        type="text"
                        placeholder="Nguyễn Văn A" 
                        value={form.full_name} 
                        onChange={e => setForm({...form, full_name: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Số điện thoại</label>
                      <input 
                        type="tel"
                        placeholder="0901234567" 
                        value={form.phone} 
                        onChange={e => setForm({...form, phone: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                    <input 
                      type="email"
                      placeholder="email@example.com" 
                      value={form.email} 
                      onChange={e => setForm({...form, email: e.target.value})} 
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Năm sinh</label>
                      <input 
                        type="number" 
                        placeholder="1990" 
                        value={form.yearOfBirth} 
                        onChange={e => setForm({...form, yearOfBirth: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Quê quán</label>
                      <input 
                        type="text"
                        placeholder="Hà Nội" 
                        value={form.hometown} 
                        onChange={e => setForm({...form, hometown: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Giới tính</label>
                      <select 
                        value={form.gender} 
                        onChange={e => setForm({...form, gender: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">-- Chọn --</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      id="is_owner" 
                      type="checkbox" 
                      checked={form.is_owner} 
                      onChange={e => setForm({...form, is_owner: e.target.checked})} 
                      className="h-4 w-4 text-blue-500 rounded border-slate-600 focus:ring-2 focus:ring-blue-500 bg-slate-700"
                    />
                    <label htmlFor="is_owner" className="text-sm font-medium text-slate-300 cursor-pointer">
                      Đánh dấu là chủ hộ (sẽ tự động thay thế chủ hộ cũ nếu có)
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)} 
                      disabled={isSubmitting}
                      className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      disabled={!form.full_name || !apt || isSubmitting} 
                      className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                        (!form.full_name || !apt || isSubmitting) 
                          ? 'bg-gray-600 cursor-not-allowed opacity-60' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? 'Đang lưu...' : 'Lưu Thông Tin'}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {showEditForm && editingResident && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
              <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-slate-200 mb-6">Chỉnh Sửa Cư Dân</h2>

                  {modalError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                      {modalError}
                    </div>
                  )}
                  
                  <form onSubmit={e => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Họ và tên *</label>
                        <input 
                          type="text"
                          placeholder="Nguyễn Văn A" 
                          value={form.full_name} 
                          onChange={e => setForm({...form, full_name: e.target.value})} 
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Số điện thoại</label>
                        <input 
                          type="tel"
                          placeholder="0901234567" 
                          value={form.phone} 
                          onChange={e => setForm({...form, phone: e.target.value})} 
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                      <input 
                        type="email"
                        placeholder="email@example.com" 
                        value={form.email} 
                        onChange={e => setForm({...form, email: e.target.value})} 
                        className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Năm sinh</label>
                        <input 
                          type="number" 
                          placeholder="1990" 
                          value={form.yearOfBirth} 
                          onChange={e => setForm({...form, yearOfBirth: e.target.value})} 
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Quê quán</label>
                        <input 
                          type="text"
                          placeholder="Hà Nội" 
                          value={form.hometown} 
                          onChange={e => setForm({...form, hometown: e.target.value})} 
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Giới tính</label>
                        <select 
                          value={form.gender} 
                          onChange={e => setForm({...form, gender: e.target.value})} 
                          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">-- Chọn --</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        id="is_owner_edit" 
                        type="checkbox" 
                        checked={form.is_owner} 
                        onChange={e => setForm({...form, is_owner: e.target.checked})} 
                        className="h-4 w-4 text-blue-500 rounded border-slate-600 focus:ring-2 focus:ring-blue-500 bg-slate-700"
                      />
                      <label htmlFor="is_owner_edit" className="text-sm font-medium text-slate-300 cursor-pointer">
                        Đánh dấu là chủ hộ (sẽ tự động thay thế chủ hộ cũ nếu có)
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => { setShowEditForm(false); setEditingResident(null); }} 
                        disabled={isSubmitting}
                        className="px-6 py-2 border border-slate-600 rounded-lg font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        Hủy
                      </button>
                      <button 
                        type="submit" 
                        disabled={!form.full_name || isSubmitting} 
                        className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                          (!form.full_name || isSubmitting) 
                            ? 'bg-gray-600 cursor-not-allowed opacity-60' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}



        </div>
      </main>
    </div>
  );
}