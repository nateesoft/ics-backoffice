import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Master data สินค้า/บริการ — เลือกมาเติมรายการในใบเสนอราคาได้ โดยไม่ผูก FK กับ Quotation
// (Quotation เก็บ snapshot ของแต่ละรายการไว้ใน items jsonb อยู่แล้ว)
@Entity('quotation_products')
export class QuotationProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // รายละเอียด/ชื่อสินค้า-บริการ

  @Column({ default: '' })
  unit: string;

  @Column({ type: 'float', default: 0 })
  unitPrice: number;

  @Column({ type: 'text', default: '' })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
