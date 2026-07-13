import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { CollectionsService } from '../collections/collections.service';
import {
  CustomEndpointsService,
  CustomEndpointInput,
} from './custom-endpoints.service';
import { CustomEndpoint } from './entities/custom-endpoint.entity';

type MockRepo = {
  find: jest.Mock;
  findOne: jest.Mock;
  findAndCount: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn((input: unknown) => input),
    save: jest.fn((input: Record<string, unknown>) =>
      Promise.resolve({ id: 'ep-1', ...input }),
    ),
    delete: jest.fn(),
  };
}

function baseInput(
  overrides: Partial<CustomEndpointInput> = {},
): CustomEndpointInput {
  return {
    name: 'List orders',
    method: 'GET',
    path: 'orders',
    action: 'list',
    collectionId: 'col-1',
    inputMapping: [],
    transformSteps: [],
    responseMapping: [],
    authType: 'none',
    ...overrides,
  };
}

describe('CustomEndpointsService', () => {
  let service: CustomEndpointsService;
  let repo: MockRepo;
  let collectionsService: {
    findCollection: jest.Mock;
    findRecords: jest.Mock;
    findRecord: jest.Mock;
    createRecord: jest.Mock;
    updateRecord: jest.Mock;
    deleteRecord: jest.Mock;
  };

  beforeEach(async () => {
    repo = createMockRepo();
    collectionsService = {
      findCollection: jest
        .fn()
        .mockResolvedValue({ id: 'col-1', published: true }),
      findRecords: jest.fn(),
      findRecord: jest.fn(),
      createRecord: jest.fn(),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CustomEndpointsService,
        { provide: getRepositoryToken(CustomEndpoint), useValue: repo },
        { provide: CollectionsService, useValue: collectionsService },
      ],
    }).compile();

    service = module.get(CustomEndpointsService);
  });

  describe('create - validation', () => {
    it('rejects a blank name', async () => {
      await expect(service.create(baseInput({ name: '  ' }))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown collection', async () => {
      collectionsService.findCollection.mockRejectedValue(
        new NotFoundException(),
      );
      await expect(service.create(baseInput())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('normalizes each path segment to lowercase, hyphenated text', async () => {
      repo.findOne.mockResolvedValue(null);
      await service.create(baseInput({ path: 'Order Items / By Customer!!' }));
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'order-items/by-customer' }),
      );
    });

    it('rejects duplicate request fields in the input mapping', async () => {
      await expect(
        service.create(
          baseInput({
            inputMapping: [
              { requestField: 'name', recordField: 'name', required: true },
              { requestField: 'name', recordField: 'other', required: false },
            ],
          }),
        ),
      ).rejects.toThrow('Duplicate request field mapping');
    });

    it('rejects an invalid transform expression', async () => {
      await expect(
        service.create(
          baseInput({
            transformSteps: [{ field: 'total', expression: 'price *' }],
          }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires a username and password for basic auth', async () => {
      await expect(
        service.create(baseInput({ authType: 'basic' })),
      ).rejects.toThrow('Username is required for Basic Auth');

      await expect(
        service.create(baseInput({ authType: 'basic', authUsername: 'admin' })),
      ).rejects.toThrow('Password is required for Basic Auth');
    });

    it('requires a token for bearer auth', async () => {
      await expect(
        service.create(baseInput({ authType: 'bearer' })),
      ).rejects.toThrow('Token is required for Bearer Auth');
    });

    it('hashes the secret and never returns it', async () => {
      repo.findOne.mockResolvedValue(null);
      const created = await service.create(
        baseInput({ authType: 'bearer', authToken: 'super-secret' }),
      );
      expect(
        (created as unknown as { authSecretHash?: string }).authSecretHash,
      ).toBeUndefined();
    });

    it('raises ConflictException when method+path is already taken', async () => {
      repo.findOne.mockResolvedValue({ id: 'other-endpoint' });
      await expect(service.create(baseInput())).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update - preserving secrets', () => {
    it('keeps the existing hash when auth type is unchanged and no new secret is given', async () => {
      const existing = {
        id: 'ep-1',
        authType: 'bearer',
        authUsername: null,
        collectionId: 'col-1',
      } as CustomEndpoint;
      repo.findOne
        .mockResolvedValueOnce(existing) // findOne() inside update() -> findOne(id)
        .mockResolvedValueOnce({ id: 'ep-1', authSecretHash: 'existing-hash' }) // secret lookup
        .mockResolvedValueOnce(null); // assertUnique

      await service.update(
        'ep-1',
        baseInput({ method: 'GET', path: 'orders', authType: 'bearer' }),
      );

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ authSecretHash: 'existing-hash' }),
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when nothing was deleted', async () => {
      repo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('execute - routing', () => {
    function makeDef(overrides: Partial<CustomEndpoint> = {}): CustomEndpoint {
      return {
        id: 'ep-1',
        name: 'Endpoint',
        method: 'GET',
        path: 'orders',
        action: 'list',
        collectionId: 'col-1',
        inputMapping: [],
        transformSteps: [],
        responseMapping: [],
        authType: 'none',
        authUsername: null,
        authSecretHash: null,
        createdAt: new Date(),
        ...overrides,
      } as CustomEndpoint;
    }

    it('resolves a plain path to a non-id action (list)', async () => {
      repo.findOne.mockResolvedValueOnce(makeDef({ action: 'list' }));
      collectionsService.findRecords.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await service.execute('GET', '/orders/', {});

      expect(result.status).toBe(200);
      expect(collectionsService.findRecords).toHaveBeenCalledWith(
        'col-1',
        undefined,
        undefined,
        undefined,
      );
    });

    it('extracts a record id from the tail of the path for id-based actions', async () => {
      repo.findOne
        .mockResolvedValueOnce(null) // no exact match on 'orders/abc-123'
        .mockResolvedValueOnce(makeDef({ path: 'orders', action: 'get' })); // base path match
      collectionsService.findRecord.mockResolvedValue({
        id: 'abc-123',
        data: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.execute('GET', 'orders/abc-123', {});

      expect(result.status).toBe(200);
      expect(collectionsService.findRecord).toHaveBeenCalledWith(
        'col-1',
        'abc-123',
      );
    });

    it('returns 404 when no endpoint matches', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.execute('GET', 'nope', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns 404 when the underlying collection is unpublished', async () => {
      repo.findOne.mockResolvedValueOnce(makeDef({ action: 'list' }));
      collectionsService.findCollection.mockResolvedValue({
        id: 'col-1',
        published: false,
      });

      await expect(service.execute('GET', 'orders', {})).rejects.toThrow(
        'This endpoint is not available',
      );
    });

    it('applies input mapping on create', async () => {
      repo.findOne.mockResolvedValueOnce(
        makeDef({
          action: 'create',
          method: 'POST',
          inputMapping: [
            {
              requestField: 'customerName',
              recordField: 'name',
              required: true,
            },
          ],
        }),
      );
      collectionsService.createRecord.mockResolvedValue({
        id: 'r1',
        data: { name: 'Alice' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.execute('POST', 'orders', {
        customerName: 'Alice',
      });

      expect(collectionsService.createRecord).toHaveBeenCalledWith('col-1', {
        name: 'Alice',
      });
      expect(result.status).toBe(201);
    });
  });

  describe('execute - auth', () => {
    function makeAuthedDef(
      authType: 'basic' | 'bearer',
      hash: string,
    ): Partial<CustomEndpoint> {
      return {
        id: 'ep-1',
        method: 'GET',
        path: 'orders',
        action: 'list',
        collectionId: 'col-1',
        inputMapping: [],
        transformSteps: [],
        responseMapping: [],
        authType,
        authUsername: authType === 'basic' ? 'admin' : null,
        authSecretHash: hash,
      };
    }

    it('rejects requests with no Authorization header', async () => {
      repo.findOne.mockResolvedValueOnce(makeAuthedDef('bearer', 'hash'));
      await expect(service.execute('GET', 'orders', {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('accepts a valid bearer token', async () => {
      const hash = await bcrypt.hash('secret-token', 4);
      repo.findOne
        .mockResolvedValueOnce(makeAuthedDef('bearer', hash))
        .mockResolvedValueOnce({ id: 'ep-1', authSecretHash: hash });
      collectionsService.findRecords.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const result = await service.execute(
        'GET',
        'orders',
        {},
        'Bearer secret-token',
      );
      expect(result.status).toBe(200);
    });

    it('rejects an invalid bearer token', async () => {
      const hash = await bcrypt.hash('secret-token', 4);
      repo.findOne
        .mockResolvedValueOnce(makeAuthedDef('bearer', hash))
        .mockResolvedValueOnce({ id: 'ep-1', authSecretHash: hash });

      await expect(
        service.execute('GET', 'orders', {}, 'Bearer wrong-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts valid basic auth credentials', async () => {
      const hash = await bcrypt.hash('s3cret', 4);
      repo.findOne
        .mockResolvedValueOnce(makeAuthedDef('basic', hash))
        .mockResolvedValueOnce({ id: 'ep-1', authSecretHash: hash });
      collectionsService.findRecords.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      });

      const header = `Basic ${Buffer.from('admin:s3cret').toString('base64')}`;
      const result = await service.execute('GET', 'orders', {}, header);
      expect(result.status).toBe(200);
    });

    it('rejects basic auth with the wrong username', async () => {
      const hash = await bcrypt.hash('s3cret', 4);
      repo.findOne
        .mockResolvedValueOnce(makeAuthedDef('basic', hash))
        .mockResolvedValueOnce({ id: 'ep-1', authSecretHash: hash });

      const header = `Basic ${Buffer.from('someone-else:s3cret').toString('base64')}`;
      await expect(
        service.execute('GET', 'orders', {}, header),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
