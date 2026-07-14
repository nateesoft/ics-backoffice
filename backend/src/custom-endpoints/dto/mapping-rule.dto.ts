import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class InputMappingRuleDto {
  @IsString()
  requestField: string;

  @IsString()
  recordField: string;

  @IsBoolean()
  required: boolean;

  @IsOptional()
  @IsBoolean()
  isPasswordField?: boolean;
}

export class ResponseMappingRuleDto {
  @IsString()
  recordField: string;

  @IsString()
  responseField: string;
}

export class TransformStepDto {
  @IsString()
  field: string;

  @IsString()
  expression: string;
}
