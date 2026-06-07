import { Controller, Get, Post, Put, Patch, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  findAll() {
    return this.issuesService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.issuesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateIssueDto) {
    return this.issuesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.cancel(id);
  }
}
