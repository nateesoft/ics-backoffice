'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quotationProductsApi } from '@/lib/api';
import { type ProductInput, type QuotationProduct, emptyProduct, formatMoney } from '@/types/quotation';

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

export default function ProductsPage() {
  const [rows, setRows] = useState<QuotationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<QuotationProduct | null>(null);
  const [form, setForm] = useState<ProductInput | null>(null);
  const [saving, setSaving] = useState(false);

  function load(q?: string) {
    setLoading(true);
    quotationProductsApi
      .getAll(q)
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search || undefined), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openNew() {
    setEditing(null);
    setForm(emptyProduct());
  }

  function openEdit(p: QuotationProduct) {
    setEditing(p);
    setForm({ ...p });
  }

  async function save() {
    if (!form?.name?.trim()) {
      alert('กรุณาระบุชื่อสินค้า/บริการ');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const r = await quotationProductsApi.update(editing.id, form);
        setRows((rs) => rs.map((p) => (p.id === editing.id ? r.data : p)));
      } else {
        const r = await quotationProductsApi.create(form);
        setRows((rs) => [...rs, r.data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setForm(null);
      setEditing(null);
    } catch {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('ลบรายการนี้?')) return;
    setRows((r) => r.filter((p) => p.id !== id));
    try {
      await quotationProductsApi.remove(id);
    } catch {
      load(search || undefined);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/quotations" className="text-sm text-slate-400 hover:text-slate-600">
            ← ใบเสนอราคา
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-1">สินค้า/บริการ</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            รายการสินค้า/บริการที่บันทึกไว้ — เลือกใช้ซ้ำได้ตอนเพิ่มรายการในใบเสนอราคาโดยไม่ต้องพิมพ์ใหม่ทุกครั้ง
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + เพิ่มรายการ
        </button>
      </div>

      <input
        className={`${inputCls} max-w-xs`}
        placeholder="ค้นหารายการ…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="text-slate-400 text-sm">กำลังโหลด…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-300 rounded-lg">
          ยังไม่มีข้อมูลสินค้า/บริการ — กด “เพิ่มรายการ”
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
                <th className="px-4 py-2.5 font-medium">รายการ</th>
                <th className="px-4 py-2.5 font-medium">หน่วย</th>
                <th className="px-4 py-2.5 font-medium">ราคา/หน่วย</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{p.unit || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{formatMoney(p.unitPrice)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-red-600"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">
              {editing ? 'แก้ไขสินค้า/บริการ' : 'เพิ่มสินค้า/บริการ'}
            </h2>
            <div className="space-y-3">
              <Field label="รายการ *">
                <input
                  className={inputCls}
                  autoFocus
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="หน่วย">
                  <input
                    className={inputCls}
                    value={form.unit ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </Field>
                <Field label="ราคา/หน่วย">
                  <input
                    className={inputCls}
                    type="number"
                    value={form.unitPrice ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                  />
                </Field>
              </div>
              <Field label="หมายเหตุ">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.note ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setForm(null);
                  setEditing(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
              >
                {saving ? 'กำลังบันทึก…' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
