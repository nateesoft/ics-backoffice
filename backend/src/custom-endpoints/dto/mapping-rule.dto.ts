import { IsBoolean, IsString } from 'class-validator';

export class InputMappingRuleDto {
  @IsString()
  requestField: string;

  @IsString()
  recordField: string;

  @IsBoolean()
  required: boolean;
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
