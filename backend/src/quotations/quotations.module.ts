import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotationTemplate } from '../entities/quotation-template.entity';
import { Quotation } from '../entities/quotation.entity';
import { QuotationCustomer } from '../entities/quotation-customer.entity';
import { QuotationProduct } from '../entities/quotation-product.entity';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuotationTemplate, Quotation, QuotationCustomer, QuotationProduct])],
  controllers: [QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
