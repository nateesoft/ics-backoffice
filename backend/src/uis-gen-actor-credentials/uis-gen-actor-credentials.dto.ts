import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class UpsertActorCredentialDto {
  @IsString() @IsNotEmpty() username: string;
  // Optional on update: omitted/blank means "keep the existing password unchanged" — same UX
  // convention as CustomEndpoint's authSecretHash field in the APIs Gen builder.
  @IsString() @IsOptional() @MinLength(4) password?: string;
}
