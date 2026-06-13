import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DocumentFoldersService } from './document-folders.service';
import { CreateDocFolderDto, UpdateDocFolderDto } from './document-folders.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('document-folders')
@UseGuards(JwtAuthGuard)
export class DocumentFoldersController {
  constructor(private svc: DocumentFoldersService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: CreateDocFolderDto) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDocFolderDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
