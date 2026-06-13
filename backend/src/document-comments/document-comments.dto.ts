import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateDocumentCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsInt()
  parentId?: number;
}

export class UpdateDocumentCommentDto {
  @IsString()
  content: string;
}

export class ToggleDocReactionDto {
  @IsString()
  emoji: string;
}
