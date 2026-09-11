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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QuotationsService } from './quotations.service';
import { SaveCustomerDto, SaveProductDto, SaveQuotationDto, SaveTemplateDto } from './quotations.dto';

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

  // ── Customers (master data) ──
  @Get('quotation-customers')
  getCustomers(@Query('q') q?: string) {
    return this.svc.getCustomers(q);
  }

  @Get('quotation-customers/:id')
  getCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getCustomer(id);
  }

  @Post('quotation-customers')
  createCustomer(@Body() dto: SaveCustomerDto) {
    return this.svc.createCustomer(dto);
  }

  @Put('quotation-customers/:id')
  updateCustomer(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveCustomerDto) {
    return this.svc.updateCustomer(id, dto);
  }

  @Delete('quotation-customers/:id')
  @HttpCode(204)
  removeCustomer(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeCustomer(id);
  }

  // ── Products / Services (master data) ──
  @Get('quotation-products')
  getProducts(@Query('q') q?: string) {
    return this.svc.getProducts(q);
  }

  @Get('quotation-products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getProduct(id);
  }

  @Post('quotation-products')
  createProduct(@Body() dto: SaveProductDto) {
    return this.svc.createProduct(dto);
  }

  @Put('quotation-products/:id')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveProductDto) {
    return this.svc.updateProduct(id, dto);
  }

  @Delete('quotation-products/:id')
  @HttpCode(204)
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeProduct(id);
  }
}
