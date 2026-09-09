import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number; // ส่วนลดต่อรายการ (จำนวนเงิน)
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

@Entity('quotations')
export class Quotation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  templateId: number | null;

  @Column()
  quotationNo: string;

  // ลูกค้า
  @Column({ default: '' })
  customerName: string;

  @Column({ type: 'text', default: '' })
  customerAddress: string;

  @Column({ default: '' })
  customerPhone: string;

  @Column({ default: '' })
  customerEmail: string;

  @Column({ default: '' })
  customerTaxId: string;

  @Column({ default: '' })
  attention: string; // เรียน / ผู้ติดต่อ

  @Column({ default: '' })
  projectName: string;

  // วันที่ (เก็บเป็น string yyyy-mm-dd)
  @Column({ type: 'varchar', default: '' })
  issueDate: string;

  @Column({ type: 'varchar', default: '' })
  validUntil: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  items: QuotationItem[];

  @Column({ type: 'float', default: 0 })
  discount: number; // ส่วนลดท้ายบิล (จำนวนเงิน)

  @Column({ type: 'float', default: 0 })
  vatRate: number;

  @Column({ type: 'float', default: 0 })
  withholdingRate: number;

  @Column({ type: 'text', default: '' })
  note: string;

  @Column({ type: 'text', default: '' })
  terms: string;

  @Column({ type: 'varchar', default: 'draft' })
  status: QuotationStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
