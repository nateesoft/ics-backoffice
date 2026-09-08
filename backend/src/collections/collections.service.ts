import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult, parsePagination } from '../common/pagination';
import { generateUniqueSlug } from '../common/slug.util';
import {
  Collection,
  FieldSchema,
  FieldType,
} from './entities/collection.entity';
import { RecordEntity } from './entities/record.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionsRepo: Repository<Collection>,
    @InjectRepository(RecordEntity)
    private readonly recordsRepo: Repository<RecordEntity>,
  ) {}

  async generateFromJson(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<Collection> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fileBuffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON');
    }

    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (rows.length === 0 || typeof rows[0] !== 'object' || rows[0] === null) {
      throw new BadRequestException(
        'JSON must be an object or an array of objects',
      );
    }

    const fields = inferSchema(rows as Record<string, unknown>[]);
    const name = fileName.replace(/\.json$/i, '');
    const slug = await generateUniqueSlug(this.collectionsRepo, name);

    const collection = await this.collectionsRepo.save(
      this.collectionsRepo.create({ name, slug, fields }),
    );

    const records = rows.map((row) =>
      this.recordsRepo.create({
        collectionId: collection.id,
        data: row as Record<string, unknown>,
      }),
    );
    await this.recordsRepo.save(records);

    return collection;
  }

  async findAllCollections(
    page?: string,
    limit?: string,
  ): Promise<PaginatedResult<Collection>> {
    const pagination = parsePagination(page, limit);
    const [data, total] = await this.collectionsRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findCollection(id: string) {
    const collection = await this.collectionsRepo.findOne({ where: { id } });
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }

  async removeCollection(id: string) {
    const result = await this.collectionsRepo.delete(id);
    if (!result.affected) throw new NotFoundException('Collection not found');
  }

  async setPublished(id: string, published: boolean) {
    const collection = await this.findCollection(id);
    collection.published = published;
    return this.collectionsRepo.save(collection);
  }

  async findPublishedBySlug(slug: string) {
    const collection = await this.collectionsRepo.findOne({
      where: { slug, published: true },
    });
    if (!collection) throw new NotFoundException('API not found');
    return collection;
  }

  async findRecords(
    collectionId: string,
    search?: string,
    page?: string,
    limit?: string,
  ): Promise<PaginatedResult<RecordEntity>> {
    await this.findCollection(collectionId);
    const pagination = parsePagination(page, limit);
    const qb = this.recordsRepo
      .createQueryBuilder('record')
      .where('record.collectionId = :collectionId', { collectionId })
      .orderBy('record.createdAt', 'ASC')
      .skip(pagination.skip)
      .take(pagination.limit);
    if (search) {
      qb.andWhere('record.data::text ILIKE :search', { search: `%${search}%` });
    }
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  // Exact-match AND filter across one or more record.data fields — used by custom-endpoints'
  // 'findBy' and 'validate' actions. Field names are interpolated into the JSONB `->>'field'`
  // accessor (TypeORM can't parameterize identifiers), so they're validated against a strict
  // alnum/underscore pattern first; values are always bound as query parameters.
  async findRecordsByFields(
    collectionId: string,
    criteria: Record<string, unknown>,
    page?: string,
    limit?: string,
  ): Promise<PaginatedResult<RecordEntity>> {
    await this.findCollection(collectionId);
    const pagination = parsePagination(page, limit);
    const qb = this.recordsRepo
      .createQueryBuilder('record')
      .where('record.collectionId = :collectionId', { collectionId })
      .orderBy('record.createdAt', 'ASC')
      .skip(pagination.skip)
      .take(pagination.limit);
    Object.entries(criteria).forEach(([field, value], index) => {
      if (!/^[a-zA-Z0-9_]+$/.test(field)) {
        throw new BadRequestException(`Invalid field name: ${field}`);
      }
      const param = `findByVal${index}`;
      qb.andWhere(`record.data->>'${field}' = :${param}`, {
        [param]: String(value),
      });
    });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findRecord(collectionId: string, recordId: string) {
    const record = await this.recordsRepo.findOne({
      where: { id: recordId, collectionId },
    });
    if (!record) throw new NotFoundException('Record not found');
    return record;
  }

  async createRecord(collectionId: string, data: Record<string, unknown>) {
    await this.findCollection(collectionId);
    const record = this.recordsRepo.create({ collectionId, data });
    return this.recordsRepo.save(record);
  }

  async updateRecord(
    collectionId: string,
    recordId: string,
    data: Record<string, unknown>,
  ) {
    const record = await this.findRecord(collectionId, recordId);
    record.data = { ...record.data, ...data };
    return this.recordsRepo.save(record);
  }

  async replaceRecord(
    collectionId: string,
    recordId: string,
    data: Record<string, unknown>,
  ) {
    const record = await this.findRecord(collectionId, recordId);
    record.data = data;
    return this.recordsRepo.save(record);
  }

  async deleteRecord(collectionId: string, recordId: string) {
    const record = await this.findRecord(collectionId, recordId);
    await this.recordsRepo.remove(record);
  }
}

function inferSchema(rows: Record<string, unknown>[]): FieldSchema[] {
  const typeByField = new Map<string, FieldType>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (typeByField.has(key)) continue;
      typeByField.set(key, detectType(value));
    }
  }
  return Array.from(typeByField.entries()).map(([name, type]) => ({
    name,
    type,
  }));
}

function detectType(value: unknown): FieldType {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return 'array';
  switch (typeof value) {
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    case 'string':
      return /^\d{4}-\d{2}-\d{2}/.test(value) ? 'date' : 'string';
    default:
      return 'string';
  }
}
