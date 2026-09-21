import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Expense } from './expense.entity';

@Entity('expense_attachments')
export class ExpenseAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  expenseId: number;

  @ManyToOne(() => Expense, (e) => e.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'expenseId' })
  expense: Expense;

  @Column() storedName: string;
  @Column() originalName: string;
  @Column() mimetype: string;
  @Column() size: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
