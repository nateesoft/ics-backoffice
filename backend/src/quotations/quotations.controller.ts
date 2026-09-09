import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuotationsService } from './quotations.service';
import { SaveQuotationDto, SaveTemplateDto } from './quotations.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private svc: QuotationsService) {}

  // ── Templates ──
  @Get('quotation-templates')
  getTemplates() {
    return this.svc.getTemplates();
  }

  @Get('quotation-templates/:id')
  getTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getTemplate(id);
  }

  @Post('quotation-templates')
  createTemplate(@Body() dto: SaveTemplateDto) {
    return this.svc.createTemplate(dto);
  }

  @Put('quotation-templates/:id')
  updateTemplate(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveTemplateDto) {
    return this.svc.updateTemplate(id, dto);
  }

  @Patch('quotation-templates/:id/default')
  setDefault(@Param('id', ParseIntPipe) id: number) {
    return this.svc.setDefault(id);
  }

  @Delete('quotation-templates/:id')
  @HttpCode(204)
  removeTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeTemplate(id);
  }

  // ── Quotations ──
  @Get('quotations')
  getQuotations() {
    return this.svc.getQuotations();
  }

  @Get('quotations/:id')
  getQuotation(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getQuotation(id);
  }

  @Post('quotations')
  createQuotation(@Body() dto: SaveQuotationDto) {
    return this.svc.createQuotation(dto);
  }

  @Put('quotations/:id')
  updateQuotation(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveQuotationDto) {
    return this.svc.updateQuotation(id, dto);
  }

  @Delete('quotations/:id')
  @HttpCode(204)
  removeQuotation(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeQuotation(id);
  }
}
