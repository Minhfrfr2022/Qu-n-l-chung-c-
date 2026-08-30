"use client"
import React, { useEffect, useState } from 'react'
import { billsAPI } from '../lib/api'

type Service = {
  name: string;
  unit_cost: number;
  number_of_units?: number;
  unit?: string;
};

export default function SubmitBillsModal({ isOpen, onClose, period: propPeriod, onSubmitted }: { isOpen: boolean; onClose: () => void; period?: string | null; onSubmitted?: () => void | Promise<void> }) {
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
        if (p && Array.isArray(p.periods)) setAvailablePeriods(p.periods);
        else setAvailablePeriods([]);
      } catch (e) {
        console.warn('Failed to load available periods', e);
        setAvailablePeriods([]);
        addToast('error', 'Không tải được danh sách kỳ thanh toán. Vui lòng thử lại.');
      } finally {
        setLoadingPeriods(false);
      }
    })();
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

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
    if (!lowerHeaders.includes('apt_id')) return [];
    const idxA = lowerHeaders.indexOf('apt_id');
    const serviceHeaders = headers.filter((_, i) => i !== idxA);
    const out: { apt_id: string; services: { name: string; units: number }[] }[] = [];
    for (const r of rows) {
      const apt = r[idxA] || '';
      if (!apt) continue;
      const servicesRow: { name: string; units: number }[] = [];
      serviceHeaders.forEach((h) => {
        const colIdx = headers.indexOf(h);
        const val = Number(r[colIdx] || 0);
        if (!isNaN(val) && val > 0) servicesRow.push({ name: h, units: val });
      });
      out.push({ apt_id: apt, services: servicesRow });
    }
    return out;
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseCSV(text);
    if (!parsed || parsed.length === 0) {
      setMessage({ type: 'error', text: 'Không đọc được file. Vui lòng dùng định dạng CSV hợp lệ.' });
      addToast('error', 'Không đọc được file CSV hoặc định dạng không hợp lệ.');
      return;
    }
    const cleaned = parsed.map(r => ({ apt_id: (r.apt_id || '').trim(), services: (r.services || []).map(s => ({ name: (s.name || '').trim(), units: Number(String(s.units || 0).trim()) })) }));
    setCsvPreview(cleaned as any);
    setMessage({ type: 'info', text: `Đọc được ${cleaned.length} hàng. Xem trước rồi bấm 'Gửi hàng loạt' để xác nhận.` });
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
        setTimeout(() => onClose(), 2500);
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
    const units = Object.entries(unitsMap).map(([name, v]) => ({ name, units: Number(v || 0) })).filter(u => u.units > 0);
    if (!aptId) { setMessage({ type: 'error', text: 'Vui lòng nhập mã căn hộ (apt_id)' }); addToast('error', 'Vui lòng nhập mã căn hộ (apt_id)'); return; }
    if (!APT_ID_REGEX.test(aptId)) { setMessage({ type: 'error', text: 'Mã căn hộ không hợp lệ (ví dụ A101)' }); addToast('error', 'Mã căn hộ không hợp lệ (ví dụ A101)'); return; }
    if (units.length === 0) { setMessage({ type: 'error', text: 'Vui lòng nhập ít nhất một số liệu' }); return; }
    setLoading(true);
    try {
      const usedPeriod = propPeriod || period;
      if (!usedPeriod) {
        setMessage({ type: 'error', text: 'Vui lòng chọn kỳ thanh toán trên trang Hóa đơn trước khi gửi.' });
        addToast('error', 'Vui lòng chọn kỳ thanh toán.');
        setLoading(false);
        return;
      }
      await billsAPI.submitUnits(aptId, units as { name: string; units: number }[], usedPeriod);
      setMessage({ type: 'success', text: 'Gửi số liệu thành công' });
      addToast('success', 'Gửi số liệu thành công');
      const reset: Record<string, number | ''> = {};
      services.forEach(s => (reset[s.name] = ''));
      setUnitsMap(reset);
      if (onSubmitted) await onSubmitted();
      onClose();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)) });
      addToast('error', 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)));
    } finally { setLoading(false); }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-w-3xl w-full mx-4 bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-auto transform transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Gửi số liệu tiêu thụ</h1>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1 bg-gray-700/60 hover:bg-gray-700 text-white rounded-md transition">Đóng</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-300 mb-1">Kỳ thanh toán</label>
          <div>
            <div className="flex gap-2 items-center">
              <input list="periods" type="month" value={period} onChange={e => setPeriod(e.target.value)} className="px-3 py-2 border border-gray-700 bg-gray-800/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-full" />
              <button type="button" onClick={async () => {
                setLoadingPeriods(true);
                try {
                  const p = await billsAPI.getAvailablePeriods();
                  if (p && Array.isArray(p.periods)) setAvailablePeriods(p.periods);
                  else setAvailablePeriods([]);
                } catch (e) {
                  addToast('error', 'Không tải được danh sách kỳ thanh toán.');
                } finally { setLoadingPeriods(false); }
              }} className="px-3 py-2 bg-gray-700/60 text-white rounded-md">Làm mới</button>
            </div>
            <datalist id="periods">
              {availablePeriods?.map(p => <option key={p} value={p} />)}
            </datalist>
            <p className="text-xs text-gray-400 mt-1">Bạn có thể chọn kỳ từ danh sách hoặc nhập thủ công. {loadingPeriods ? 'Đang tải...' : (availablePeriods && availablePeriods.length === 0 ? 'Không có kỳ đã phát hành.' : '')}</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-700/80 text-red-50' : message.type === 'success' ? 'bg-green-700/80 text-green-50' : 'bg-blue-700/80 text-blue-50'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border p-4 rounded-lg bg-gray-800/60 border-gray-700 text-gray-200">
            <label className="block text-sm font-medium mb-2">Import từ CSV</label>
            <div className="flex items-center gap-3 mb-3">
              <input className="text-sm text-gray-200 bg-transparent px-2 py-1 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" type="file" accept="text/csv" onChange={handleFileUpload} />
              <button type="button" onClick={() => { const wide = 'apt_id,Điện,Nước,Xe\nA101,120,15,1\nA102,95,12,0\n'; const blob = new Blob([wide], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'template_wide.csv'; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1 bg-gray-700/60 hover:bg-gray-700 text-white rounded-md transition">Tải mẫu wide</button>
              <button type="button" onClick={() => { const long = 'apt_id,service,units\nA101,Điện,120\nA101,Nước,15\nA102,Điện,95\n'; const blob = new Blob([long], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'template_long.csv'; a.click(); URL.revokeObjectURL(url); }} className="px-3 py-1 bg-gray-700/60 hover:bg-gray-700 text-white rounded-md transition">Tải mẫu long</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Hỗ trợ 2 định dạng CSV: (1) wide: columns: apt_id, Điện, Nước, Xe,...  or (2) long: apt_id,service,units</p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Mã căn hộ (apt_id)</label>
            <input value={aptId} onChange={e => setAptId(e.target.value)} placeholder="A101" className="w-full px-3 py-2 border border-gray-700 bg-gray-800/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Dịch vụ (nhập số lượng)</h2>
            <div className="space-y-3">
              {services.length === 0 && <div className="text-sm text-gray-500">Không có cấu hình hoá đơn đang hoạt động.</div>}
              {services.map(s => (
                <div key={s.name} className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-1 font-medium">{s.name}</div>
                  <div className="text-sm text-gray-400">{s.unit ?? ''} • {s.unit_cost?.toLocaleString?.() ?? ''} VNĐ</div>
                  <div>
                    <input type="number" step="any" min={0} value={unitsMap[s.name] === undefined ? '' : unitsMap[s.name]} onChange={e => handleUnitChange(s.name, e.target.value)} className="w-full px-2 py-1 border border-gray-700 bg-gray-800/20 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-500 shadow-md hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-md transition disabled:opacity-60">{loading ? 'Đang gửi...' : 'Gửi số liệu tiêu thụ'}</button>
              {csvPreview && (<button type="button" onClick={() => setShowPreviewModal(true)} disabled={loading} className="bg-gradient-to-r from-green-600 to-green-500 shadow-md hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-md transition disabled:opacity-60">{loading ? 'Đang gửi...' : `Gửi hàng loạt (${csvPreview.length})`}</button>)}
            </div>
          </div>
        </form>

        {showPreviewModal && (
          <div className="mt-6 p-4 border rounded-lg bg-gray-800/60 border-gray-700 text-gray-200">
            <h3 className="font-semibold mb-2">Preview CSV ({csvPreview.length} rows)</h3>
            <div className="max-h-48 overflow-auto text-sm space-y-2">
              {csvPreview.slice(0, 200).map((r, i) => (
                <div key={i} className="mb-2 flex gap-3 items-start">
                  <div className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-200">{i + 1}</div>
                  <div className="min-w-[90px] px-2 py-0.5 bg-gray-700 rounded text-sm font-medium">{r.apt_id}</div>
                  <div className="flex-1 text-gray-200">{r.services.map(s => <span key={s.name} className="inline-block mr-2">{s.name}: <strong className="font-medium">{s.units}</strong></span>)}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-700/60 text-white rounded-md">Hủy</button>
              <button onClick={handleConfirmBulkSubmit} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:from-green-700 hover:to-green-600 disabled:opacity-60">{loading ? 'Đang gửi...' : 'Xác nhận gửi'}</button>
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
