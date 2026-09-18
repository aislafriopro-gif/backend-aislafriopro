import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteRequest,
      Project,
      Product,
      WorkOrder,
      Client,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
