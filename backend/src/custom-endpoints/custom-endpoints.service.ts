import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { CollectionsService } from '../collections/collections.service';
import { PaginatedResult, parsePagination } from '../common/pagination';
import {
  CustomEndpoint,
  CustomEndpointAction,
  CustomEndpointAuthType,
  HttpMethod,
  InputMappingRule,
  ResponseMappingRule,
  TransformStep,
} from './entities/custom-endpoint.entity';
import {
  applyInputMapping,
  applyResponseMapping,
  applyTransformSteps,
  flattenRecord,
  validateTransformExpression,
} from './mapping.util';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ACTIONS: CustomEndpointAction[] = [
  'list',
  'get',
  'create',
  'update',
  'delete',
];
const ID_ACTIONS: CustomEndpointAction[] = ['get', 'update', 'delete'];
const AUTH_TYPES: CustomEndpointAuthType[] = ['none', 'basic', 'bearer'];
const SALT_ROUNDS = 10;

export interface CustomEndpointInput {
  name: string;
  method: HttpMethod;
  path: string;
  action: CustomEndpointAction;
  collectionId: string;
  inputMapping: InputMappingRule[];
  transformSteps: TransformStep[];
  responseMapping: ResponseMappingRule[];
  authType: CustomEndpointAuthType;
  authUsername?: string | null;
  authPassword?: string;
  authToken?: string;
}

interface NormalizedCustomEndpoint {
  name: string;
  method: HttpMethod;
  path: string;
  action: CustomEndpointAction;
  collectionId: string;
  inputMapping: InputMappingRule[];
  transformSteps: TransformStep[];
  responseMapping: ResponseMappingRule[];
  authType: CustomEndpointAuthType;
  authUsername: string | null;
  authSecretHash: string | null;
}

@Injectable()
export class CustomEndpointsService {
  constructor(
    @InjectRepository(CustomEndpoint)
    private readonly repo: Repository<CustomEndpoint>,
    private readonly collectionsService: CollectionsService,
  ) {}

