import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class QuotationItemDto {
  @IsString() @IsOptional() description?: string;
  @IsNumber() @IsOptional() quantity?: number;
  @IsString() @IsOptional() unit?: string;
  @IsNumber() @IsOptional() unitPrice?: number;
  @IsNumber() @IsOptional() discount?: number;
}

export class SaveQuotationDto {
  @IsInt() @IsOptional() templateId?: number | null;
  @IsString() @IsOptional() quotationNo?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsString() @IsOptional() customerAddress?: string;
  @IsString() @IsOptional() customerPhone?: string;
  @IsString() @IsOptional() customerEmail?: string;
  @IsString() @IsOptional() customerTaxId?: string;
  @IsString() @IsOptional() attention?: string;
  @IsString() @IsOptional() projectName?: string;
  @IsString() @IsOptional() issueDate?: string;
  @IsString() @IsOptional() validUntil?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items?: QuotationItemDto[];

  @IsNumber() @IsOptional() discount?: number;
  @IsNumber() @IsOptional() vatRate?: number;
  @IsNumber() @IsOptional() withholdingRate?: number;
  @IsString() @IsOptional() note?: string;
  @IsString() @IsOptional() terms?: string;
  @IsString() @IsOptional() status?: string;
}

// layout เป็น object อิสระ — รับทั้งก้อน ไม่ validate ราย field เพื่อความยืดหยุ่นของ template designer
export class SaveTemplateDto {
  @IsString() @IsOptional() name?: string;
  @IsBoolean() @IsOptional() isDefault?: boolean;
  @IsOptional() layout?: Record<string, unknown>;
}
