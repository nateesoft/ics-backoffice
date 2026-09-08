import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CollectionsService } from './collections.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('file'))
  generate(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.collectionsService.generateFromJson(
      file.buffer,
      file.originalname,
    );
  }

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.collectionsService.findAllCollections(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findCollection(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.collectionsService.removeCollection(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.collectionsService.setPublished(id, true);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.collectionsService.setPublished(id, false);
  }

  @Get(':id/records')
  findRecords(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.collectionsService.findRecords(id, search, page, limit);
  }

  @Get(':id/records/:recordId')
  findRecord(@Param('id') id: string, @Param('recordId') recordId: string) {
    return this.collectionsService.findRecord(id, recordId);
  }

  @Post(':id/records')
  createRecord(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.collectionsService.createRecord(id, body);
  }

  @Patch(':id/records/:recordId')
  updateRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.collectionsService.updateRecord(id, recordId, body);
  }

  @Delete(':id/records/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteRecord(@Param('id') id: string, @Param('recordId') recordId: string) {
    return this.collectionsService.deleteRecord(id, recordId);
  }
}
