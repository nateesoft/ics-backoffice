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
  ValidatePasswordMode,
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
  'findBy',
  'validate',
];
const AUTH_TYPES: CustomEndpointAuthType[] = ['none', 'basic', 'bearer'];
const VALIDATE_PASSWORD_MODES: ValidatePasswordMode[] = ['bcrypt', 'plain'];
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

  @IsOptional()
  @IsIn(VALIDATE_PASSWORD_MODES)
  validatePasswordMode?: ValidatePasswordMode;

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
