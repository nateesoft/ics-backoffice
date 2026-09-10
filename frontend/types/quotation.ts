export type QuotationColumnKey =
  | 'no'
  | 'description'
  | 'quantity'
  | 'unit'
  | 'unitPrice'
  | 'discount'
  | 'amount';

export interface QuotationColumn {
  key: QuotationColumnKey;
  label: string;
  enabled: boolean;
}

export type PaperSize = 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal';
export type Orientation = 'portrait' | 'landscape';

/** รูปแบบการวางเลย์เอาต์ของเอกสาร — 'standard' = โมเดิร์น, 'ics-classic' = ฟอร์มตามแบบ ICS (มีกรอบ/สองภาษา) */
export type QuotationVariant = 'standard' | 'ics-classic';

export interface QuotationLayout {
  variant: QuotationVariant;

  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxId: string;
  logoUrl: string;

  documentTitle: string;
  headerNote: string;
  footerNote: string;
  terms: string;
  bankDetails: string;
  signatureLabel: string;

  // ── ใช้เฉพาะ variant 'ics-classic' ──
  issuerName: string; // ชื่อผู้เสนอราคาที่ลงนาม เช่น "ชูชาติ คล่องการ"
  priceValidity: string; // กำหนดยืนราคา
  deliveryPeriod: string; // กำหนดส่งของ
  paymentTerms: string; // เงื่อนไขการชำระเงิน

  accentColor: string;
  fontFamily: string;

  columns: QuotationColumn[];

  currency: string;
  vatEnabled: boolean;
  vatRate: number;
  withholdingEnabled: boolean;
  withholdingRate: number;

  paperSize: PaperSize;
  orientation: Orientation;
  marginMm: number;
}

export interface QuotationTemplate {
  id: number;
  name: string;
  isDefault: boolean;
  layout: QuotationLayout;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface Quotation {
  id: number;
  templateId: number | null;
  quotationNo: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerEmail: string;
  customerTaxId: string;
  attention: string;
  projectName: string;
  issueDate: string;
  validUntil: string;
  items: QuotationItem[];
  discount: number;
  vatRate: number;
  withholdingRate: number;
  note: string;
  terms: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
}

export type QuotationInput = Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>;
export type TemplateInput = { name?: string; isDefault?: boolean; layout?: Partial<QuotationLayout> };

// ── ค่าคงที่ ──────────────────────────────────────────────

export const PAPER_SIZES: { value: PaperSize; label: string }[] = [
  { value: 'A4', label: 'A4 (210 × 297 มม.)' },
  { value: 'A5', label: 'A5 (148 × 210 มม.)' },
  { value: 'A3', label: 'A3 (297 × 420 มม.)' },
  { value: 'Letter', label: 'Letter (8.5 × 11 นิ้ว)' },
  { value: 'Legal', label: 'Legal (8.5 × 14 นิ้ว)' },
];

export const STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'ฉบับร่าง',
  sent: 'ส่งแล้ว',
  accepted: 'อนุมัติ',
  rejected: 'ปฏิเสธ',
};

export const QUOTATION_VARIANTS: { value: QuotationVariant; label: string }[] = [
  { value: 'standard', label: 'มาตรฐาน (โมเดิร์น)' },
  { value: 'ics-classic', label: 'ICS Classic (ฟอร์มมีกรอบ สองภาษา)' },
];

