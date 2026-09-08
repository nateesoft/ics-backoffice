import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UisGenActorCredential } from '../entities/uis-gen-actor-credential.entity';
import { UisGenActorCredentialsController } from './uis-gen-actor-credentials.controller';
import { UisGenActorCredentialsService } from './uis-gen-actor-credentials.service';

@Module({
  imports: [TypeOrmModule.forFeature([UisGenActorCredential])],
  controllers: [UisGenActorCredentialsController],
  providers: [UisGenActorCredentialsService],
  exports: [UisGenActorCredentialsService],
})
export class UisGenActorCredentialsModule {}
