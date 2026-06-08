import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

const CATEGORIES = ['Database', 'API Endpoint', 'Service', 'Infrastructure', 'Security', 'Other'];

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsIn(CATEGORIES)
  category: string;

  @IsString()
  @IsOptional()
  content?: string;
}

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsIn(CATEGORIES)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
