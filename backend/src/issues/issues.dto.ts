import { IsString, IsOptional, IsEnum, IsInt, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { CodeType, Priority, WorkPeriodUnit, TaskStatus, DeploymentStatus } from '../entities/issue.entity';

export class CreateIssueDto {
  @IsString() projectName: string;
  @IsEnum(CodeType) codeType: CodeType;
  @IsOptional() @IsString() detail?: string;
  @IsOptional() @IsString() githubLink?: string;
  @IsDateString() issueCreateDate: string;
  @IsEnum(Priority) priority: Priority;
  @IsOptional() @IsInt() taskWorkPeriod?: number;
  @IsOptional() @IsEnum(WorkPeriodUnit) taskWorkPeriodUnit?: WorkPeriodUnit;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() developer?: string;
  @IsOptional() @IsString() tester?: string;
  @IsOptional() @IsEnum(TaskStatus) taskStatus?: TaskStatus;
  @IsOptional() @IsEnum(DeploymentStatus) deploymentStatus?: DeploymentStatus;
  @IsOptional() @IsString() anydesk?: string;
  @IsOptional() @IsString() teamViewer?: string;
  @IsOptional() @IsString() contractDetail?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
}

export class UpdateIssueDto extends CreateIssueDto {
  @IsOptional() @IsBoolean() isCancelled?: boolean;
}
