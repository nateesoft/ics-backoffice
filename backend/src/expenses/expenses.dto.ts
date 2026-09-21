import { IsString, IsOptional, IsInt, IsNumber, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class SaveExpenseCategoryDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() color?: string;
}

export class SaveExpenseDto {
  @IsString() @IsOptional() date?: string;

  @ValidateIf((o) => o.categoryId !== null)
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  categoryId?: number | null;

  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() description?: string;

  @ValidateIf((o) => o.locationLat !== null)
  @IsNumber()
  @IsOptional()
  locationLat?: number | null;

  @ValidateIf((o) => o.locationLng !== null)
  @IsNumber()
  @IsOptional()
  locationLng?: number | null;

  @IsOptional() locationLabel?: string | null;
}
