import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import type {
  CustomEndpointAction,
  CustomEndpointAuthType,
  HttpMethod,
} from '../entities/custom-endpoint.entity';
import {
  InputMappingRuleDto,
  ResponseMappingRuleDto,
  TransformStepDto,
} from './mapping-rule.dto';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const ACTIONS: CustomEndpointAction[] = [
  'list',
  'get',
  'create',
  'update',
  'delete',
];
const AUTH_TYPES: CustomEndpointAuthType[] = ['none', 'basic', 'bearer'];
const MAX_MAPPING_ROWS = 50;

export class CustomEndpointDto {
  @IsString()
  name: string;

  @IsIn(HTTP_METHODS)
  method: HttpMethod;

  @IsString()
  path: string;

  @IsIn(ACTIONS)
  action: CustomEndpointAction;

  @IsUUID()
  collectionId: string;

  @IsArray()
  @ArrayMaxSize(MAX_MAPPING_ROWS)
  @ValidateNested({ each: true })
  @Type(() => InputMappingRuleDto)
  inputMapping: InputMappingRuleDto[];

  @IsArray()
  @ArrayMaxSize(MAX_MAPPING_ROWS)
  @ValidateNested({ each: true })
  @Type(() => TransformStepDto)
  transformSteps: TransformStepDto[];

  @IsArray()
  @ArrayMaxSize(MAX_MAPPING_ROWS)
  @ValidateNested({ each: true })
  @Type(() => ResponseMappingRuleDto)
  responseMapping: ResponseMappingRuleDto[];

  @IsIn(AUTH_TYPES)
  authType: CustomEndpointAuthType;

  @IsOptional()
  @IsString()
  authUsername?: string | null;

  @IsOptional()
  @IsString()
  authPassword?: string;

  @IsOptional()
  @IsString()
  authToken?: string;
}
