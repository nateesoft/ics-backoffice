import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, HttpCode } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectPlansService } from './project-plans.service';

class CreateProjectPlanDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsString() @IsOptional() color?: string;
}

class UpdateProjectPlanDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() description?: string;
  @IsDateString() @IsOptional() startDate?: string;
  @IsDateString() @IsOptional() endDate?: string;
  @IsString() @IsOptional() color?: string;
}

class CreatePhaseDto {
  @IsString() @IsNotEmpty() name: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsString() @IsOptional() color?: string;
}

class UpdatePhaseDto {
  @IsString() @IsOptional() name?: string;
  @IsDateString() @IsOptional() startDate?: string;
  @IsDateString() @IsOptional() endDate?: string;
  @IsString() @IsOptional() color?: string;
}

@Controller('project-plans')
@UseGuards(JwtAuthGuard)
export class ProjectPlansController {
  constructor(private service: ProjectPlansService) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Post()
  create(@Body() dto: CreateProjectPlanDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectPlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // Phase endpoints

  @Post(':id/phases')
  addPhase(@Param('id', ParseIntPipe) id: number, @Body() dto: CreatePhaseDto) {
    return this.service.addPhase(id, dto);
  }

  @Put(':id/phases/:phaseId')
  updatePhase(
    @Param('id', ParseIntPipe) _id: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() dto: UpdatePhaseDto,
  ) {
    return this.service.updatePhase(phaseId, dto);
  }

  @Delete(':id/phases/:phaseId')
  @HttpCode(204)
  removePhase(
    @Param('id', ParseIntPipe) _id: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return this.service.removePhase(phaseId);
  }
}
