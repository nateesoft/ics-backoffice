import { Controller, Get, Post, Put, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { IsArray, IsNumber } from 'class-validator';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class ReorderDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private svc: NotesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Post()
  create(@Body() dto: CreateNoteDto, @Req() req: any) {
    return this.svc.create(dto, req.user.username);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoteDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderDto) {
    return this.svc.reorder(dto.ids);
  }
}
