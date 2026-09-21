'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { expensesApi, expenseCategoriesApi } from '@/lib/api';
import {
  type Expense,
  type ExpenseInput,
  type ExpenseCategory,
  type ExpenseSummary,
  emptyExpense,
  todayStr,
  formatBaht,
  mapsUrl,
} from '@/types/expense';
import Modal from '@/components/ui/Modal';
import ExpenseCategoryBarChart from '@/components/expenses/ExpenseCategoryBarChart';
import { printExpenseReport } from '@/components/expenses/renderExpenseReport';

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

function firstOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const PERIOD_LABEL: Record<'day' | 'month' | 'year', string> = {
  day: 'วันนี้',
  month: 'เดือนนี้',
  year: 'ปีนี้',
};

export default function ExpensesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(todayStr());
  const [filterCategoryId, setFilterCategoryId] = useState<number | ''>('');

  const [summaryDate, setSummaryDate] = useState(todayStr());
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [summaryPeriod, setSummaryPeriod] = useState<'day' | 'month' | 'year'>('month');

  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseInput | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  function loadCategories() {
    expenseCategoriesApi
      .getAll()
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }

  function loadRows() {
    setLoading(true);
    expensesApi
      .getAll({ from, to, categoryId: filterCategoryId === '' ? undefined : filterCategoryId })
      .then((r) => setRows(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function loadSummary() {
    expensesApi
      .getSummary(summaryDate)
      .then((r) => setSummary(r.data))
      .catch(() => {});
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, filterCategoryId]);

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryDate]);

  function openNew() {
    setEditing(null);
    setForm(emptyExpense());
    setPendingFiles([]);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({
      date: e.date,
      categoryId: e.categoryId,
      amount: e.amount,
      description: e.description,
      locationLat: e.locationLat,
      locationLng: e.locationLng,
      locationLabel: e.locationLabel,
    });
    setPendingFiles([]);
  }

  function closeModal() {
    setForm(null);
    setEditing(null);
    setPendingFiles([]);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => f && { ...f, locationLat: pos.coords.latitude, locationLng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        alert('ไม่สามารถอ่านตำแหน่งได้ — โปรดอนุญาตการเข้าถึงตำแหน่งของเบราว์เซอร์');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function save() {
    if (!form) return;
    if (!form.amount || Number(form.amount) <= 0) {
      alert('กรุณาระบุจำนวนเงิน');
      return;
    }
    if (!form.date) {
      alert('กรุณาเลือกวันที่');
      return;
    }
    setSaving(true);
    try {
      const id = editing ? (await expensesApi.update(editing.id, form)).data.id : (await expensesApi.create(form)).data.id;
      for (const file of pendingFiles) {
        await expensesApi.uploadAttachment(id, file);
      }
      closeModal();
      loadRows();
      loadSummary();
    } catch {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense(id: number) {
    if (!confirm('ลบรายการค่าใช้จ่ายนี้?')) return;
    setRows((rs) => rs.filter((r) => r.id !== id));
    try {
      await expensesApi.remove(id);
      loadSummary();
    } catch {
      loadRows();
    }
  }

  async function removeExistingAttachment(expenseId: number, attId: number) {
    try {
      await expensesApi.removeAttachment(expenseId, attId);
      setEditing((e) => e && { ...e, attachments: e.attachments.filter((a) => a.id !== attId) });
    } catch {}
  }

  function handlePrint() {
    printExpenseReport({
      title:
        filterCategoryId === ''
          ? 'ทุกหมวดหมู่'
          : (categoryMap.get(Number(filterCategoryId))?.name ?? 'ทุกหมวดหมู่'),
      from,
      to,
      expenses: rows,
      categories,
    });
  }

  const activeSummary = summary ? summary[summaryPeriod] : null;
  const rowsTotal = rows.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ค่าใช้จ่ายรายวัน</h1>
          <p className="text-sm text-slate-500 mt-0.5">บันทึกและสรุปค่าใช้จ่ายประจำวัน แยกตามหมวดหมู่</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/expenses/categories"
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            จัดการหมวดหมู่
          </Link>
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            พิมพ์รายงาน
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            + บันทึกรายจ่าย
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">สรุปยอด ณ วันที่</span>
            <input
              type="date"
              className={`${inputCls} w-auto`}
              value={summaryDate}
              onChange={(e) => setSummaryDate(e.target.value)}
            />
          </div>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
            {(['day', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSummaryPeriod(p)}
                className={`px-3 py-1.5 transition ${
                  summaryPeriod === p ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {(['day', 'month', 'year'] as const).map((p) => (
            <div
              key={p}
              className={`rounded-lg border p-3 ${
                summaryPeriod === p ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'
              }`}
            >
              <div className="text-xs text-slate-500">รวม{PERIOD_LABEL[p]}</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">
                {summary ? formatBaht(summary[p].total) : '—'} บาท
              </div>
              <div className="text-xs text-slate-400">{summary ? summary[p].count : 0} รายการ</div>
            </div>
          ))}
        </div>

        <ExpenseCategoryBarChart data={activeSummary?.byCategory ?? []} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">จากวันที่</label>
          <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">ถึงวันที่</label>
          <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">หมวดหมู่</label>
          <select
            className={inputCls}
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">ทั้งหมด</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-slate-400 text-sm">กำลังโหลด…</div>
      ) : rows.length === 0 ? (
        <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-300 rounded-lg">
          ยังไม่มีรายการในช่วงที่เลือก — กด “บันทึกรายจ่าย”
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
                <th className="px-4 py-2.5 font-medium">วันที่</th>
                <th className="px-4 py-2.5 font-medium">หมวดหมู่</th>
                <th className="px-4 py-2.5 font-medium">รายละเอียด</th>
                <th className="px-4 py-2.5 font-medium">รูป</th>
                <th className="px-4 py-2.5 font-medium">ตำแหน่ง</th>
                <th className="px-4 py-2.5 font-medium text-right">จำนวนเงิน</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const cat = e.categoryId ? categoryMap.get(e.categoryId) : undefined;
                return (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{e.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat?.color ?? '#94a3b8' }} />
                        {cat?.name ?? 'ไม่ระบุหมวดหมู่'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {e.attachments.length > 0 ? `${e.attachments.length} รูป` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {e.locationLat != null && e.locationLng != null ? (
                        <a
                          href={mapsUrl(e.locationLat, e.locationLng)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline text-xs"
                        >
                          ดูแผนที่
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800 whitespace-nowrap">
                      {formatBaht(e.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(e)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => removeExpense(e.id)}
                        className="ml-2 px-2 py-1 text-xs text-slate-400 hover:text-red-600"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="px-4 py-2.5 text-right text-xs text-slate-500 font-medium">
                  รวม
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-slate-800">{formatBaht(rowsTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {form && (
        <Modal title={editing ? 'แก้ไขรายการค่าใช้จ่าย' : 'บันทึกรายจ่าย'} onClose={closeModal}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่ *">
                <input
                  type="date"
                  className={inputCls}
                  value={form.date ?? ''}
                  onChange={(e) => setForm((f) => f && { ...f, date: e.target.value })}
                />
              </Field>
              <Field label="หมวดหมู่">
                <select
                  className={inputCls}
                  value={form.categoryId ?? ''}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, categoryId: e.target.value === '' ? null : Number(e.target.value) })
                  }
                >
                  <option value="">ไม่ระบุ</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="จำนวนเงิน (บาท) *">
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputCls}
                value={form.amount ?? 0}
                onChange={(e) => setForm((f) => f && { ...f, amount: Number(e.target.value) })}
              />
            </Field>

            <Field label="รายละเอียด">
              <textarea
                className={inputCls}
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => f && { ...f, description: e.target.value })}
              />
            </Field>

            <Field label="ตำแหน่ง (Location)">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  {locating ? 'กำลังระบุตำแหน่ง…' : '📍 ใช้ตำแหน่งปัจจุบัน'}
                </button>
                {form.locationLat != null && form.locationLng != null && (
                  <>
                    <a
                      href={mapsUrl(form.locationLat, form.locationLng)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      ดูบนแผนที่ ({form.locationLat.toFixed(5)}, {form.locationLng.toFixed(5)})
                    </a>
                    <button
                      type="button"
                      onClick={() => setForm((f) => f && { ...f, locationLat: null, locationLng: null })}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      ลบตำแหน่ง
                    </button>
                  </>
                )}
              </div>
            </Field>

            <Field label="รูปถ่าย">
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setPendingFiles((fs) => [...fs, ...Array.from(e.target.files ?? [])])}
                  className="text-xs text-slate-500"
                />
                <div className="flex flex-wrap gap-2">
                  {editing?.attachments.map((a) => (
                    <div key={a.id} className="relative group">
                      <img
                        src={expensesApi.downloadUrl(editing.id, a.id)}
                        alt={a.originalName}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingAttachment(editing.id, a.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-16 h-16 object-cover rounded-lg border border-indigo-300"
                      />
                      <button
                        type="button"
                        onClick={() => setPendingFiles((fs) => fs.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={closeModal}
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
        </Modal>
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
