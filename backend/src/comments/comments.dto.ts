import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @IsOptional()
  parentId?: number;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;
}
