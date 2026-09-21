import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ExpenseAttachment } from './expense-attachment.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn()
  id: number;

  // เก็บเป็น string yyyy-mm-dd (เหมือน Quotation.issueDate)
  @Column({ type: 'varchar', default: '' })
  date: string;

  @Column({ type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'float', nullable: true })
  locationLat: number | null;

  @Column({ type: 'float', nullable: true })
  locationLng: number | null;

  @Column({ type: 'varchar', nullable: true })
  locationLabel: string | null;

  @Column()
  createdBy: string;

  @OneToMany(() => ExpenseAttachment, (a) => a.expense, { cascade: true, eager: true })
  attachments: ExpenseAttachment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
