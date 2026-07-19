import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UisGenActorCredentialsService } from './uis-gen-actor-credentials.service';
import { UpsertActorCredentialDto } from './uis-gen-actor-credentials.dto';

@Controller('uis-gen-actor-credentials')
@UseGuards(JwtAuthGuard)
export class UisGenActorCredentialsController {
  constructor(private svc: UisGenActorCredentialsService) {}

  @Get(':projectId')
  list(@Param('projectId') projectId: string) {
    return this.svc.listForProject(projectId);
  }

  @Put(':projectId/:actorNodeId')
  upsert(
    @Param('projectId') projectId: string,
    @Param('actorNodeId') actorNodeId: string,
    @Body() dto: UpsertActorCredentialDto,
  ) {
    return this.svc.upsert(projectId, actorNodeId, dto.username, dto.password);
  }

  @Delete(':projectId/:actorNodeId')
  remove(@Param('projectId') projectId: string, @Param('actorNodeId') actorNodeId: string) {
    return this.svc.remove(projectId, actorNodeId);
  }
}
