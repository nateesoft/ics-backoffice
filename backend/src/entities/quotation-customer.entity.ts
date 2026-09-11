import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Master data ลูกค้า — เลือกมาเติมฟิลด์ "ลูกค้า" ในใบเสนอราคาได้ โดยไม่ผูก FK กับ Quotation
// (Quotation เก็บ snapshot ข้อมูลลูกค้า ณ วันที่ออกใบไว้ในตัวเองอยู่แล้ว)
@Entity('quotation_customers')
export class QuotationCustomer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', default: '' })
  address: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  taxId: string;

  @Column({ type: 'text', default: '' })
  note: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
