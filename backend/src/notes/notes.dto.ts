import { IsString, IsOptional } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  color?: string;
}

export class ToggleReactionDto {
  @IsString()
  emoji: string;
}

export class CreateReplyDto {
  @IsString()
  content: string;
}
