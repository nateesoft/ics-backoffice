import { Controller, Get, Post, Put, Patch, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto } from './issues.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private issuesService: IssuesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.issuesService.findAll(req.user.username);
  }

  @Get('stats')
  getStats() {
    return this.issuesService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findOne(id);
  }

  @Get(':id/history')
  findHistory(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.findHistory(id);
  }

  @Post()
  create(@Body() dto: CreateIssueDto, @Request() req: any) {
    return this.issuesService.create(dto, req.user.username);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto, @Request() req: any) {
    return this.issuesService.update(id, dto, req.user.username);
  }

  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.issuesService.cancel(id, req.user.username);
  }

  @Patch(':id/restore')
  restore(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.issuesService.restore(id, req.user.username);
  }
}
