import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UisGenSitemapService } from './uis-gen-sitemap.service';

@Controller('uis-gen-sitemap')
@UseGuards(JwtAuthGuard)
export class UisGenSitemapController {
  constructor(private svc: UisGenSitemapService) {}

  @Get(':projectId')
  get(@Param('projectId') projectId: string) {
    return this.svc.findByProjectId(projectId);
  }

  // Untyped body (not a class DTO) so the global `ValidationPipe({ whitelist: true })` doesn't try
  // to validate/strip it — same trade-off as collections' createRecord/updateRecord (see
  // collections.controller.ts): the graph is opaque, heterogeneous, arbitrarily nested JSON.
  @Put(':projectId')
  save(@Param('projectId') projectId: string, @Body() body: { nodes: unknown[]; edges: unknown[] }) {
    return this.svc.save(projectId, body);
  }
}
