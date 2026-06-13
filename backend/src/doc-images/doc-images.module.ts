import { Module } from '@nestjs/common';
import { DocImagesController } from './doc-images.controller';

@Module({
  controllers: [DocImagesController],
})
export class DocImagesModule {}
