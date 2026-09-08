import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('api/v1')
export class PublicApiController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get(':slug')
  async list(
    @Param('slug') slug: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    return this.collectionsService.findRecords(
      collection.id,
      search,
      page,
      limit,
    );
  }

  @Post(':slug')
  async create(
    @Param('slug') slug: string,
    @Body() body: Record<string, unknown>,
  ) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    return this.collectionsService.createRecord(collection.id, body);
  }

  @Get(':slug/:id')
  async findOne(@Param('slug') slug: string, @Param('id') id: string) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    return this.collectionsService.findRecord(collection.id, id);
  }

  @Put(':slug/:id')
  async replace(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    return this.collectionsService.replaceRecord(collection.id, id, body);
  }

  @Patch(':slug/:id')
  async update(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    return this.collectionsService.updateRecord(collection.id, id, body);
  }

  @Delete(':slug/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('slug') slug: string, @Param('id') id: string) {
    const collection = await this.collectionsService.findPublishedBySlug(slug);
    await this.collectionsService.deleteRecord(collection.id, id);
  }
}
