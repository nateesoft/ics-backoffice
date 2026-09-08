import { IsString, IsNotEmpty, IsOptional, IsIn, IsBoolean } from 'class-validator';

const NAV_POSITIONS = ['left', 'right', 'top', 'bottom'];

export class CreateUisGenProjectDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() templateId: string;
  @IsIn(NAV_POSITIONS) navPosition: string;
  @IsString() @IsNotEmpty() themeColor: string;
}

export class UpdateUisGenProjectDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() templateId?: string;
  @IsIn(NAV_POSITIONS) @IsOptional() navPosition?: string;
  @IsString() @IsOptional() themeColor?: string;
  @IsBoolean() @IsOptional() sitemapGenerated?: boolean;
}