export const DEFAULT_LAYOUT: QuotationLayout = {
  variant: 'standard',
  issuerName: '',
  priceValidity: '',
  deliveryPeriod: '',
  paymentTerms: '',
  companyName: 'บริษัท ของคุณ จำกัด',
  companyAddress: '123 ถนนตัวอย่าง แขวง/ตำบล เขต/อำเภอ จังหวัด 10000',
  companyPhone: '0-2000-0000',
  companyEmail: 'sales@example.com',
  companyTaxId: '0-0000-00000-00-0',
  logoUrl: '',
  documentTitle: 'ใบเสนอราคา / QUOTATION',
  headerNote: '',
  footerNote: 'ขอบคุณที่ให้ความไว้วางใจ',
  terms:
    '1. ราคานี้ยืนราคา 30 วันนับจากวันที่เสนอราคา\n2. ยืนยันการสั่งซื้อโดยลงนามในเอกสารฉบับนี้\n3. เงื่อนไขการชำระเงิน: มัดจำ 50% ส่วนที่เหลือชำระเมื่อส่งมอบงาน',
  bankDetails: '',
  signatureLabel: 'ผู้มีอำนาจลงนาม',
  accentColor: '#4f46e5',
  fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
  columns: [
    { key: 'no', label: 'ลำดับ', enabled: true },
    { key: 'description', label: 'รายการ', enabled: true },
    { key: 'quantity', label: 'จำนวน', enabled: true },
    { key: 'unit', label: 'หน่วย', enabled: true },
    { key: 'unitPrice', label: 'ราคา/หน่วย', enabled: true },
    { key: 'discount', label: 'ส่วนลด', enabled: false },
    { key: 'amount', label: 'จำนวนเงิน', enabled: true },
  ],
  currency: 'บาท',
  vatEnabled: true,
  vatRate: 7,
  withholdingEnabled: false,
  withholdingRate: 3,
  paperSize: 'A4',
  orientation: 'portrait',
  marginMm: 12,
};

export function emptyItem(): QuotationItem {
  return { description: '', quantity: 1, unit: '', unitPrice: 0, discount: 0 };
}

export function emptyQuotation(): QuotationInput {
  const today = new Date();
  const valid = new Date();
  valid.setDate(valid.getDate() + 30);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    templateId: null,
    quotationNo: '',
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    customerEmail: '',
    customerTaxId: '',
    attention: '',
    projectName: '',
    issueDate: fmt(today),
    validUntil: fmt(valid),
    items: [emptyItem()],
    discount: 0,
    vatRate: 7,
    withholdingRate: 0,
    note: '',
    terms: '',
    status: 'draft',
  };
}

// ── การคำนวณ ─────────────────────────────────────────────

export interface QuotationTotals {
  lineAmounts: number[];
  subtotal: number;
  discount: number;
  afterDiscount: number;
  vat: number;
  withholding: number;
  grandTotal: number;
  netPayable: number;
}

export function lineAmount(it: QuotationItem): number {
  return Math.max(0, (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0) - (Number(it.discount) || 0));
}

export function computeTotals(
  items: QuotationItem[],
  opts: { discount?: number; vatRate?: number; withholdingRate?: number },
): QuotationTotals {
  const lineAmounts = items.map(lineAmount);
  const subtotal = lineAmounts.reduce((s, n) => s + n, 0);
  const discount = Math.max(0, Number(opts.discount) || 0);
  const afterDiscount = Math.max(0, subtotal - discount);
  const vat = afterDiscount * ((Number(opts.vatRate) || 0) / 100);
  const grandTotal = afterDiscount + vat;
  const withholding = afterDiscount * ((Number(opts.withholdingRate) || 0) / 100);
  const netPayable = grandTotal - withholding;
  return { lineAmounts, subtotal, discount, afterDiscount, vat, withholding, grandTotal, netPayable };
}

export function formatMoney(n: number): string {
  return (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ONES = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const POS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function readInteger(numStr: string): string {
  if (numStr === '0') return 'ศูนย์';
  let out = '';
  const len = numStr.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(numStr[i]);
    const pos = (len - i - 1) % 6;
    const isMillionBoundary = (len - i - 1) === 6 || ((len - i - 1) > 6 && (len - i - 1) % 6 === 0);
    if (digit !== 0) {
      if (pos === 1 && digit === 1) out += 'สิบ';
      else if (pos === 1 && digit === 2) out += 'ยี่สิบ';
      else if (pos === 0 && digit === 1 && out !== '' && numStr[i - 1] !== '0') out += 'เอ็ด';
      else out += ONES[digit] + POS[pos];
    }
    if (isMillionBoundary) out += 'ล้าน';
  }
  return out;
}

// อ่านจำนวนเงินเป็นข้อความภาษาไทย เช่น 1234.50 → "หนึ่งพันสองร้อยสามสิบสี่บาทห้าสิบสตางค์"
export function bahtText(amount: number): string {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  const baht = Math.floor(rounded);
  const satang = Math.round((rounded - baht) * 100);
  let text = readInteger(String(baht)) + 'บาท';
  if (satang === 0) text += 'ถ้วน';
  else text += readInteger(String(satang)) + 'สตางค์';
  return text;
}
