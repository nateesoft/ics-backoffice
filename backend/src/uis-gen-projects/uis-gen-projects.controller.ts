import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UisGenProjectsService } from './uis-gen-projects.service';
import { CreateUisGenProjectDto, UpdateUisGenProjectDto } from './uis-gen-projects.dto';

@Controller('uis-gen-projects')
@UseGuards(JwtAuthGuard)
export class UisGenProjectsController {
  constructor(private svc: UisGenProjectsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUisGenProjectDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUisGenProjectDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
