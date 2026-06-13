import { IsString, IsNotEmpty, IsOptional, IsIn, IsInt, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

const CATEGORIES = ['Database', 'API Endpoint', 'Service', 'Infrastructure', 'Security', 'Other'];
const DOC_TYPES = ['general', 'sequence', 'flowchart', 'mindmap', 'erdiagram'];

export class CreateDocumentDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsIn(CATEGORIES) category: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() @IsIn(DOC_TYPES) docType?: string;
  @ValidateIf(o => o.folderId !== null)
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  folderId?: number | null;
}

export class UpdateDocumentDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsIn(CATEGORIES) @IsOptional() category?: string;
  @IsString() @IsOptional() content?: string;
  @IsString() @IsOptional() @IsIn(DOC_TYPES) docType?: string;
  @ValidateIf(o => o.folderId !== null)
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  folderId?: number | null;
}
