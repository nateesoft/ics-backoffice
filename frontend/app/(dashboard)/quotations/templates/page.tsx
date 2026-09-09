'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quotationTemplatesApi } from '@/lib/api';
import type { QuotationTemplate } from '@/types/quotation';

export default function TemplatesPage() {
  const [rows, setRows] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    quotationTemplatesApi
      .getAll()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    quotationTemplatesApi
      .getAll()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function setDefault(id: number) {
    setRows((r) => r.map((t) => ({ ...t, isDefault: t.id === id })));
    try {
      await quotationTemplatesApi.setDefault(id);
    } catch {
      load();
    }
  }

  async function remove(id: number) {
    if (!confirm('ลบแม่แบบนี้?')) return;
    setRows((r) => r.filter((t) => t.id !== id));
    try {
      await quotationTemplatesApi.remove(id);
    } catch {
      load();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/quotations" className="text-sm text-slate-400 hover:text-slate-600">
            ← ใบเสนอราคา
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-1">แม่แบบใบเสนอราคา</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ออกแบบรูปแบบเอกสาร และกำหนดแม่แบบค่าเริ่มต้นที่จะใช้เมื่อสร้างใบเสนอราคาใหม่
          </p>
        </div>
        <Link
          href="/quotations/templates/new"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + สร้างแม่แบบ
        </Link>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">กำลังโหลด…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: t.layout?.accentColor || '#4f46e5' }}
                  />
                  <span className="font-semibold text-slate-800 truncate">{t.name}</span>
                </div>
                {t.isDefault && (
                  <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex-shrink-0">
                    ค่าเริ่มต้น
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div className="truncate">{t.layout?.companyName}</div>
                <div>
                  กระดาษ {t.layout?.paperSize} · {t.layout?.orientation === 'landscape' ? 'แนวนอน' : 'แนวตั้ง'}
                  {t.layout?.vatEnabled ? ` · VAT ${t.layout?.vatRate}%` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100">
                <Link
                  href={`/quotations/templates/${t.id}`}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
                >
                  แก้ไข
                </Link>
                {!t.isDefault && (
                  <button
                    onClick={() => setDefault(t.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 text-xs font-medium hover:bg-indigo-50"
                  >
                    ตั้งเป็นค่าเริ่มต้น
                  </button>
                )}
                <button
                  onClick={() => remove(t.id)}
                  className="ml-auto px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-600"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
