'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quotationsApi } from '@/lib/api';
import {
  type Quotation,
  STATUS_LABEL,
  computeTotals,
  formatMoney,
} from '@/types/quotation';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  accepted: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function QuotationsPage() {
  const [rows, setRows] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  function load() {
    setLoading(true);
    quotationsApi
      .getAll()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    quotationsApi
      .getAll()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: number) {
    if (!confirm('ลบใบเสนอราคานี้?')) return;
    setRows((r) => r.filter((x) => x.id !== id));
    try {
      await quotationsApi.remove(id);
    } catch {
      load();
    }
  }

  const filtered = rows.filter(
    (r) =>
      !q ||
      r.quotationNo.toLowerCase().includes(q.toLowerCase()) ||
      r.customerName.toLowerCase().includes(q.toLowerCase()) ||
      r.projectName.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ใบเสนอราคา</h1>
          <p className="text-sm text-slate-500 mt-0.5">สร้าง ออกแบบ และพิมพ์ใบเสนอราคา</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/quotations/templates"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            แม่แบบ
          </Link>
          <Link
            href="/quotations/new"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            + ใบเสนอราคาใหม่
          </Link>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ค้นหา เลขที่ / ลูกค้า / โครงการ…"
        className="w-full sm:w-80 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
      />

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-semibold px-4 py-3">เลขที่</th>
                <th className="text-left font-semibold px-4 py-3">ลูกค้า</th>
                <th className="text-left font-semibold px-4 py-3">โครงการ</th>
                <th className="text-left font-semibold px-4 py-3">วันที่</th>
                <th className="text-right font-semibold px-4 py-3">ยอดรวม</th>
                <th className="text-center font-semibold px-4 py-3">สถานะ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    กำลังโหลด…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    ยังไม่มีใบเสนอราคา
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const total = computeTotals(r.items, {
                    discount: r.discount,
                    vatRate: r.vatRate,
                    withholdingRate: r.withholdingRate,
                  });
                  return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <Link href={`/quotations/${r.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                          {r.quotationNo || `#${r.id}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{r.customerName || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.projectName || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{r.issueDate || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatMoney(total.grandTotal)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] ?? ''}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => remove(r.id)}
                          className="text-slate-400 hover:text-red-600 text-xs"
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
