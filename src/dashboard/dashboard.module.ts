import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Project } from '../projects/entities/project.entity';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteRequest, Project, Product])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
