"use client"
import React, { useEffect, useState } from 'react'
import { billsAPI } from '../lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/auth'

type Service = {
  name: string;
  unit_cost: number;
  number_of_units?: number;
  unit?: string;
};

export default function SubmitBillsModal({ isOpen, onClose, period: propPeriod, onSubmitted }: { isOpen: boolean; onClose: () => void; period?: string | null; onSubmitted?: () => void | Promise<void> }) {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  const [services, setServices] = useState<Service[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, number | ''>>({});
  const [aptId, setAptId] = useState('');
  const [period, setPeriod] = useState<string>(propPeriod || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ apt_id: string; services: { name: string; units: number }[] }[] | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'error' | 'success' | 'info'; text: string }[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<string[] | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const APT_ID_REGEX = /^[A-Za-z0-9\-_]{2,}$/;

  function addToast(type: 'error' | 'success' | 'info', text: string, ttl = 4000) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ttl);
  }

  useEffect(() => {
    if (!isOpen) return;
    if (propPeriod) {
      setPeriod(propPeriod);
    }
    if (user?.apartmentNumber && !isAdmin) {
      setAptId(user.apartmentNumber);
    }
    // lock background scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (async () => {
      try {
        const res = await billsAPI.getAllConfigurations('active');
        const cfg = res?.data?.[0];
        if (cfg?.services) {
          setServices(cfg.services);
          const initial: Record<string, number | ''> = {};
          cfg.services.forEach((s: Service) => {
            initial[s.name] = s.number_of_units ?? '';
          });
          setUnitsMap(initial);
          // prefill period from active configuration
          if (cfg.period && !propPeriod) setPeriod(cfg.period);
        }
      } catch (err) {
        console.error('Failed to load bill configuration', err);
      }

      // load available periods separately and surface errors
      setLoadingPeriods(true);
      try {
        const p = await billsAPI.getAvailablePeriods();
        if (p && Array.isArray(p.periods)) {
          setAvailablePeriods(p.periods);
          if (!propPeriod && !period && p.periods.length > 0) {
            setPeriod(p.periods[0]);
          }
        } else {
          setAvailablePeriods([]);
        }
      } catch (e) {
        console.warn('Failed to load available periods', e);
        setAvailablePeriods([]);
        addToast('error', 'Không tải được danh sách kỳ thanh toán. Vui lòng thử lại.');
      } finally {
        setLoadingPeriods(false);
      }
    })();
    return () => { document.body.style.overflow = prev; };
  }, [isOpen, propPeriod, user, isAdmin]);

  function handleUnitChange(name: string, value: string) {
    setUnitsMap(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  }

  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
    const lowerHeaders = headers.map(h => h.toLowerCase());
    if (lowerHeaders.includes('apt_id') && lowerHeaders.includes('service') && lowerHeaders.includes('units')) {
      const idxA = lowerHeaders.indexOf('apt_id');
      const idxS = lowerHeaders.indexOf('service');
      const idxU = lowerHeaders.indexOf('units');
      const map: Record<string, { name: string; units: number }[]> = {};
      for (const r of rows) {
        const apt = r[idxA] || '';
        const svc = r[idxS] || '';
        const u = Number(r[idxU] || 0);
        if (!apt || !svc) continue;
        if (!map[apt]) map[apt] = [];
        map[apt].push({ name: svc, units: u });
      }
      return Object.entries(map).map(([apt, services]) => ({ apt_id: apt, services }));
    }
    const aptIndex = lowerHeaders.indexOf('apt_id');
    if (aptIndex === -1) return [];
    const result: { apt_id: string; services: { name: string; units: number }[] }[] = [];
    for (const r of rows) {
      const apt = r[aptIndex] || '';
      if (!apt) continue;
      const svcs: { name: string; units: number }[] = [];
      headers.forEach((h, i) => {
        if (i === aptIndex) return;
        const val = Number(r[i] || 0);
        svcs.push({ name: h, units: isNaN(val) ? 0 : val });
      });
      result.push({ apt_id: apt, services: svcs });
    }
    return result;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setMessage({ type: 'error', text: 'Không đọc được dữ liệu từ CSV. Kiểm tra lại định dạng file.' });
          addToast('error', 'CSV không hợp lệ.');
          return;
        }
        const cleaned = parsed.map(r => ({
          apt_id: r.apt_id,
          services: r.services.filter(s => services.length === 0 || services.some(cs => cs.name.toLowerCase() === s.name.toLowerCase())),
        }));
        setCsvPreview(cleaned as any);
        setMessage({ type: 'info', text: `Đọc được ${cleaned.length} hàng. Xem trước rồi bấm 'Gửi hàng loạt' để xác nhận.` });
      } catch (err: any) {
        setMessage({ type: 'error', text: 'Lỗi khi đọc file CSV: ' + err.message });
      }
    };
    reader.readAsText(f);
  }

  async function handleConfirmBulkSubmit() {
    if (!csvPreview || csvPreview.length === 0) {
      setMessage({ type: 'error', text: 'Không có dữ liệu để gửi.' });
      addToast('error', 'Không có dữ liệu để gửi.');
      return;
    }
    const invalidRows: string[] = [];
    csvPreview.forEach((r, idx) => {
      if (!r.apt_id || !APT_ID_REGEX.test(r.apt_id)) invalidRows.push(`${idx + 1}`);
      for (const s of r.services) {
        if (isNaN(Number(s.units)) || Number(s.units) < 0) invalidRows.push(`${idx + 1}`);
      }
    });
    if (invalidRows.length > 0) {
      const msg = `Các hàng không hợp lệ: ${[...new Set(invalidRows)].join(', ')}`;
      setMessage({ type: 'error', text: msg });
      addToast('error', msg);
      return;
    }
    setLoading(true);
    try {
      // period must be supplied by parent page via propPeriod or prefilled config
      const usedPeriod = propPeriod || period;
      if (!usedPeriod) {
        setMessage({ type: 'error', text: 'Vui lòng chọn kỳ thanh toán trước khi gửi hàng loạt.' });
        addToast('error', 'Vui lòng chọn kỳ thanh toán.');
        setLoading(false);
        return;
      }
      const res = await billsAPI.submitBulk(csvPreview as any, usedPeriod);
      const processed = res?.processed || [];
      const errors = processed.filter((p: any) => p.status === 'error');
      const success = processed.filter((p: any) => p.status === 'ok');

      if (errors.length > 0 && success.length === 0) {
        const errorDetails = errors.map((e: any) => `${e.apt_id}: ${e.message}`).join('; ');
        setMessage({ type: 'error', text: `Gửi thất bại: ${errorDetails}` });
        addToast('error', `Gửi thất bại: ${errorDetails}`);
      } else if (errors.length > 0) {
        setMessage({ type: 'info', text: `Đã cập nhật ${success.length} căn hộ. Có ${errors.length} lỗi: ${errors.map((e: any) => e.apt_id).join(', ')}` });
        addToast('info', `Cập nhật ${success.length} căn hộ thành công, ${errors.length} căn hộ lỗi.`);
        if (onSubmitted) await onSubmitted();
        setTimeout(() => onClose(), 2000);
      } else {
        setMessage({ type: 'success', text: `Gửi dữ liệu hàng loạt thành công cho ${success.length || csvPreview.length} căn hộ!` });
        addToast('success', `Đã lưu thành công ${success.length || csvPreview.length} căn hộ vào hệ thống!`);
        setCsvPreview(null);
        setShowPreviewModal(false);
        if (onSubmitted) await onSubmitted();
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi khi gửi dữ liệu: ' + (err?.message || String(err)) });
      addToast('error', 'Lỗi khi gửi dữ liệu: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveAptId = (!isAdmin && user?.apartmentNumber) ? user.apartmentNumber : aptId;
    const units = Object.entries(unitsMap).map(([name, v]) => ({ name, units: Number(v || 0) })).filter(u => u.units > 0);
    if (!effectiveAptId) { setMessage({ type: 'error', text: 'Vui lòng nhập mã căn hộ (apt_id)' }); addToast('error', 'Vui lòng nhập mã căn hộ (apt_id)'); return; }
    if (!APT_ID_REGEX.test(effectiveAptId)) { setMessage({ type: 'error', text: 'Mã căn hộ không hợp lệ (ví dụ A101)' }); addToast('error', 'Mã căn hộ không hợp lệ (ví dụ A101)'); return; }
    if (units.length === 0) { setMessage({ type: 'error', text: 'Vui lòng nhập ít nhất một số liệu' }); return; }
    setLoading(true);
    try {
      const usedPeriod = propPeriod || period;
      if (!usedPeriod) {
        setMessage({ type: 'error', text: 'Vui lòng chọn kỳ thanh toán trước khi gửi.' });
        addToast('error', 'Vui lòng chọn kỳ thanh toán.');
        setLoading(false);
        return;
      }
      await billsAPI.submitUnits(effectiveAptId, units as { name: string; units: number }[], usedPeriod);
      setMessage({ type: 'success', text: 'Gửi số liệu thành công! Đang đồng bộ danh sách hóa đơn...' });
      addToast('success', 'Gửi số liệu tiêu thụ thành công!');
      const reset: Record<string, number | ''> = {};
      services.forEach(s => (reset[s.name] = ''));
      setUnitsMap(reset);
      
      // Auto-refresh the bills table
      if (onSubmitted) await onSubmitted();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)) });
      addToast('error', 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)));
    } finally { setLoading(false); }
  }

  // Calculate live estimated total
  const estimatedTotal = services.reduce((sum, s) => sum + (Number(unitsMap[s.name] || 0) * (s.unit_cost || 0)), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-3xl w-full mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl p-6 max-h-[90vh] overflow-auto transform transition-all duration-200">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>🚰</span> Gửi số liệu tiêu thụ
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin ? 'Nhập số liệu tiêu thụ điện/nước cho căn hộ hoặc import hàng loạt' : `Gửi số liệu tiêu thụ định kỳ cho căn hộ ${user?.apartmentNumber || ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition border border-slate-700">Đóng</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1">Kỳ thanh toán</label>
          <div>
            <div className="flex gap-2 items-center">
              <input list="periods" type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-slate-700 bg-slate-950/60 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full" />
              <button type="button" onClick={async () => {
                setLoadingPeriods(true);
                try {
                  const p = await billsAPI.getAvailablePeriods();
                  if (p && Array.isArray(p.periods)) setAvailablePeriods(p.periods);
                  else setAvailablePeriods([]);
                } catch (e) {
                  addToast('error', 'Không tải được danh sách kỳ thanh toán.');
                } finally { setLoadingPeriods(false); }
              }} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm border border-slate-700 flex-shrink-0">Làm mới</button>
            </div>
            <datalist id="periods">
              {availablePeriods?.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div className="border p-4 rounded-xl bg-slate-950/40 border-slate-700/60 text-slate-200">
              <label className="block text-sm font-medium mb-2 text-purple-300">Import hàng loạt từ CSV (Admin)</label>
              <div className="flex items-center gap-3 mb-2">
                <input className="text-sm text-slate-200 bg-slate-900 px-2 py-1 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" type="file" accept="text/csv" onChange={handleFileUpload} />
                <button type="button" onClick={() => { const wide = 'apt_id,Điện,Nước,Xe\nA101,120,15,1\nA102,95,12,0\n'; const blob = new Blob([wide], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'template_wide.csv'; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700">Tải mẫu wide</button>
                <button type="button" onClick={() => { const long = 'apt_id,service,units\nA101,Điện,120\nA101,Nước,15\nA102,Điện,95\n'; const blob = new Blob([long], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'template_long.csv'; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition border border-slate-700">Tải mẫu long</button>
              </div>
              <p className="text-xs text-slate-400">Hỗ trợ 2 định dạng CSV: (1) wide: columns: apt_id, Điện, Nước, Xe,... hoặc (2) long: apt_id,service,units</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Mã căn hộ {!isAdmin && <span className="text-xs text-slate-400">(Tự động theo tài khoản của bạn)</span>}
            </label>
            <input 
              value={!isAdmin && user?.apartmentNumber ? user.apartmentNumber : aptId} 
              onChange={e => setAptId(e.target.value)} 
              disabled={!isAdmin && !!user?.apartmentNumber}
              placeholder="VD: A101" 
              className={`w-full px-3 py-2.5 border rounded-xl transition ${!isAdmin && !!user?.apartmentNumber ? 'bg-slate-800/40 border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-950/60 border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'}`} 
            />
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-300 mb-2">Dịch vụ (Nhập số lượng sử dụng)</h2>
            <div className="space-y-2.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              {services.length === 0 && <div className="text-sm text-slate-500">Đang tải cấu hình đơn giá dịch vụ...</div>}
              {services.map(s => (
                <div key={s.name} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-4 font-medium text-sm text-slate-200">{s.name}</div>
                  <div className="col-span-4 text-xs text-slate-400">{s.unit ?? ''} • {s.unit_cost?.toLocaleString('vi-VN') ?? ''} đ</div>
                  <div className="col-span-4">
                    <input 
                      type="number" 
                      step="any" 
                      min={0} 
                      placeholder="0"
                      value={unitsMap[s.name] === undefined ? '' : unitsMap[s.name]} 
                      onChange={e => handleUnitChange(s.name, e.target.value)} 
                      className="w-full px-3 py-1.5 border border-slate-700 bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-right font-medium" 
                    />
                  </div>
                </div>
              ))}

              {/* Live estimated total display */}
              {estimatedTotal > 0 && (
                <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng tiền tạm tính:</span>
                  <span className="text-base font-bold text-green-400">{estimatedTotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-3">
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? 'Đang ghi nhận...' : 'Gửi số liệu tiêu thụ'}
              </button>
              {isAdmin && csvPreview && (
                <button 
                  type="button" 
                  onClick={() => setShowPreviewModal(true)} 
                  disabled={loading} 
                  className="py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30 disabled:opacity-60"
                >
                  {loading ? 'Đang gửi...' : `Gửi hàng loạt (${csvPreview.length})`}
                </button>
              )}
            </div>
          </div>
        </form>

        {showPreviewModal && (
          <div className="mt-6 p-4 border rounded-xl bg-slate-950/80 border-slate-700 text-slate-200">
            <h3 className="font-semibold mb-2">Xem trước CSV ({csvPreview?.length} căn hộ)</h3>
            <div className="max-h-48 overflow-auto text-sm space-y-2">
              {csvPreview?.slice(0, 200).map((r, i) => (
                <div key={i} className="mb-2 flex gap-3 items-start bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <div className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-400">{i + 1}</div>
                  <div className="min-w-[70px] font-bold text-slate-100">{r.apt_id}</div>
                  <div className="flex-1 text-slate-300 text-xs">{r.services.map(s => <span key={s.name} className="inline-block mr-3">{s.name}: <strong className="text-white">{s.units}</strong></span>)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">Hủy</button>
              <button onClick={handleConfirmBulkSubmit} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-500 font-semibold">{loading ? 'Đang gửi...' : 'Xác nhận gửi'}</button>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-60">
          {toasts.map(t => (
            <div key={t.id} className={`px-3 py-2 rounded-md shadow-md text-sm ${t.type === 'error' ? 'bg-red-600 text-white' : t.type === 'success' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
