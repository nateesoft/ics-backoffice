import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateDocFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateDocFolderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
