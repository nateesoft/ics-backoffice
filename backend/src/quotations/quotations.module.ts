import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationTemplate } from '../entities/quotation-template.entity';
import { Quotation } from '../entities/quotation.entity';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuotationTemplate, Quotation])],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
