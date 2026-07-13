import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsModule } from '../collections/collections.module';
import { CustomEndpoint } from './entities/custom-endpoint.entity';
import { CustomEndpointsController } from './custom-endpoints.controller';
import { CustomEndpointsExecutorController } from './custom-endpoints-executor.controller';
import { CustomEndpointsService } from './custom-endpoints.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomEndpoint]), CollectionsModule],
  controllers: [CustomEndpointsController, CustomEndpointsExecutorController],
  providers: [CustomEndpointsService],
  exports: [CustomEndpointsService],
})
export class CustomEndpointsModule {}
