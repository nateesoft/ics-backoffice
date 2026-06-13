import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentFolder } from '../entities/document-folder.entity';
import { DocumentFoldersController } from './document-folders.controller';
import { DocumentFoldersService } from './document-folders.service';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentFolder])],
  controllers: [DocumentFoldersController],
  providers: [DocumentFoldersService],
})
export class DocumentFoldersModule {}
