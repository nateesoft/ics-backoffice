'use client';
import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import Modal from '@/components/ui/Modal';
import { type QuotationItem, emptyItem } from '@/types/quotation';

interface Props {
  onClose: () => void;
  onImport: (items: QuotationItem[], mode: 'append' | 'replace') => void;
}

type Row = Record<string, unknown>;

const FIELD_DEFS: { key: keyof QuotationItem; label: string; aliases: string[] }[] = [
  { key: 'description', label: 'รายการ', aliases: ['description', 'item', 'name', 'รายการ', 'ชื่อ', 'detail', 'รายละเอียด'] },
  { key: 'quantity', label: 'จำนวน', aliases: ['quantity', 'qty', 'จำนวน', 'amount', 'ปริมาณ'] },
  { key: 'unit', label: 'หน่วย', aliases: ['unit', 'หน่วย', 'uom'] },
  { key: 'unitPrice', label: 'ราคา/หน่วย', aliases: ['unitprice', 'price', 'ราคา', 'ราคาต่อหน่วย', 'unit price', 'rate'] },
  { key: 'discount', label: 'ส่วนลด', aliases: ['discount', 'ส่วนลด', 'disc'] },
];

function guessColumn(headers: string[], aliases: string[]): string {
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  for (const h of headers) {
    const n = norm(h);
    if (aliases.some((a) => n === norm(a) || n.includes(norm(a)))) return h;
  }
  return '';
}

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

export default function ImportItemsDialog({ onClose, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [error, setError] = useState('');

  function handleFile(file: File) {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: '' });
        if (!json.length) {
          setError('ไม่พบข้อมูลในไฟล์');
          return;
        }
        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setRows(json);
        const m: Record<string, string> = {};
        for (const f of FIELD_DEFS) m[f.key] = guessColumn(hdrs, f.aliases);
        setMapping(m);
      } catch (err) {
        console.error(err);
        setError('อ่านไฟล์ไม่สำเร็จ — รองรับ .xlsx .xls .csv');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const previewItems = useMemo<QuotationItem[]>(() => {
    return rows.map((r) => {
      const it = emptyItem();
      it.description = mapping.description ? String(r[mapping.description] ?? '').trim() : '';
      it.quantity = mapping.quantity ? toNumber(r[mapping.quantity]) : 1;
      it.unit = mapping.unit ? String(r[mapping.unit] ?? '').trim() : '';
      it.unitPrice = mapping.unitPrice ? toNumber(r[mapping.unitPrice]) : 0;
      it.discount = mapping.discount ? toNumber(r[mapping.discount]) : 0;
      return it;
    });
  }, [rows, mapping]);

  const validItems = previewItems.filter((it) => it.description || it.unitPrice || it.quantity !== 1);

  return (
    <Modal
      title="นำเข้ารายการจาก Excel / CSV"
      onClose={onClose}
      size="xl"
      action={
        rows.length > 0 ? (
          <button
            onClick={() => {
              onImport(validItems, mode);
              onClose();
            }}
            disabled={!validItems.length}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
          >
            เพิ่ม {validItems.length} รายการ
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
          }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
          >
            เลือกไฟล์
          </button>
          <p className="mt-2 text-xs text-slate-500">
            หรือลากไฟล์มาวางตรงนี้ — รองรับ .xlsx .xls .csv (ใช้แถวแรกเป็นหัวคอลัมน์)
          </p>
          {fileName && <p className="mt-1 text-xs text-slate-600 font-medium">{fileName}</p>}
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        {headers.length > 0 && (
          <>
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-2">จับคู่คอลัมน์</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FIELD_DEFS.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm">
                    <span className="w-24 text-slate-600">{f.label}</span>
                    <select
                      value={mapping[f.key] || ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value }))}
                      className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
                    >
                      <option value="">— ไม่ใช้ —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-semibold">รายการ</th>
                      <th className="px-2 py-1.5 text-right font-semibold">จำนวน</th>
                      <th className="px-2 py-1.5 text-left font-semibold">หน่วย</th>
                      <th className="px-2 py-1.5 text-right font-semibold">ราคา/หน่วย</th>
                      <th className="px-2 py-1.5 text-right font-semibold">ส่วนลด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.slice(0, 100).map((it, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-2 py-1">{it.description || <span className="text-slate-400">—</span>}</td>
                        <td className="px-2 py-1 text-right">{it.quantity}</td>
                        <td className="px-2 py-1">{it.unit}</td>
                        <td className="px-2 py-1 text-right">{it.unitPrice.toLocaleString()}</td>
                        <td className="px-2 py-1 text-right">{it.discount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
                พบ {rows.length} แถว · จะนำเข้า {validItems.length} รายการ
                {rows.length > 100 && ' (แสดงตัวอย่าง 100 แถวแรก)'}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} />
                เพิ่มต่อท้ายรายการเดิม
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} />
                แทนที่รายการทั้งหมด
              </label>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
