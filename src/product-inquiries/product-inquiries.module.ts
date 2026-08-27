import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductInquiry } from './entities/product-inquiry.entity';
import { ProductInquiriesController } from './product-inquiries.controller';
import { ProductInquiriesService } from './product-inquiries.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductInquiry, Product])],
  controllers: [ProductInquiriesController],
  providers: [ProductInquiriesService],
})
export class ProductInquiriesModule {}
