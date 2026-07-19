import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeployService } from './deploy.service';

// Route shapes don't actually collide despite sharing the top-level resource name: Nest/Express
// match on HTTP method + segment count + literal segments, not param names — `GET /:projectId`
// (1 segment) and `GET /:id/status` (2 segments) are unambiguous, same for the two 2-segment POSTs
// (`/:projectId/deploy` vs `/:id/stop`, distinguished by the literal final segment).
@Controller('uis-gen-deployments')
@UseGuards(JwtAuthGuard)
export class DeployController {
  constructor(private deployService: DeployService) {}

  @Post(':projectId/deploy')
  deploy(@Param('projectId') projectId: string) {
    return this.deployService.start(projectId);
  }

  @Get(':projectId')
  listForProject(@Param('projectId') projectId: string) {
    return this.deployService.listForProject(projectId);
  }

  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.deployService.getById(id);
  }

  @Get(':id/logs')
  async logs(@Param('id') id: string, @Query('tail') tail?: string) {
    const deployment = await this.deployService.getById(id);
    return { lines: this.deployService.readLogs(deployment, tail ? Number(tail) : 200) };
  }

  @Post(':id/stop')
  stop(@Param('id') id: string) {
    return this.deployService.stop(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deployService.remove(id);
  }
}
