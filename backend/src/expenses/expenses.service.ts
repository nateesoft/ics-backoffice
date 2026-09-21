import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { Expense } from '../entities/expense.entity';
import { ExpenseAttachment } from '../entities/expense-attachment.entity';
import { ExpenseCategory } from '../entities/expense-category.entity';
import { SaveExpenseDto, SaveExpenseCategoryDto } from './expenses.dto';

const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'อาหาร/เครื่องดื่ม', color: '#2a78d6' },
  { name: 'เดินทาง/น้ำมัน', color: '#eb6834' },
  { name: 'ที่พัก', color: '#1baf7a' },
  { name: 'ค่าออฟฟิศ/อุปกรณ์', color: '#eda100' },
  { name: 'สื่อสาร/อินเทอร์เน็ต', color: '#e87ba4' },
  { name: 'บันเทิง/รับรอง', color: '#008300' },
  { name: 'อื่นๆ', color: '#4a3aa7' },
];

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense) private expenses: Repository<Expense>,
    @InjectRepository(ExpenseAttachment) private attachmentsRepo: Repository<ExpenseAttachment>,
    @InjectRepository(ExpenseCategory) private categories: Repository<ExpenseCategory>,
  ) {}

  // ── Categories (master data) ─────────────────────────────

  async getCategories() {
    const existing = await this.categories.find();
    if (existing.length === 0) {
      await this.categories.save(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })));
    }
    return this.categories.find({ order: { sortOrder: 'ASC', id: 'ASC' } });
  }

  async createCategory(dto: SaveExpenseCategoryDto) {
    const maxResult = await this.categories
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'max')
      .getRawOne<{ max: number | null }>();
    const nextOrder = (maxResult?.max ?? -1) + 1;
    return this.categories.save({
      name: dto.name?.trim() || 'หมวดหมู่ใหม่',
      color: dto.color?.trim() || '#6366f1',
      sortOrder: nextOrder,
    });
  }

  async updateCategory(id: number, dto: SaveExpenseCategoryDto) {
    const c = await this.categories.findOne({ where: { id } });
    if (!c) throw new NotFoundException('ไม่พบหมวดหมู่');
    if (dto.name !== undefined) c.name = dto.name.trim() || c.name;
    if (dto.color !== undefined) c.color = dto.color.trim() || c.color;
    return this.categories.save(c);
  }

  async removeCategory(id: number) {
    const c = await this.categories.findOne({ where: { id } });
    if (!c) throw new NotFoundException('ไม่พบหมวดหมู่');
    await this.categories.delete(id);
    // รายจ่ายที่เคยผูกหมวดหมู่นี้ยังอยู่ในระบบ แค่ไม่มีหมวดหมู่ (ไม่ลบ record)
    await this.expenses.update({ categoryId: id }, { categoryId: null });
  }

  // ── Expenses ──────────────────────────────────────────────

  getExpenses(from?: string, to?: string, categoryId?: number) {
    // leftJoinAndSelect ต้องระบุเอง — eager: true บน entity ใช้ไม่ได้กับ QueryBuilder
    const qb = this.expenses
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.attachments', 'attachments')
      .orderBy('e.date', 'DESC')
      .addOrderBy('e.id', 'DESC');
    if (from) qb.andWhere('e.date >= :from', { from });
    if (to) qb.andWhere('e.date <= :to', { to });
    if (categoryId !== undefined) qb.andWhere('e.categoryId = :categoryId', { categoryId });
    return qb.getMany();
  }

  async getExpense(id: number) {
    const e = await this.expenses.findOne({ where: { id } });
    if (!e) throw new NotFoundException('ไม่พบรายการค่าใช้จ่าย');
    return e;
  }

  createExpense(dto: SaveExpenseDto, createdBy: string) {
    return this.expenses.save({
      date: dto.date?.trim() || new Date().toISOString().slice(0, 10),
      categoryId: dto.categoryId ?? null,
      amount: Number(dto.amount) || 0,
      description: dto.description?.trim() ?? '',
      locationLat: dto.locationLat ?? null,
      locationLng: dto.locationLng ?? null,
      locationLabel: dto.locationLabel?.trim() || null,
      createdBy,
    });
  }

  async updateExpense(id: number, dto: SaveExpenseDto) {
    const e = await this.getExpense(id);
    if (dto.date !== undefined) e.date = dto.date.trim() || e.date;
    if (dto.categoryId !== undefined) e.categoryId = dto.categoryId;
    if (dto.amount !== undefined) e.amount = Number(dto.amount) || 0;
    if (dto.description !== undefined) e.description = dto.description.trim();
    if (dto.locationLat !== undefined) e.locationLat = dto.locationLat;
    if (dto.locationLng !== undefined) e.locationLng = dto.locationLng;
    if (dto.locationLabel !== undefined) e.locationLabel = dto.locationLabel?.trim() || null;
    return this.expenses.save(e);
  }

  async removeExpense(id: number) {
    const e = await this.getExpense(id);
    for (const att of e.attachments ?? []) {
      await unlink(join(process.cwd(), 'uploads', att.storedName)).catch(() => null);
    }
    await this.expenses.delete(id);
  }

  saveAttachment(expenseId: number, file: Express.Multer.File) {
    return this.attachmentsRepo.save({
      expenseId,
      storedName: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  async removeAttachment(id: number) {
    const att = await this.attachmentsRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException();
    await unlink(join(process.cwd(), 'uploads', att.storedName)).catch(() => null);
    await this.attachmentsRepo.delete(id);
  }

  async findAttachment(id: number) {
    const att = await this.attachmentsRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException();
    return att;
  }

  // ── สรุปรวมรายจ่าย: วัน / เดือน / ปี (อิงจากวันที่ที่เลือก) ─────

  async getSummary(dateStr: string) {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    const yearPrefix = date.slice(0, 4);
    const monthPrefix = date.slice(0, 7);

    const yearExpenses = await this.expenses
      .createQueryBuilder('e')
      .where('e.date LIKE :p', { p: `${yearPrefix}%` })
      .getMany();
    const monthExpenses = yearExpenses.filter((e) => e.date.startsWith(monthPrefix));
    const dayExpenses = yearExpenses.filter((e) => e.date === date);

    const categories = await this.categories.find();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    const summarize = (list: Expense[]) => {
      const total = list.reduce((s, e) => s + Number(e.amount), 0);
      const byCategoryMap = new Map<number, number>();
      for (const e of list) {
        const key = e.categoryId ?? 0;
        byCategoryMap.set(key, (byCategoryMap.get(key) ?? 0) + Number(e.amount));
      }
      const byCategory = Array.from(byCategoryMap.entries())
        .map(([categoryId, catTotal]) => {
          const cat = categoryId ? catMap.get(categoryId) : undefined;
          return {
            categoryId: categoryId || null,
            categoryName: cat?.name ?? 'ไม่ระบุหมวดหมู่',
            color: cat?.color ?? '#94a3b8',
            total: catTotal,
          };
        })
        .sort((a, b) => b.total - a.total);
      return { total, count: list.length, byCategory };
    };

    return {
      date,
      day: summarize(dayExpenses),
      month: summarize(monthExpenses),
      year: summarize(yearExpenses),
    };
  }
}
