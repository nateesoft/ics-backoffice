import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollectionsService } from './collections.service';
import { Collection } from './entities/collection.entity';
import { RecordEntity } from './entities/record.entity';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
  remove: jest.Mock;
  createQueryBuilder: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((input: unknown) => input),
    save: jest.fn((input: unknown) => Promise.resolve(input)),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

function createMockQueryBuilder(result: [unknown[], number]) {
  const qb: Record<string, jest.Mock> = {};
  qb.where = jest.fn().mockReturnValue(qb);
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue(result);
  return qb;
}

describe('CollectionsService', () => {
  let service: CollectionsService;
  let collectionsRepo: MockRepo;
  let recordsRepo: MockRepo;

  beforeEach(async () => {
    collectionsRepo = createMockRepo();
    recordsRepo = createMockRepo();

    const module = await Test.createTestingModule({
      providers: [
        CollectionsService,
        { provide: getRepositoryToken(Collection), useValue: collectionsRepo },
        { provide: getRepositoryToken(RecordEntity), useValue: recordsRepo },
      ],
    }).compile();

    service = module.get(CollectionsService);
  });

  describe('generateFromJson', () => {
    it('rejects invalid JSON', async () => {
      await expect(
        service.generateFromJson(Buffer.from('not json'), 'orders.json'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a JSON array of primitives', async () => {
      await expect(
        service.generateFromJson(Buffer.from('[1, 2, 3]'), 'orders.json'),
      ).rejects.toThrow(BadRequestException);
    });

    it('infers field types from an array of rows and derives a slug from the filename', async () => {
      collectionsRepo.findOne.mockResolvedValue(null); // slug is unique on first try
      const rows = [
        {
          id: 1,
          name: 'Alice',
          active: true,
          joined: '2026-01-01',
          meta: { a: 1 },
          tags: ['x'],
        },
      ];

      const collection = await service.generateFromJson(
        Buffer.from(JSON.stringify(rows)),
        'My Users.json',
      );

      expect(collection.slug).toBe('my-users');
      expect(collection.fields).toEqual(
        expect.arrayContaining([
          { name: 'id', type: 'number' },
          { name: 'name', type: 'string' },
          { name: 'active', type: 'boolean' },
          { name: 'joined', type: 'date' },
          { name: 'meta', type: 'object' },
          { name: 'tags', type: 'array' },
        ]),
      );
      expect(recordsRepo.save).toHaveBeenCalledWith([
        expect.objectContaining({ data: rows[0] }),
      ]);
    });

    it('appends a numeric suffix when the slug is already taken', async () => {
      collectionsRepo.findOne
        .mockResolvedValueOnce({ id: 'existing' }) // 'orders' taken
        .mockResolvedValueOnce(null); // 'orders-2' free

      const collection = await service.generateFromJson(
        Buffer.from(JSON.stringify({ id: 1 })),
        'orders.json',
      );

      expect(collection.slug).toBe('orders-2');
    });
  });

  describe('findAllCollections', () => {
    it('paginates using parsed page/limit', async () => {
      collectionsRepo.findAndCount.mockResolvedValue([[{ id: '1' }], 1]);

      const result = await service.findAllCollections('2', '5');

      expect(collectionsRepo.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 5,
        take: 5,
      });
      expect(result).toEqual({
        data: [{ id: '1' }],
        total: 1,
        page: 2,
        limit: 5,
      });
    });
  });

  describe('findCollection', () => {
    it('throws NotFoundException when missing', async () => {
      collectionsRepo.findOne.mockResolvedValue(null);
      await expect(service.findCollection('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the collection when found', async () => {
      const col = { id: 'c1' };
      collectionsRepo.findOne.mockResolvedValue(col);
      await expect(service.findCollection('c1')).resolves.toBe(col);
    });
  });

  describe('removeCollection', () => {
    it('throws NotFoundException when nothing was deleted', async () => {
      collectionsRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeCollection('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves when a row was deleted', async () => {
      collectionsRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.removeCollection('c1')).resolves.toBeUndefined();
    });
  });

  describe('setPublished', () => {
    it('flips the published flag and saves', async () => {
      collectionsRepo.findOne.mockResolvedValue({ id: 'c1', published: false });
      const result = await service.setPublished('c1', true);
      expect(result.published).toBe(true);
      expect(collectionsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ published: true }),
      );
    });
  });

  describe('findPublishedBySlug', () => {
    it('throws NotFoundException for an unpublished or missing slug', async () => {
      collectionsRepo.findOne.mockResolvedValue(null);
      await expect(service.findPublishedBySlug('drafts')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findRecords', () => {
    it('throws when the collection does not exist', async () => {
      collectionsRepo.findOne.mockResolvedValue(null);
      await expect(service.findRecords('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('applies pagination and an optional search filter via the query builder', async () => {
      collectionsRepo.findOne.mockResolvedValue({ id: 'c1' });
      const qb = createMockQueryBuilder([[{ id: 'r1' }], 1]);
      recordsRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findRecords('c1', 'alice', '1', '10');

      expect(qb.where).toHaveBeenCalledWith(
        'record.collectionId = :collectionId',
        {
          collectionId: 'c1',
        },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'record.data::text ILIKE :search',
        {
          search: '%alice%',
        },
      );
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: [{ id: 'r1' }],
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('skips the search filter when no search term is given', async () => {
      collectionsRepo.findOne.mockResolvedValue({ id: 'c1' });
      const qb = createMockQueryBuilder([[], 0]);
      recordsRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findRecords('c1');

      expect(qb.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findRecord', () => {
    it('throws NotFoundException when the record is missing', async () => {
      recordsRepo.findOne.mockResolvedValue(null);
      await expect(service.findRecord('c1', 'r1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRecord', () => {
    it('merges new data into the existing record', async () => {
      recordsRepo.findOne.mockResolvedValue({
        id: 'r1',
        collectionId: 'c1',
        data: { a: 1, b: 2 },
      });
      const result = await service.updateRecord('c1', 'r1', { b: 3, c: 4 });
      expect(result.data).toEqual({ a: 1, b: 3, c: 4 });
    });
  });

  describe('replaceRecord', () => {
    it('overwrites the record data entirely', async () => {
      recordsRepo.findOne.mockResolvedValue({
        id: 'r1',
        collectionId: 'c1',
        data: { a: 1, b: 2 },
      });
      const result = await service.replaceRecord('c1', 'r1', { c: 4 });
      expect(result.data).toEqual({ c: 4 });
    });
  });

  describe('deleteRecord', () => {
    it('removes the record after finding it', async () => {
      const record = { id: 'r1', collectionId: 'c1' };
      recordsRepo.findOne.mockResolvedValue(record);
      await service.deleteRecord('c1', 'r1');
      expect(recordsRepo.remove).toHaveBeenCalledWith(record);
    });
  });
});
