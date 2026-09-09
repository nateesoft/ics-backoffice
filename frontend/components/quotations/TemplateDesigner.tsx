'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { quotationTemplatesApi } from '@/lib/api';
import {
  type QuotationLayout,
  type QuotationColumnKey,
  type PaperSize,
  type Orientation,
  DEFAULT_LAYOUT,
  PAPER_SIZES,
  emptyItem,
} from '@/types/quotation';
import QuotationPreview from './QuotationPreview';

interface Props {
  id?: number;
}

const inputCls =
  'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-indigo-500';

const SAMPLE = {
  quotationNo: 'QT2026xx-001',
  issueDate: '2026-09-09',
  validUntil: '2026-10-09',
  status: 'draft' as const,
  customerName: 'บริษัท ตัวอย่างลูกค้า จำกัด',
  attention: 'คุณสมชาย',
  customerAddress: '99/9 อาคารตัวอย่าง ชั้น 5 กรุงเทพฯ 10110',
  customerPhone: '08x-xxx-xxxx',
  customerTaxId: '0-1055-xxxxx-xx-x',
  projectName: 'พัฒนาระบบเว็บแอปพลิเคชัน',
  items: [
    { ...emptyItem(), description: 'ออกแบบ UX/UI', quantity: 1, unit: 'งาน', unitPrice: 45000 },
    { ...emptyItem(), description: 'พัฒนา Frontend + Backend', quantity: 30, unit: 'man-day', unitPrice: 6000 },
    { ...emptyItem(), description: 'ทดสอบและติดตั้ง', quantity: 1, unit: 'งาน', unitPrice: 20000, discount: 2000 },
  ],
  discount: 0,
  note: 'ราคานี้รวมการดูแลระบบ 3 เดือนหลังส่งมอบ',
  terms: '',
};

