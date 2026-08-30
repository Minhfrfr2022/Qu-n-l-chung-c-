"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { billsAPI } from '../../../lib/api';

type Service = {
  name: string;
  unit_cost: number;
  number_of_units?: number;
  unit?: string;
};

export default function SubmitBillsPage() {
  const router = useRouter();
  function closeModal() {
    router.push('/bills');
  }
  const [services, setServices] = useState<Service[]>([]);
  const [unitsMap, setUnitsMap] = useState<Record<string, number | ''>>({});
  const [aptId, setAptId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ apt_id: string; services: { name: string; units: number }[] }[] | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; type: 'error' | 'success' | 'info'; text: string }[]>([]);
  const [isPopupWindow, setIsPopupWindow] = useState(false);

  // Configurable apartment id regex (update as needed)
  const APT_ID_REGEX = /^[A-Za-z]\d{3,}$/; // e.g. A101

  function addToast(type: 'error' | 'success' | 'info', text: string, ttl = 4000) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, ttl);
  }

  useEffect(() => {
    // detect if opened as a popup or with ?popup=1 to render as standalone window
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const popupParam = params?.get('popup');
      if (typeof window !== 'undefined' && (window.opener || popupParam === '1')) setIsPopupWindow(true);
    } catch (e) {
      // ignore
    }
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
        }
      } catch (err) {
        console.error('Failed to load bill configuration', err);
      }
    })();
  }, []);

  function handleUnitChange(name: string, value: string) {
    setUnitsMap(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const units = Object.entries(unitsMap)
      .map(([name, v]) => ({ name, units: Number(v || 0) }))
      .filter(u => u.units > 0);

    if (!aptId) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mã căn hộ (apt_id)' });
      addToast('error', 'Vui lòng nhập mã căn hộ (apt_id)');
      return;
    }

    if (!APT_ID_REGEX.test(aptId)) {
      setMessage({ type: 'error', text: 'Mã căn hộ không hợp lệ (ví dụ A101)'});
      addToast('error', 'Mã căn hộ không hợp lệ (ví dụ A101)');
      return;
    }

    if (units.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng nhập ít nhất một số liệu' });
      return;
    }

    setLoading(true);
    try {
      await billsAPI.submitUnits(aptId, units as { name: string; units: number }[]);
      setMessage({ type: 'success', text: 'Gửi số liệu thành công' });
      addToast('success', 'Gửi số liệu thành công');
      // reset inputs
      const reset: Record<string, number | ''> = {};
      services.forEach(s => (reset[s.name] = ''));
      setUnitsMap(reset);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)) });
      addToast('error', 'Lỗi khi gửi số liệu: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  // CSV import handling
  function parseCSV(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));

    // If long format: headers include 'apt_id' and 'service' and 'units'
    const lowerHeaders = headers.map(h => h.toLowerCase());
    if (lowerHeaders.includes('apt_id') && lowerHeaders.includes('service') && lowerHeaders.includes('units')) {
      // long format -> aggregate by apt_id
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

    // Otherwise assume wide format: first column 'apt_id', other columns are service names
    if (!lowerHeaders.includes('apt_id')) return [];
    const idxA = lowerHeaders.indexOf('apt_id');
    const serviceHeaders = headers.filter((_, i) => i !== idxA);
    const out: { apt_id: string; services: { name: string; units: number }[] }[] = [];
    for (const r of rows) {
      const apt = r[idxA] || '';
      if (!apt) continue;
      const servicesRow: { name: string; units: number }[] = [];
      serviceHeaders.forEach((h, i) => {
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
      setMessage({ type: 'error', text: 'Không đọc được file. Vui lòng dùng định dạng CSV với cột apt_id và các dịch vụ hoặc định dạng dài (apt_id,service,units).' });
      addToast('error', 'Không đọc được file CSV hoặc định dạng không hợp lệ.');
      return;
    }

    // Normalize and trim fields for preview
    const cleaned = parsed.map(r => ({
      apt_id: (r.apt_id || '').trim(),
      services: (r.services || []).map(s => ({ name: (s.name || '').trim(), units: Number(String(s.units || 0).trim()) }))
    }));

    // Set preview and ask for confirmation via separate action
    setCsvPreview(cleaned as any);
    setMessage({ type: 'info', text: `Đọc được ${cleaned.length} hàng. Xem trước rồi bấm 'Gửi hàng loạt' để xác nhận.` });
  }

  async function handleConfirmBulkSubmit() {
    if (!csvPreview || csvPreview.length === 0) {
      setMessage({ type: 'error', text: 'Không có dữ liệu để gửi.' });
      addToast('error', 'Không có dữ liệu để gửi.');
      return;
    }
    // validate rows
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

    // submission is confirmed from the modal UI
    setLoading(true);
    try {
      await billsAPI.submitBulk(csvPreview as any);
      setMessage({ type: 'success', text: 'Gửi dữ liệu hàng loạt thành công' });
      addToast('success', 'Gửi dữ liệu hàng loạt thành công');
      setCsvPreview(null);
      setShowPreviewModal(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Lỗi khi gửi dữ liệu: ' + (err?.message || String(err)) });
      addToast('error', 'Lỗi khi gửi dữ liệu: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  if (isPopupWindow) {
    return (
      <div className="p-6 max-w-3xl mx-auto bg-white text-gray-900 rounded shadow-lg my-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Gửi số liệu tiêu thụ</h1>
          <div className="flex gap-2">
            <button onClick={() => window.close()} className="px-3 py-1 bg-gray-200 text-gray-900 rounded">Đóng</button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-800' : message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border p-4 rounded bg-gray-50 text-gray-900">
            <label className="block text-sm font-medium mb-2">Import từ CSV</label>
            <div className="flex items-center gap-3 mb-3">
              <input className="text-sm" type="file" accept="text/csv" onChange={handleFileUpload} />
              <button
                type="button"
                onClick={() => {
                  const wide = 'apt_id,Điện,Nước,Xe\nA101,120,15,1\nA102,95,12,0\n';
                  const blob = new Blob([wide], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'template_wide.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded"
              >Tải mẫu wide</button>
              <button
                type="button"
                onClick={() => {
                  const long = 'apt_id,service,units\nA101,Điện,120\nA101,Nước,15\nA102,Điện,95\n';
                  const blob = new Blob([long], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'template_long.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 bg-gray-200 text-gray-900 rounded"
              >Tải mẫu long</button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Hỗ trợ 2 định dạng CSV: (1) wide: columns: apt_id, Điện, Nước, Xe,...  or (2) long: apt_id,service,units</p>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Mã căn hộ (apt_id)</label>
            <input
              value={aptId}
              onChange={e => setAptId(e.target.value)}
              placeholder="A101"
              className="w-full px-3 py-2 border bg-white text-gray-900 rounded"
            />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Dịch vụ (nhập số lượng)</h2>
            <div className="space-y-3">
              {services.length === 0 && <div className="text-sm text-gray-500">Không có cấu hình hoá đơn đang hoạt động.</div>}
              {services.map(s => (
                <div key={s.name} className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-1 font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.unit ?? ''} • {s.unit_cost?.toLocaleString?.() ?? ''} VNĐ</div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={unitsMap[s.name] === undefined ? '' : unitsMap[s.name]}
                      onChange={e => handleUnitChange(s.name, e.target.value)}
                      className="w-full px-2 py-1 border bg-white text-gray-900 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi số liệu tiêu thụ'}
              </button>
              {csvPreview && (
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? 'Đang gửi...' : `Gửi hàng loạt (${csvPreview.length})`}
                </button>
              )}
            </div>
          </div>
        </form>

        {showPreviewModal && (
          <div className="mt-6 p-4 border rounded bg-gray-50 text-gray-900">
            <h3 className="font-semibold mb-2">Preview CSV ({csvPreview.length} rows)</h3>
            <div className="max-h-48 overflow-auto text-sm">
              {csvPreview.slice(0, 200).map((r, i) => (
                <div key={i} className="mb-2">
                  <strong className="text-gray-900">{r.apt_id}</strong>: {r.services.map(s => `${s.name}=${s.units}`).join(', ')}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-200 text-gray-900 rounded">Hủy</button>
              <button onClick={handleConfirmBulkSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">{loading ? 'Đang gửi...' : 'Xác nhận gửi'}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
      <div className="relative max-w-3xl w-full mx-4 bg-gray-900 text-gray-100 rounded shadow-lg p-6 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Gửi số liệu tiêu thụ</h1>
          <div className="flex gap-2">
            <button onClick={closeModal} className="px-3 py-1 bg-gray-700 text-white rounded">Đóng</button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-800 text-red-100' : message.type === 'success' ? 'bg-green-800 text-green-100' : 'bg-blue-800 text-blue-100'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border p-4 rounded bg-gray-800 border-gray-700 text-gray-200">
            <label className="block text-sm font-medium mb-2">Import từ CSV</label>
            <div className="flex items-center gap-3 mb-3">
              <input className="text-sm text-gray-200 bg-transparent" type="file" accept="text/csv" onChange={handleFileUpload} />
              <button
                type="button"
                onClick={() => {
                  const wide = 'apt_id,Điện,Nước,Xe\nA101,120,15,1\nA102,95,12,0\n';
                  const blob = new Blob([wide], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'template_wide.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >Tải mẫu wide</button>
              <button
                type="button"
                onClick={() => {
                  const long = 'apt_id,service,units\nA101,Điện,120\nA101,Nước,15\nA102,Điện,95\n';
                  const blob = new Blob([long], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'template_long.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 bg-gray-700 text-white rounded"
              >Tải mẫu long</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Hỗ trợ 2 định dạng CSV: (1) wide: columns: apt_id, Điện, Nước, Xe,...  or (2) long: apt_id,service,units</p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Mã căn hộ (apt_id)</label>
            <input
              value={aptId}
              onChange={e => setAptId(e.target.value)}
              placeholder="A101"
              className="w-full px-3 py-2 border border-gray-700 bg-transparent text-white rounded"
            />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Dịch vụ (nhập số lượng)</h2>
            <div className="space-y-3">
              {services.length === 0 && <div className="text-sm text-gray-500">Không có cấu hình hoá đơn đang hoạt động.</div>}
              {services.map(s => (
                <div key={s.name} className="grid grid-cols-3 gap-3 items-center">
                  <div className="col-span-1 font-medium">{s.name}</div>
                  <div className="text-sm text-gray-600">{s.unit ?? ''} • {s.unit_cost?.toLocaleString?.() ?? ''} VNĐ</div>
                  <div>
                    <input
                      type="number"
                      step="any"
                      min={0}
                      value={unitsMap[s.name] === undefined ? '' : unitsMap[s.name]}
                      onChange={e => handleUnitChange(s.name, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-700 bg-transparent text-white rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi số liệu tiêu thụ'}
              </button>
              {csvPreview && (
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? 'Đang gửi...' : `Gửi hàng loạt (${csvPreview.length})`}
                </button>
              )}
            </div>
          </div>
        </form>

        {showPreviewModal && (
          <div className="mt-6 p-4 border rounded bg-gray-800 border-gray-700 text-gray-200">
            <h3 className="font-semibold mb-2">Preview CSV ({csvPreview.length} rows)</h3>
            <div className="max-h-48 overflow-auto text-sm">
              {csvPreview.slice(0, 200).map((r, i) => (
                <div key={i} className="mb-2">
                  <strong className="text-white">{r.apt_id}</strong>: {r.services.map(s => `${s.name}=${s.units}`).join(', ')}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded">Hủy</button>
              <button onClick={handleConfirmBulkSubmit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">{loading ? 'Đang gửi...' : 'Xác nhận gửi'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
