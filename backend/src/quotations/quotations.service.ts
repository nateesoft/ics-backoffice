import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationTemplate, QuotationLayout } from '../entities/quotation-template.entity';
import { Quotation } from '../entities/quotation.entity';
import { SaveQuotationDto, SaveTemplateDto } from './quotations.dto';

export const DEFAULT_LAYOUT: QuotationLayout = {
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

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationTemplate) private templates: Repository<QuotationTemplate>,
    @InjectRepository(Quotation) private quotations: Repository<Quotation>,
  ) {}

  // ── Templates ─────────────────────────────────────────────

  async getTemplates() {
    const count = await this.templates.count();
    if (count === 0) {
      await this.templates.save({
        name: 'แม่แบบมาตรฐาน',
        isDefault: true,
        layout: DEFAULT_LAYOUT,
      });
    }
    return this.templates.find({ order: { isDefault: 'DESC', createdAt: 'ASC' } });
  }

  async getTemplate(id: number) {
    const t = await this.templates.findOne({ where: { id } });
    if (!t) throw new NotFoundException('ไม่พบแม่แบบ');
    return t;
  }

  async createTemplate(dto: SaveTemplateDto) {
    const layout = { ...DEFAULT_LAYOUT, ...(dto.layout as Partial<QuotationLayout>) };
    const created = await this.templates.save({
      name: dto.name?.trim() || 'แม่แบบใหม่',
      isDefault: false,
      layout,
    });
    if (dto.isDefault) await this.setDefault(created.id);
    return this.getTemplate(created.id);
  }

  async updateTemplate(id: number, dto: SaveTemplateDto) {
    const t = await this.getTemplate(id);
    if (dto.name !== undefined) t.name = dto.name.trim() || t.name;
    if (dto.layout !== undefined) {
      t.layout = { ...DEFAULT_LAYOUT, ...t.layout, ...(dto.layout as Partial<QuotationLayout>) };
    }
    await this.templates.save(t);
    if (dto.isDefault) await this.setDefault(id);
    return this.getTemplate(id);
  }

  async setDefault(id: number) {
    await this.getTemplate(id);
    // เคลียร์ default เดิมทั้งหมด (TypeORM ไม่อนุญาต criteria ว่างใน update)
    await this.templates
      .createQueryBuilder()
      .update()
      .set({ isDefault: false })
      .where('isDefault = :d', { d: true })
      .execute();
    await this.templates.update({ id }, { isDefault: true });
    return this.getTemplate(id);
  }

  async removeTemplate(id: number) {
    const t = await this.getTemplate(id);
    await this.templates.delete(id);
    // ถ้าลบตัว default ให้เลื่อน default ไปตัวแรกที่เหลือ
    if (t.isDefault) {
      const next = await this.templates.find({ order: { createdAt: 'ASC' }, take: 1 });
      if (next[0]) await this.templates.update({ id: next[0].id }, { isDefault: true });
    }
  }

  // ── Quotations ────────────────────────────────────────────

  getQuotations() {
    return this.quotations.find({ order: { createdAt: 'DESC' } });
  }

  async getQuotation(id: number) {
    const q = await this.quotations.findOne({ where: { id } });
    if (!q) throw new NotFoundException('ไม่พบใบเสนอราคา');
    return q;
  }

  private normalizeItems(dto: SaveQuotationDto) {
    return (dto.items ?? []).map((it) => ({
      description: it.description ?? '',
      quantity: Number(it.quantity ?? 0),
      unit: it.unit ?? '',
      unitPrice: Number(it.unitPrice ?? 0),
      discount: Number(it.discount ?? 0),
    }));
  }

  async createQuotation(dto: SaveQuotationDto) {
    let templateId = dto.templateId ?? null;
    if (templateId == null) {
      const def = (await this.getTemplates()).find((t) => t.isDefault);
      templateId = def?.id ?? null;
    }
    const q = this.quotations.create({
      ...dto,
      templateId,
      items: this.normalizeItems(dto),
      quotationNo: dto.quotationNo?.trim() || (await this.nextQuotationNo()),
      status: (dto.status as Quotation['status']) || 'draft',
    } as Partial<Quotation>);
    return this.quotations.save(q);
  }

  async updateQuotation(id: number, dto: SaveQuotationDto) {
    const q = await this.getQuotation(id);
    Object.assign(q, {
      ...dto,
      items: dto.items !== undefined ? this.normalizeItems(dto) : q.items,
      status: (dto.status as Quotation['status']) || q.status,
    });
    return this.quotations.save(q);
  }

  async removeQuotation(id: number) {
    await this.getQuotation(id);
    await this.quotations.delete(id);
  }

  private async nextQuotationNo() {
    const now = new Date();
    const prefix = `QT${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.quotations
      .createQueryBuilder('q')
      .where('q.quotationNo LIKE :p', { p: `${prefix}%` })
      .getCount();
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }
}
