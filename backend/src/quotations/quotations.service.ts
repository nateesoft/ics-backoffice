import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationTemplate, QuotationLayout } from '../entities/quotation-template.entity';
import { Quotation } from '../entities/quotation.entity';
import { QuotationCustomer } from '../entities/quotation-customer.entity';
import { QuotationProduct } from '../entities/quotation-product.entity';
import { SaveCustomerDto, SaveProductDto, SaveQuotationDto, SaveTemplateDto } from './quotations.dto';

export const DEFAULT_LAYOUT: QuotationLayout = {
  variant: 'standard',
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
  issuerName: '',
  priceValidity: '',
  deliveryPeriod: '',
  paymentTerms: '',
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

export const ICS_CLASSIC_TEMPLATE_NAME = 'ใบเสนอราคา ICS (ตามแบบฟอร์ม)';

// แม่แบบตามฟอร์มกระดาษของ IN CONCEPT SERVICE — มีกรอบ หัวตารางสองภาษา ช่องเซ็น 3 ช่อง
export const ICS_CLASSIC_LAYOUT: QuotationLayout = {
  ...DEFAULT_LAYOUT,
  variant: 'ics-classic',
  companyName: 'IN CONCEPT SERVICE CO.,LTD',
  companyAddress:
    '101/122 หมู่2 ต.บางคูเวียง อ.บางกรวย จ.นนทบุรี 11130\n101/122 Moo2 Bangkhuwiang Bangkruai Nonthaburi 11130 (THAILAND)',
  companyPhone: '085-3366948 , 084-364-2609',
  companyEmail: 'sales.ics9.service@gmail.com',
  companyTaxId: '0125568000980',
  documentTitle: 'ใบเสนอราคา',
  footerNote: '',
  terms: '',
  signatureLabel: 'ผู้เสนอราคา',
  issuerName: 'ชูชาติ คล่องการ',
  priceValidity: '15 วัน',
  deliveryPeriod: '15 วันหลังได้รับ PO',
  paymentTerms: 'มัดจำ 50% วันส่งสินค้า อีก 50 %',
  accentColor: '#8a6d3b',
  columns: [
    { key: 'no', label: 'เลขที่ / No.', enabled: true },
    { key: 'description', label: 'รายการ / Description', enabled: true },
    { key: 'quantity', label: 'จำนวน / Quantity', enabled: true },
    { key: 'unit', label: 'หน่วย / Unit', enabled: true },
    { key: 'unitPrice', label: 'ราคา/หน่วย / Price/Unit', enabled: true },
    { key: 'discount', label: 'ส่วนลด / Discount', enabled: false },
    { key: 'amount', label: 'จำนวนเงิน / Amount', enabled: true },
  ],
  vatEnabled: true,
  vatRate: 7,
};

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(QuotationTemplate) private templates: Repository<QuotationTemplate>,
    @InjectRepository(Quotation) private quotations: Repository<Quotation>,
    @InjectRepository(QuotationCustomer) private customers: Repository<QuotationCustomer>,
    @InjectRepository(QuotationProduct) private products: Repository<QuotationProduct>,
  ) {}

  // ── Templates ─────────────────────────────────────────────

  async getTemplates() {
    const existing = await this.templates.find();
    if (existing.length === 0) {
      await this.templates.save({
        name: 'แม่แบบมาตรฐาน',
        isDefault: true,
        layout: DEFAULT_LAYOUT,
      });
    }
    // seed แม่แบบตามฟอร์ม ICS ครั้งเดียว (ให้ระบบที่มีแม่แบบเดิมอยู่แล้วได้รับด้วย)
    if (!existing.some((t) => t.name === ICS_CLASSIC_TEMPLATE_NAME)) {
      await this.templates.save({
        name: ICS_CLASSIC_TEMPLATE_NAME,
        isDefault: false,
        layout: ICS_CLASSIC_LAYOUT,
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

  // ── Customers (master data) ─────────────────────────────────

  getCustomers(q?: string) {
    if (q?.trim()) {
      return this.customers
        .createQueryBuilder('c')
        .where('c.name ILIKE :q', { q: `%${q.trim()}%` })
        .orderBy('c.name', 'ASC')
        .getMany();
    }
    return this.customers.find({ order: { name: 'ASC' } });
  }

  async getCustomer(id: number) {
    const c = await this.customers.findOne({ where: { id } });
    if (!c) throw new NotFoundException('ไม่พบลูกค้า');
    return c;
  }

  createCustomer(dto: SaveCustomerDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('กรุณาระบุชื่อลูกค้า');
    return this.customers.save({
      name,
      address: dto.address?.trim() ?? '',
      phone: dto.phone?.trim() ?? '',
      email: dto.email?.trim() ?? '',
      taxId: dto.taxId?.trim() ?? '',
      note: dto.note?.trim() ?? '',
    });
  }

  async updateCustomer(id: number, dto: SaveCustomerDto) {
    const c = await this.getCustomer(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('กรุณาระบุชื่อลูกค้า');
      c.name = name;
    }
    if (dto.address !== undefined) c.address = dto.address.trim();
    if (dto.phone !== undefined) c.phone = dto.phone.trim();
    if (dto.email !== undefined) c.email = dto.email.trim();
    if (dto.taxId !== undefined) c.taxId = dto.taxId.trim();
    if (dto.note !== undefined) c.note = dto.note.trim();
    return this.customers.save(c);
  }

  async removeCustomer(id: number) {
    await this.getCustomer(id);
    await this.customers.delete(id);
  }

  // ── Products / Services (master data) ───────────────────────

  getProducts(q?: string) {
    if (q?.trim()) {
      return this.products
        .createQueryBuilder('p')
        .where('p.name ILIKE :q', { q: `%${q.trim()}%` })
        .orderBy('p.name', 'ASC')
        .getMany();
    }
    return this.products.find({ order: { name: 'ASC' } });
  }

  async getProduct(id: number) {
    const p = await this.products.findOne({ where: { id } });
    if (!p) throw new NotFoundException('ไม่พบสินค้า/บริการ');
    return p;
  }

  createProduct(dto: SaveProductDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('กรุณาระบุชื่อสินค้า/บริการ');
    return this.products.save({
      name,
      unit: dto.unit?.trim() ?? '',
      unitPrice: Number(dto.unitPrice) || 0,
      note: dto.note?.trim() ?? '',
    });
  }

  async updateProduct(id: number, dto: SaveProductDto) {
    const p = await this.getProduct(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('กรุณาระบุชื่อสินค้า/บริการ');
      p.name = name;
    }
    if (dto.unit !== undefined) p.unit = dto.unit.trim();
    if (dto.unitPrice !== undefined) p.unitPrice = Number(dto.unitPrice) || 0;
    if (dto.note !== undefined) p.note = dto.note.trim();
    return this.products.save(p);
  }

  async removeProduct(id: number) {
    await this.getProduct(id);
    await this.products.delete(id);
  }
}
