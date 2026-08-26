import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Client } from '../clients/entities/client.entity';
import { QuoteRequest } from '../quote-requests/entities/quote-request.entity';
import { User } from '../users/entities/user.entity';
import { WorkOrdersController } from './work-order.controller';
import { WorkOrdersService } from './work-order.service';
import { WorkOrder } from './entities/work-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder, Client, User, QuoteRequest]),
    AuditModule,
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
