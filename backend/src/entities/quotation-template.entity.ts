import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// รูปแบบ layout ของใบเสนอราคา — เก็บเป็น jsonb ทั้งก้อนเพื่อให้ปรับแต่งได้อิสระ
export interface QuotationLayout {
  // รูปแบบการวางเลย์เอาต์: 'standard' = โมเดิร์น, 'ics-classic' = ฟอร์มตามแบบ ICS (มีกรอบ/สองภาษา)
  variant: 'standard' | 'ics-classic';

  // ข้อมูลบริษัทผู้เสนอราคา
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyTaxId: string;
  logoUrl: string; // URL หรือ data URL (base64)

  // หัว/ท้ายเอกสาร
  documentTitle: string; // เช่น "ใบเสนอราคา / QUOTATION"
  headerNote: string;
  footerNote: string;
  terms: string; // เงื่อนไข/หมายเหตุ (หลายบรรทัด)
  bankDetails: string;
  signatureLabel: string;

  // ── ใช้เฉพาะ variant 'ics-classic' ──
  issuerName: string; // ชื่อผู้เสนอราคาที่ลงนาม เช่น "ชูชาติ คล่องการ"
  priceValidity: string; // กำหนดยืนราคา
  deliveryPeriod: string; // กำหนดส่งของ
  paymentTerms: string; // เงื่อนไขการชำระเงิน

  // สไตล์
  accentColor: string;
  fontFamily: string;

  // คอลัมน์ในตารางรายการ — เปิด/ปิด + ป้ายกำกับ
  columns: {
    key: 'no' | 'description' | 'quantity' | 'unit' | 'unitPrice' | 'discount' | 'amount';
    label: string;
    enabled: boolean;
  }[];

  // การเงิน
  currency: string; // เช่น "บาท", "THB"
  vatEnabled: boolean;
  vatRate: number; // %
  withholdingEnabled: boolean;
  withholdingRate: number; // %

  // การพิมพ์
  paperSize: 'A4' | 'A5' | 'A3' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  marginMm: number;
}

@Entity('quotation_templates')
export class QuotationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'jsonb' })
  layout: QuotationLayout;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
