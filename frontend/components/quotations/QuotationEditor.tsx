'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quotationCustomersApi, quotationProductsApi, quotationsApi, quotationTemplatesApi } from '@/lib/api';
import {
  type QuotationInput,
  type QuotationItem,
  type QuotationTemplate,
  type QuotationCustomer,
  type QuotationProduct,
  type PaperSize,
  type Orientation,
  DEFAULT_LAYOUT,
  PAPER_SIZES,
  STATUS_LABEL,
  emptyItem,
  emptyQuotation,
  computeTotals,
  formatMoney,
} from '@/types/quotation';
import DatePickerInput from '@/components/ui/DatePickerInput';
import QuotationPreview from './QuotationPreview';
import ImportItemsDialog from './ImportItemsDialog';
import { printQuotation } from './renderQuotation';

interface Props {
  id?: number;
}

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

export default function QuotationEditor({ id }: Props) {
  const router = useRouter();
  const [currentId, setCurrentId] = useState<number | undefined>(id);
  const [form, setForm] = useState<QuotationInput>(emptyQuotation());
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [printSize, setPrintSize] = useState<PaperSize | ''>('');
  const [printOrient, setPrintOrient] = useState<Orientation | ''>('');

  const [customers, setCustomers] = useState<QuotationCustomer[]>([]);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerSaved, setCustomerSaved] = useState(false);

  const [products, setProducts] = useState<QuotationProduct[]>([]);
  const [openItemDropdown, setOpenItemDropdown] = useState<number | null>(null);

  const set = <K extends keyof QuotationInput>(k: K, v: QuotationInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    quotationTemplatesApi
      .getAll()
      .then((r) => {
        setTemplates(r.data);
        // ตอนสร้างใหม่: หยิบแม่แบบ default มา seed templateId + อัตราภาษี
        if (!id) {
          const def = r.data.find((t) => t.isDefault) || r.data[0];
          if (def) {
            setForm((f) => ({
              ...f,
              templateId: def.id,
              vatRate: def.layout.vatEnabled ? def.layout.vatRate : 0,
              withholdingRate: def.layout.withholdingEnabled ? def.layout.withholdingRate : 0,
              terms: f.terms || def.layout.terms,
            }));
          }
        }
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    quotationsApi
      .getOne(id)
      .then((r) => setForm(r.data))
      .catch(() => router.push('/quotations'))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    quotationCustomersApi
      .getAll()
      .then((r) => setCustomers(r.data))
      .catch(() => {});
    quotationProductsApi
      .getAll()
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);

  // ถ้าชื่อลูกค้าในฟอร์มตรงกับ master เป๊ะ ๆ ให้ผูก selectedCustomerId ไว้ (เช่นตอนเปิดใบเก่า)
  useEffect(() => {
    const name = form.customerName?.trim();
    if (!name || !customers.length) return;
    const match = customers.find((c) => c.name === name);
    setSelectedCustomerId(match ? match.id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, currentId]);

  const filteredCustomers = useMemo(() => {
    const q = (form.customerName ?? '').trim().toLowerCase();
    const list = q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers;
    return list.slice(0, 8);
  }, [customers, form.customerName]);

  function pickCustomer(c: QuotationCustomer) {
    setForm((f) => ({
      ...f,
      customerName: c.name,
      customerAddress: c.address,
      customerPhone: c.phone,
      customerEmail: c.email,
      customerTaxId: c.taxId,
    }));
    setSelectedCustomerId(c.id);
    setCustomerDropdownOpen(false);
  }

  async function saveCustomerToMaster() {
    if (!form.customerName?.trim()) {
      alert('กรุณาระบุชื่อลูกค้าก่อนบันทึก');
      return;
    }
    setSavingCustomer(true);
    try {
      const payload = {
        name: form.customerName,
        address: form.customerAddress,
        phone: form.customerPhone,
        email: form.customerEmail,
        taxId: form.customerTaxId,
      };
      const r = selectedCustomerId
        ? await quotationCustomersApi.update(selectedCustomerId, payload)
        : await quotationCustomersApi.create(payload);
      setCustomers((cs) => {
        const exists = cs.some((c) => c.id === r.data.id);
        const next = exists ? cs.map((c) => (c.id === r.data.id ? r.data : c)) : [...cs, r.data];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedCustomerId(r.data.id);
      setCustomerSaved(true);
      setTimeout(() => setCustomerSaved(false), 2000);
    } catch {
      alert('บันทึกข้อมูลลูกค้าไม่สำเร็จ');
    } finally {
      setSavingCustomer(false);
    }
  }

  // เลือก template: ค่า form.templateId หรือ default
  const activeTemplate = useMemo(() => {
    if (!templates.length) return null;
    return (
      templates.find((t) => t.id === form.templateId) ||
      templates.find((t) => t.isDefault) ||
      templates[0]
    );
  }, [templates, form.templateId]);

  const layout = useMemo(
    () => ({ ...DEFAULT_LAYOUT, ...(activeTemplate?.layout ?? {}) }),
    [activeTemplate],
  );

  const items = form.items ?? [];
  const totals = computeTotals(items, {
    discount: form.discount,
    vatRate: form.vatRate,
    withholdingRate: form.withholdingRate,
  });

  function updateItem(i: number, patch: Partial<QuotationItem>) {
    setForm((f) => {
      const next = [...(f.items ?? [])];
      next[i] = { ...next[i], ...patch };
      return { ...f, items: next };
    });
  }
  function addItem() {
    setForm((f) => ({ ...f, items: [...(f.items ?? []), emptyItem()] }));
  }
  function removeItem(i: number) {
    setForm((f) => ({ ...f, items: (f.items ?? []).filter((_, idx) => idx !== i) }));
  }
  function moveItem(i: number, dir: -1 | 1) {
    setForm((f) => {
      const next = [...(f.items ?? [])];
      const j = i + dir;
      if (j < 0 || j >= next.length) return f;
      [next[i], next[j]] = [next[j], next[i]];
      return { ...f, items: next };
    });
  }

  function filteredProducts(query: string) {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return list.slice(0, 8);
  }

  function pickProduct(i: number, p: QuotationProduct) {
    updateItem(i, { description: p.name, unit: p.unit, unitPrice: p.unitPrice });
    setOpenItemDropdown(null);
  }

  async function save(): Promise<number | null> {
    setSaving(true);
    try {
      const payload = { ...form, templateId: activeTemplate?.id ?? null };
      if (currentId) {
        await quotationsApi.update(currentId, payload);
        return currentId;
      }
      const r = await quotationsApi.create(payload);
      setForm(r.data);
      setCurrentId(r.data.id);
      window.history.replaceState(null, '', `/ics-backoffice/quotations/${r.data.id}`);
      return r.data.id;
    } catch {
      alert('บันทึกไม่สำเร็จ');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndBack() {
    const savedId = await save();
    if (savedId) router.push('/quotations');
  }

  function handlePrint() {
    printQuotation(form, layout, {
      paperSize: (printSize || layout.paperSize) as PaperSize,
      orientation: (printOrient || layout.orientation) as Orientation,
    });
  }

  if (loading) return <div className="p-8 text-slate-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white sticky top-0 z-10">
        <Link href="/quotations" className="text-slate-400 hover:text-slate-600 text-sm">
          ← ใบเสนอราคา
        </Link>
        <div className="font-semibold text-slate-800">
          {id ? form.quotationNo || `#${id}` : 'ใบเสนอราคาใหม่'}
        </div>

        <div className="flex-1" />

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-500">แม่แบบ</span>
          <select
            value={activeTemplate?.id ?? ''}
            onChange={(e) => set('templateId', Number(e.target.value))}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isDefault ? ' (ค่าเริ่มต้น)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <span className="text-slate-500">กระดาษ</span>
          <select
            value={printSize || layout.paperSize}
            onChange={(e) => setPrintSize(e.target.value as PaperSize)}
            className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {PAPER_SIZES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <select
          value={printOrient || layout.orientation}
          onChange={(e) => setPrintOrient(e.target.value as Orientation)}
          className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
        >
          <option value="portrait">แนวตั้ง</option>
          <option value="landscape">แนวนอน</option>
        </select>

        <button
          onClick={handlePrint}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
        >
          🖨 พิมพ์
        </button>
        <button
          onClick={() => save()}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50 disabled:opacity-40"
        >
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
        <button
          onClick={handleSaveAndBack}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
        >
          บันทึก & ปิด
        </button>
      </div>

      {/* Body: form | preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Form */}
        <div className="space-y-6 bg-white rounded-xl border border-slate-200 p-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">ข้อมูลเอกสาร</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="เลขที่ใบเสนอราคา">
                <input
                  className={inputCls}
                  value={form.quotationNo ?? ''}
                  placeholder="เว้นว่างเพื่อออกเลขอัตโนมัติ"
                  onChange={(e) => set('quotationNo', e.target.value)}
                />
              </Field>
              <Field label="สถานะ">
                <select
                  className={inputCls}
                  value={form.status ?? 'draft'}
                  onChange={(e) => set('status', e.target.value as QuotationInput['status'])}
                >
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="วันที่ออก">
                <DatePickerInput
                  value={form.issueDate ?? ''}
                  onChange={(v) => set('issueDate', v)}
                />
              </Field>
              <Field label="ยืนราคาถึง">
                <DatePickerInput
                  value={form.validUntil ?? ''}
                  onChange={(v) => set('validUntil', v)}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">ลูกค้า</h3>
              <button
                onClick={saveCustomerToMaster}
                disabled={savingCustomer}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                title="บันทึกข้อมูลลูกค้านี้ไว้ใช้เลือกซ้ำในครั้งถัดไป"
              >
                {customerSaved ? '✓ บันทึกแล้ว' : savingCustomer ? 'กำลังบันทึก…' : '💾 บันทึกลงข้อมูลลูกค้า'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อลูกค้า / บริษัท">
                <div className="relative">
                  <input
                    className={inputCls}
                    value={form.customerName ?? ''}
                    onChange={(e) => {
                      set('customerName', e.target.value);
                      setSelectedCustomerId(null);
                      setCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 150)}
                    placeholder="พิมพ์เพื่อค้นหาลูกค้าเดิม หรือกรอกชื่อใหม่"
                  />
                  {customerDropdownOpen && filteredCustomers.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => pickCustomer(c)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50"
                        >
                          <div className="font-medium text-slate-800">{c.name}</div>
                          {(c.phone || c.email) && (
                            <div className="text-xs text-slate-400">
                              {[c.phone, c.email].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
              <Field label="เรียน (ผู้ติดต่อ)">
                <input
                  className={inputCls}
                  value={form.attention ?? ''}
                  onChange={(e) => set('attention', e.target.value)}
                />
              </Field>
              <Field label="โทรศัพท์">
                <input
                  className={inputCls}
                  value={form.customerPhone ?? ''}
                  onChange={(e) => set('customerPhone', e.target.value)}
                />
              </Field>
              <Field label="อีเมล">
                <input
                  className={inputCls}
                  value={form.customerEmail ?? ''}
                  onChange={(e) => set('customerEmail', e.target.value)}
                />
              </Field>
              <Field label="เลขประจำตัวผู้เสียภาษี">
                <input
                  className={inputCls}
                  value={form.customerTaxId ?? ''}
                  onChange={(e) => set('customerTaxId', e.target.value)}
                />
              </Field>
              <Field label="ชื่อโครงการ / งาน">
                <input
                  className={inputCls}
                  value={form.projectName ?? ''}
                  onChange={(e) => set('projectName', e.target.value)}
                />
              </Field>
            </div>
            <Field label="ที่อยู่">
              <textarea
                className={inputCls}
                rows={2}
                value={form.customerAddress ?? ''}
                onChange={(e) => set('customerAddress', e.target.value)}
              />
            </Field>
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">รายการ ({items.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImport(true)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-50"
                >
                  ⬆ นำเข้า Excel/CSV
                </button>
                <button
                  onClick={addItem}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-900"
                >
                  + เพิ่มแถว
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-2.5 bg-slate-50/60">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-slate-400 pt-2 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <input
                          className={inputCls}
                          placeholder="รายละเอียด (พิมพ์เพื่อค้นหาจากสินค้า/บริการ)"
                          value={it.description}
                          onChange={(e) => {
                            updateItem(i, { description: e.target.value });
                            setOpenItemDropdown(i);
                          }}
                          onFocus={() => setOpenItemDropdown(i)}
                          onBlur={() =>
                            setTimeout(
                              () => setOpenItemDropdown((cur) => (cur === i ? null : cur)),
                              150,
                            )
                          }
                        />
                        {openItemDropdown === i && filteredProducts(it.description).length > 0 && (
                          <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                            {filteredProducts(it.description).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onMouseDown={() => pickProduct(i, p)}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50"
                              >
                                <div className="font-medium text-slate-800">{p.name}</div>
                                <div className="text-xs text-slate-400">
                                  {[p.unit, p.unitPrice ? formatMoney(p.unitPrice) : ''].filter(Boolean).join(' · ')}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="จำนวน"
                          value={it.quantity}
                          onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                        />
                        <input
                          className={inputCls}
                          placeholder="หน่วย"
                          value={it.unit}
                          onChange={(e) => updateItem(i, { unit: e.target.value })}
                        />
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="ราคา/หน่วย"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                        />
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="ส่วนลด"
                          value={it.discount}
                          onChange={(e) => updateItem(i, { discount: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <span className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        {formatMoney(totals.lineAmounts[i])}
                      </span>
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => moveItem(i, -1)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="เลื่อนขึ้น"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveItem(i, 1)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="เลื่อนลง"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => removeItem(i)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="ลบ"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!items.length && (
                <div className="text-center text-sm text-slate-400 py-6 border border-dashed border-slate-300 rounded-lg">
                  ยังไม่มีรายการ — กด “เพิ่มแถว” หรือ “นำเข้า Excel/CSV”
                </div>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">สรุปยอด</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="ส่วนลดท้ายบิล (บาท)">
                <input
                  className={inputCls}
                  type="number"
                  value={form.discount ?? 0}
                  onChange={(e) => set('discount', Number(e.target.value))}
                />
              </Field>
              <Field label="VAT (%)">
                <input
                  className={inputCls}
                  type="number"
                  value={form.vatRate ?? 0}
                  onChange={(e) => set('vatRate', Number(e.target.value))}
                />
              </Field>
              <Field label="หัก ณ ที่จ่าย (%)">
                <input
                  className={inputCls}
                  type="number"
                  value={form.withholdingRate ?? 0}
                  onChange={(e) => set('withholdingRate', Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm space-y-1">
              <Row label="รวมเป็นเงิน" value={formatMoney(totals.subtotal)} />
              {totals.discount > 0 && <Row label="หักส่วนลด" value={`-${formatMoney(totals.discount)}`} />}
              {(form.vatRate ?? 0) > 0 && <Row label={`VAT ${form.vatRate}%`} value={formatMoney(totals.vat)} />}
              <Row label="ยอดรวมทั้งสิ้น" value={formatMoney(totals.grandTotal)} bold />
              {(form.withholdingRate ?? 0) > 0 && (
                <>
                  <Row label={`หัก ณ ที่จ่าย ${form.withholdingRate}%`} value={`-${formatMoney(totals.withholding)}`} />
                  <Row label="ยอดชำระสุทธิ" value={formatMoney(totals.netPayable)} bold />
                </>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <Field label="หมายเหตุ">
              <textarea
                className={inputCls}
                rows={2}
                value={form.note ?? ''}
                onChange={(e) => set('note', e.target.value)}
              />
            </Field>
            <Field label="เงื่อนไข (เว้นว่าง = ใช้ตามแม่แบบ)">
              <textarea
                className={inputCls}
                rows={3}
                value={form.terms ?? ''}
                onChange={(e) => set('terms', e.target.value)}
              />
            </Field>
          </section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
          <QuotationPreview quotation={{ ...form }} layout={layout} />
        </div>
      </div>

      {showImport && (
        <ImportItemsDialog
          onClose={() => setShowImport(false)}
          onImport={(imported, mode) =>
            setForm((f) => ({
              ...f,
              items: mode === 'replace' ? imported : [...(f.items ?? []), ...imported],
            }))
          }
        />
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