  async findAll(
    page?: string,
    limit?: string,
  ): Promise<PaginatedResult<CustomEndpoint>> {
    const pagination = parsePagination(page, limit);
    const [data, total] = await this.repo.findAndCount({
      relations: { collection: true },
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string) {
    const endpoint = await this.repo.findOne({
      where: { id },
      relations: { collection: true },
    });
    if (!endpoint) throw new NotFoundException('Custom endpoint not found');
    return endpoint;
  }

  async create(input: CustomEndpointInput) {
    const payload = await this.validateAndNormalize(input, null);
    await this.assertUnique(payload.method, payload.path);
    try {
      const saved = await this.repo.save(this.repo.create(payload));
      return this.omitSecret(saved);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async update(id: string, input: CustomEndpointInput) {
    const endpoint = await this.findOne(id);
    const requestedAuthType = input.authType ?? 'none';
    let existingHash: string | null = null;
    if (
      endpoint.authType === requestedAuthType &&
      requestedAuthType !== 'none'
    ) {
      const row = await this.repo.findOne({
        where: { id },
        select: { id: true, authSecretHash: true },
      });
      existingHash = row?.authSecretHash ?? null;
    }
    const payload = await this.validateAndNormalize(input, existingHash);
    await this.assertUnique(payload.method, payload.path, id);
    Object.assign(endpoint, payload);
    try {
      const saved = await this.repo.save(endpoint);
      return this.omitSecret(saved);
    } catch (error) {
      throw this.translateUniqueViolation(error);
    }
  }

  async remove(id: string) {
    const result = await this.repo.delete(id);
    if (!result.affected)
      throw new NotFoundException('Custom endpoint not found');
  }

  async execute(
    method: HttpMethod,
    rawSubPath: string,
    body: Record<string, unknown>,
    authHeader?: string,
    query?: { page?: string; limit?: string },
  ) {
    const { def, recordId } = await this.match(method, rawSubPath);
    await this.verifyAuth(def.id, def.authType, def.authUsername, authHeader);

    const collection = await this.collectionsService.findCollection(
      def.collectionId,
    );
    if (!collection.published) {
      throw new NotFoundException('This endpoint is not available');
    }

    switch (def.action) {
      case 'list': {
        const result = await this.collectionsService.findRecords(
          def.collectionId,
          undefined,
          query?.page,
          query?.limit,
        );
        return {
          status: 200,
          data: {
            ...result,
            data: result.data.map((r) => this.toResponseData(r, def)),
          },
        };
      }
      case 'get': {
        const record = await this.collectionsService.findRecord(
          def.collectionId,
          recordId!,
        );
        return { status: 200, data: this.toResponseData(record, def) };
      }
      case 'create': {
        const data = applyInputMapping(body, def.inputMapping);
        const record = await this.collectionsService.createRecord(
          def.collectionId,
          data,
        );
        return { status: 201, data: this.toResponseData(record, def) };
      }
      case 'update': {
        const data = applyInputMapping(body, def.inputMapping);
        const record = await this.collectionsService.updateRecord(
          def.collectionId,
          recordId!,
          data,
        );
        return { status: 200, data: this.toResponseData(record, def) };
      }
      case 'delete': {
        await this.collectionsService.deleteRecord(def.collectionId, recordId!);
        return { status: 204, data: undefined };
      }
    }
  }

  private toResponseData(
    record: Parameters<typeof flattenRecord>[0],
    def: CustomEndpoint,
  ) {
    const flat = flattenRecord(record);
    const transformed = applyTransformSteps(flat, def.transformSteps);
    return applyResponseMapping(transformed, def.responseMapping);
  }

  private async match(
    method: HttpMethod,
    rawSubPath: string,
  ): Promise<{ def: CustomEndpoint; recordId?: string }> {
    const path = rawSubPath.toLowerCase().replace(/^\/+|\/+$/g, '');
    if (!path) throw new NotFoundException('Custom endpoint not found');

    const exact = await this.repo.findOne({ where: { method, path } });
    if (exact && !ID_ACTIONS.includes(exact.action)) {
      return { def: exact };
    }

    const lastSlash = path.lastIndexOf('/');
    if (lastSlash > 0) {
      const basePath = path.slice(0, lastSlash);
      const recordId = path.slice(lastSlash + 1);
      const withId = await this.repo.findOne({
        where: { method, path: basePath },
      });
      if (withId && ID_ACTIONS.includes(withId.action)) {
        return { def: withId, recordId };
      }
    }

    throw new NotFoundException('Custom endpoint not found');
  }

  private async validateAndNormalize(
    input: CustomEndpointInput,
    existingHash: string | null,
  ): Promise<NormalizedCustomEndpoint> {
    if (!input.name?.trim()) throw new BadRequestException('Name is required');
    if (!HTTP_METHODS.includes(input.method))
      throw new BadRequestException('Invalid method');
    if (!ACTIONS.includes(input.action))
      throw new BadRequestException('Invalid action');
    if (!input.collectionId)
      throw new BadRequestException('Collection is required');
    await this.collectionsService.findCollection(input.collectionId);

    const path = normalizePath(input.path);

    assertNoDuplicates(
      input.inputMapping ?? [],
      'requestField',
      'Duplicate request field mapping',
    );
    assertNoDuplicates(
      input.inputMapping ?? [],
      'recordField',
      'Duplicate record field in input mapping',
    );
    assertNoDuplicates(
      input.transformSteps ?? [],
      'field',
      'Duplicate transform step field',
    );
    assertNoDuplicates(
      input.responseMapping ?? [],
      'responseField',
      'Duplicate response field mapping',
    );

    for (const rule of input.inputMapping ?? []) {
      if (!rule.requestField?.trim() || !rule.recordField?.trim()) {
        throw new BadRequestException(
          'Input mapping rows must have both fields filled in',
        );
      }
    }
    for (const step of input.transformSteps ?? []) {
      if (!step.field?.trim() || !step.expression?.trim()) {
        throw new BadRequestException(
          'Transform steps must have both a field name and an expression',
        );
      }
      validateTransformExpression(step.expression);
    }
    for (const rule of input.responseMapping ?? []) {
      if (!rule.recordField?.trim() || !rule.responseField?.trim()) {
        throw new BadRequestException(
          'Response mapping rows must have both fields filled in',
        );
      }
    }

    const authType = input.authType ?? 'none';
    if (!AUTH_TYPES.includes(authType))
      throw new BadRequestException('Invalid auth type');

    let authUsername: string | null = null;
    let authSecretHash: string | null = null;
    if (authType === 'basic') {
      if (!input.authUsername?.trim()) {
        throw new BadRequestException('Username is required for Basic Auth');
      }
      authUsername = input.authUsername.trim();
      if (input.authPassword?.trim()) {
        authSecretHash = await bcrypt.hash(
          input.authPassword.trim(),
          SALT_ROUNDS,
        );
      } else if (existingHash) {
        authSecretHash = existingHash;
      } else {
        throw new BadRequestException('Password is required for Basic Auth');
      }
    } else if (authType === 'bearer') {
      if (input.authToken?.trim()) {
        authSecretHash = await bcrypt.hash(input.authToken.trim(), SALT_ROUNDS);
      } else if (existingHash) {
        authSecretHash = existingHash;
      } else {
        throw new BadRequestException('Token is required for Bearer Auth');
      }
    }

    return {
      name: input.name.trim(),
      method: input.method,
      path,
      action: input.action,
      collectionId: input.collectionId,
      inputMapping: input.inputMapping ?? [],
      transformSteps: input.transformSteps ?? [],
      responseMapping: input.responseMapping ?? [],
      authType,
      authUsername,
      authSecretHash,
    };
  }

  private async assertUnique(
    method: HttpMethod,
    path: string,
    excludeId?: string,
  ) {
    const existing = await this.repo.findOne({ where: { method, path } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        'An endpoint with this method and path already exists',
      );
    }
  }

  private translateUniqueViolation(error: unknown) {
    if (
      error instanceof QueryFailedError &&
      (error as unknown as { code?: string }).code === '23505'
    ) {
      return new ConflictException(
        'An endpoint with this method and path already exists',
      );
    }
    return error;
  }

  private omitSecret(entity: CustomEndpoint): CustomEndpoint {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructured only to exclude it from `rest`
    const { authSecretHash, ...rest } = entity;
    return rest as CustomEndpoint;
  }

  private async verifyAuth(
    defId: string,
    authType: CustomEndpointAuthType,
    authUsername: string | null,
    authHeader?: string,
  ) {
    if (authType === 'none') return;
    if (!authHeader)
      throw new UnauthorizedException('Authorization header required');

    const row = await this.repo.findOne({
      where: { id: defId },
      select: { id: true, authSecretHash: true },
    });
    const hash = row?.authSecretHash;
    if (!hash)
      throw new UnauthorizedException('Endpoint auth is misconfigured');

    if (authType === 'basic') {
      const match = /^Basic\s+(.+)$/i.exec(authHeader);
      if (!match)
        throw new UnauthorizedException('Invalid Authorization header');
      const decoded = Buffer.from(match[1], 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      const username = separator === -1 ? decoded : decoded.slice(0, separator);
      const password = separator === -1 ? '' : decoded.slice(separator + 1);
      if (
        username !== authUsername ||
        !(await bcrypt.compare(password, hash))
      ) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      const match = /^Bearer\s+(.+)$/i.exec(authHeader);
      if (!match || !(await bcrypt.compare(match[1], hash))) {
        throw new UnauthorizedException('Invalid token');
      }
    }
  }
}

function normalizePath(input: string): string {
  const segments = (input ?? '')
    .split('/')
    .map((segment) =>
      segment
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    )
    .filter(Boolean);
  if (segments.length === 0) throw new BadRequestException('Path is required');
  return segments.join('/');
}

function assertNoDuplicates<T>(rows: T[], key: keyof T, message: string) {
  const seen = new Set<string>();
  for (const row of rows) {
    const value = row[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    if (seen.has(value)) throw new BadRequestException(message);
    seen.add(value);
  }
}
