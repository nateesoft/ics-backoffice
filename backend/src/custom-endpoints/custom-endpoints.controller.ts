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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomEndpointsService } from './custom-endpoints.service';
import { CustomEndpointDto } from './dto/custom-endpoint.dto';

@Controller('custom-endpoints')
@UseGuards(JwtAuthGuard)
export class CustomEndpointsController {
  constructor(
    private readonly customEndpointsService: CustomEndpointsService,
  ) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.customEndpointsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customEndpointsService.findOne(id);
  }

  @Post()
  create(@Body() body: CustomEndpointDto) {
    return this.customEndpointsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: CustomEndpointDto) {
    return this.customEndpointsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.customEndpointsService.remove(id);
  }
}