export default function TemplateDesigner({ id }: Props) {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('แม่แบบใหม่');
  const [isDefault, setIsDefault] = useState(false);
  const [layout, setLayout] = useState<QuotationLayout>({ ...DEFAULT_LAYOUT });
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    quotationTemplatesApi
      .getOne(id)
      .then((r) => {
        setName(r.data.name);
        setIsDefault(r.data.isDefault);
        setLayout({ ...DEFAULT_LAYOUT, ...r.data.layout });
      })
      .catch(() => router.push('/quotations/templates'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const set = <K extends keyof QuotationLayout>(k: K, v: QuotationLayout[K]) =>
    setLayout((l) => ({ ...l, [k]: v }));

  function toggleColumn(key: QuotationColumnKey, enabled: boolean) {
    setLayout((l) => ({
      ...l,
      columns: l.columns.map((c) => (c.key === key ? { ...c, enabled } : c)),
    }));
  }
  function renameColumn(key: QuotationColumnKey, label: string) {
    setLayout((l) => ({
      ...l,
      columns: l.columns.map((c) => (c.key === key ? { ...c, label } : c)),
    }));
  }

  function handleLogo(file: File) {
    if (file.size > 400_000) {
      alert('ไฟล์โลโก้ควรมีขนาดไม่เกิน ~400 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logoUrl', String(reader.result));
    reader.readAsDataURL(file);
  }

  async function save(back: boolean) {
    setSaving(true);
    try {
      const payload = { name, isDefault, layout };
      let savedId = id;
      if (id) {
        await quotationTemplatesApi.update(id, payload);
      } else {
        const r = await quotationTemplatesApi.create(payload);
        savedId = r.data.id;
      }
      if (back) router.push('/quotations/templates');
      else if (!id && savedId) {
        window.history.replaceState(null, '', `/ics-backoffice/quotations/templates/${savedId}`);
        router.refresh();
      }
    } catch {
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  const sampleWithTerms = useMemo(
    () => ({
      ...SAMPLE,
      terms: SAMPLE.terms || layout.terms,
      vatRate: layout.vatEnabled ? layout.vatRate : 0,
      withholdingRate: layout.withholdingEnabled ? layout.withholdingRate : 0,
    }),
    [layout.terms, layout.vatEnabled, layout.vatRate, layout.withholdingEnabled, layout.withholdingRate],
  );

  if (loading) return <div className="p-8 text-slate-400">กำลังโหลด…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white sticky top-0 z-10">
        <Link href="/quotations/templates" className="text-slate-400 hover:text-slate-600 text-sm">
          ← แม่แบบ
        </Link>
        <input
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium w-64"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อแม่แบบ"
        />
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          ตั้งเป็นค่าเริ่มต้น
        </label>
        <div className="flex-1" />
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-50 disabled:opacity-40"
        >
          {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
        >
          บันทึก & ปิด
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-6 bg-white rounded-xl border border-slate-200 p-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">ข้อมูลบริษัท</h3>
            <div className="flex items-center gap-3">
              {layout.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={layout.logoUrl} alt="logo" className="h-14 w-auto max-w-[160px] object-contain border border-slate-200 rounded" />
              ) : (
                <div className="h-14 w-24 grid place-items-center text-xs text-slate-400 border border-dashed border-slate-300 rounded">
                  ไม่มีโลโก้
                </div>
              )}
              <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])} />
              <button onClick={() => logoRef.current?.click()} className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs hover:bg-slate-50">
                อัปโหลดโลโก้
              </button>
              {layout.logoUrl && (
                <button onClick={() => set('logoUrl', '')} className="px-2.5 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50">
                  ลบ
                </button>
              )}
            </div>
            <Field label="URL โลโก้ (หรือใช้อัปโหลดด้านบน)">
              <input className={inputCls} value={layout.logoUrl} onChange={(e) => set('logoUrl', e.target.value)} />
            </Field>
            <Field label="ชื่อบริษัท">
              <input className={inputCls} value={layout.companyName} onChange={(e) => set('companyName', e.target.value)} />
            </Field>
            <Field label="ที่อยู่">
              <textarea className={inputCls} rows={2} value={layout.companyAddress} onChange={(e) => set('companyAddress', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="โทรศัพท์">
                <input className={inputCls} value={layout.companyPhone} onChange={(e) => set('companyPhone', e.target.value)} />
              </Field>
              <Field label="อีเมล">
                <input className={inputCls} value={layout.companyEmail} onChange={(e) => set('companyEmail', e.target.value)} />
              </Field>
            </div>
            <Field label="เลขประจำตัวผู้เสียภาษี">
              <input className={inputCls} value={layout.companyTaxId} onChange={(e) => set('companyTaxId', e.target.value)} />
            </Field>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">หัว / ท้ายเอกสาร</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อเอกสาร">
                <input className={inputCls} value={layout.documentTitle} onChange={(e) => set('documentTitle', e.target.value)} />
              </Field>
              <Field label="สกุลเงิน">
                <input className={inputCls} value={layout.currency} onChange={(e) => set('currency', e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="สีหลัก (accent)">
                <input type="color" className="w-full h-9 border border-slate-300 rounded-lg" value={layout.accentColor} onChange={(e) => set('accentColor', e.target.value)} />
              </Field>
              <Field label="ป้ายลายเซ็น">
                <input className={inputCls} value={layout.signatureLabel} onChange={(e) => set('signatureLabel', e.target.value)} />
              </Field>
            </div>
            <Field label="ข้อความหัวเอกสาร">
              <textarea className={inputCls} rows={2} value={layout.headerNote} onChange={(e) => set('headerNote', e.target.value)} />
            </Field>
            <Field label="เงื่อนไข (ค่าเริ่มต้น)">
              <textarea className={inputCls} rows={3} value={layout.terms} onChange={(e) => set('terms', e.target.value)} />
            </Field>
            <Field label="รายละเอียดการชำระเงิน / บัญชีธนาคาร">
              <textarea className={inputCls} rows={2} value={layout.bankDetails} onChange={(e) => set('bankDetails', e.target.value)} />
            </Field>
            <Field label="ข้อความท้ายเอกสาร">
              <input className={inputCls} value={layout.footerNote} onChange={(e) => set('footerNote', e.target.value)} />
            </Field>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">คอลัมน์ตารางรายการ</h3>
            <div className="space-y-1.5">
              {layout.columns.map((c) => (
                <div key={c.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={c.enabled}
                    disabled={c.key === 'description'}
                    onChange={(e) => toggleColumn(c.key, e.target.checked)}
                  />
                  <span className="w-24 text-xs text-slate-500">{c.key}</span>
                  <input
                    className={inputCls}
                    value={c.label}
                    onChange={(e) => renameColumn(c.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">ภาษี</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={layout.vatEnabled} onChange={(e) => set('vatEnabled', e.target.checked)} />
                เปิด VAT
              </label>
              <Field label="อัตรา VAT (%)">
                <input className={inputCls} type="number" value={layout.vatRate} onChange={(e) => set('vatRate', Number(e.target.value))} />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={layout.withholdingEnabled} onChange={(e) => set('withholdingEnabled', e.target.checked)} />
                หัก ณ ที่จ่าย
              </label>
              <Field label="อัตราหัก ณ ที่จ่าย (%)">
                <input className={inputCls} type="number" value={layout.withholdingRate} onChange={(e) => set('withholdingRate', Number(e.target.value))} />
              </Field>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">การพิมพ์</h3>
            <div className="grid grid-cols-3 gap-3">
              <Field label="ขนาดกระดาษ">
                <select className={inputCls} value={layout.paperSize} onChange={(e) => set('paperSize', e.target.value as PaperSize)}>
                  {PAPER_SIZES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="แนววาง">
                <select className={inputCls} value={layout.orientation} onChange={(e) => set('orientation', e.target.value as Orientation)}>
                  <option value="portrait">แนวตั้ง</option>
                  <option value="landscape">แนวนอน</option>
                </select>
              </Field>
              <Field label="ระยะขอบ (มม.)">
                <input className={inputCls} type="number" value={layout.marginMm} onChange={(e) => set('marginMm', Number(e.target.value))} />
              </Field>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
          <QuotationPreview quotation={sampleWithTerms} layout={layout} />
        </div>
      </div>
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
