import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  HttpCode,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { join } from 'path';
import { ExpensesService } from './expenses.service';
import { SaveExpenseDto, SaveExpenseCategoryDto } from './expenses.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private svc: ExpensesService) {}

  // ── Categories ──
  @Get('expense-categories')
  getCategories() {
    return this.svc.getCategories();
  }

  @Post('expense-categories')
  createCategory(@Body() dto: SaveExpenseCategoryDto) {
    return this.svc.createCategory(dto);
  }

  @Put('expense-categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveExpenseCategoryDto) {
    return this.svc.updateCategory(id, dto);
  }

  @Delete('expense-categories/:id')
  @HttpCode(204)
  removeCategory(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeCategory(id);
  }

  // ── Expenses ──
  @Get('expenses')
  getExpenses(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.svc.getExpenses(from, to, categoryId ? Number(categoryId) : undefined);
  }

  @Get('expenses/summary')
  getSummary(@Query('date') date?: string) {
    return this.svc.getSummary(date || new Date().toISOString().slice(0, 10));
  }

  @Get('expenses/:id')
  getExpense(@Param('id', ParseIntPipe) id: number) {
    return this.svc.getExpense(id);
  }

  @Post('expenses')
  createExpense(@Body() dto: SaveExpenseDto, @Req() req: any) {
    return this.svc.createExpense(dto, req.user.username);
  }

  @Put('expenses/:id')
  updateExpense(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveExpenseDto) {
    return this.svc.updateExpense(id, dto);
  }

  @Delete('expenses/:id')
  @HttpCode(204)
  removeExpense(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeExpense(id);
  }

  @Post('expenses/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.svc.saveAttachment(id, file);
  }

  @Delete('expenses/:expenseId/attachments/:id')
  @HttpCode(204)
  removeAttachment(@Param('id', ParseIntPipe) id: number) {
    return this.svc.removeAttachment(id);
  }

  @Get('expenses/:expenseId/attachments/:id/download')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const att = await this.svc.findAttachment(id);
    const filePath = join(process.cwd(), 'uploads', att.storedName);
    res.download(filePath, att.originalName);
  }
}
