'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { expenseCategoriesApi } from '@/lib/api';
import { type ExpenseCategory, type ExpenseCategoryInput, emptyExpenseCategory } from '@/types/expense';

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

export default function ExpenseCategoriesPage() {
  const [rows, setRows] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState<ExpenseCategoryInput | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    expenseCategoriesApi
      .getAll()
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyExpenseCategory());
  }

  function openEdit(c: ExpenseCategory) {
    setEditing(c);
    setForm({ name: c.name, color: c.color });
  }

  async function save() {
    if (!form?.name?.trim()) {
      alert('กรุณาระบุชื่อหมวดหมู่');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const r = await expenseCategoriesApi.update(editing.id, form);
        setRows((rs) => rs.map((c) => (c.id === editing.id ? r.data : c)));
      } else {
        const r = await expenseCategoriesApi.create(form);
        setRows((rs) => [...rs, r.data]);
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
    if (!confirm('ลบหมวดหมู่นี้? — รายการค่าใช้จ่ายที่เคยผูกไว้จะยังอยู่ แต่จะกลายเป็น "ไม่ระบุหมวดหมู่"')) return;
    setRows((r) => r.filter((c) => c.id !== id));
    try {
      await expenseCategoriesApi.remove(id);
    } catch {
      load();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/expenses" className="text-sm text-slate-400 hover:text-slate-600">
            ← ค่าใช้จ่ายรายวัน
          </Link>
          <h1 className="text-xl font-bold text-slate-800 mt-1">หมวดหมู่ค่าใช้จ่าย</h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการหมวดหมู่สำหรับแยกประเภทค่าใช้จ่าย</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          + เพิ่มหมวดหมู่
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">กำลังโหลด…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-300 rounded-lg">
          ยังไม่มีหมวดหมู่ — กด “เพิ่มหมวดหมู่”
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
                <th className="px-4 py-2.5 font-medium">สี</th>
                <th className="px-4 py-2.5 font-medium">ชื่อหมวดหมู่</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ background: c.color }} />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-sm p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-800">
              {editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
            </h2>
            <div className="space-y-3">
              <Field label="ชื่อหมวดหมู่ *">
                <input
                  className={inputCls}
                  autoFocus
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="สี">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                    value={form.color ?? '#6366f1'}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  />
                  <input
                    className={inputCls}
                    value={form.color ?? '#6366f1'}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  />
                </div>
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
