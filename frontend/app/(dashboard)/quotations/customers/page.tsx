'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { quotationCustomersApi } from '@/lib/api';
import { type CustomerInput, type QuotationCustomer, emptyCustomer } from '@/types/quotation';

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

export default function CustomersPage() {
  const [rows, setRows] = useState<QuotationCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<QuotationCustomer | null>(null);
  const [form, setForm] = useState<CustomerInput | null>(null);
  const [saving, setSaving] = useState(false);

  function load(q?: string) {
    setLoading(true);
    quotationCustomersApi
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
    setForm(emptyCustomer());
  }

  function openEdit(c: QuotationCustomer) {
    setEditing(c);
    setForm({ ...c });
  }

  async function save() {
    if (!form?.name?.trim()) {
      alert('กรุณาระบุชื่อลูกค้า');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const r = await quotationCustomersApi.update(editing.id, form);
        setRows((rs) => rs.map((c) => (c.id === editing.id ? r.data : c)));
      } else {
        const r = await quotationCustomersApi.create(form);
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
    if (!confirm('ลบลูกค้ารายนี้?')) return;
    setRows((r) => r.filter((c) => c.id !== id));
    try {
      await quotationCustomersApi.remove(id);
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
          <h1 className="text-xl font-bold text-slate-800 mt-1">ลูกค้า</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            ข้อมูลลูกค้าที่บันทึกไว้ — เลือกใช้ซ้ำได้ตอนสร้างใบเสนอราคาโดยไม่ต้องพิมพ์ใหม่ทุกครั้ง
          </p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + เพิ่มลูกค้า
        </button>
      </div>

      <input
        className={`${inputCls} max-w-xs`}
        placeholder="ค้นหาชื่อลูกค้า…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="text-slate-400 text-sm">กำลังโหลด…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-300 rounded-lg">
          ยังไม่มีข้อมูลลูกค้า — กด “เพิ่มลูกค้า”
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
                <th className="px-4 py-2.5 font-medium">ชื่อลูกค้า / บริษัท</th>
                <th className="px-4 py-2.5 font-medium">โทรศัพท์</th>
                <th className="px-4 py-2.5 font-medium">อีเมล</th>
                <th className="px-4 py-2.5 font-medium">เลขผู้เสียภาษี</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.phone || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.email || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500">{c.taxId || '—'}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(c)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(c.id)}
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
              {editing ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้า'}
            </h2>
            <div className="space-y-3">
              <Field label="ชื่อลูกค้า / บริษัท *">
                <input
                  className={inputCls}
                  autoFocus
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="โทรศัพท์">
                  <input
                    className={inputCls}
                    value={form.phone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </Field>
                <Field label="อีเมล">
                  <input
                    className={inputCls}
                    value={form.email ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <input
                  className={inputCls}
                  value={form.taxId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                />
              </Field>
              <Field label="ที่อยู่">
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.address ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </Field>
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
