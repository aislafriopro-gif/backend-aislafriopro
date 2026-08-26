import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrdersController } from './work-order.controller';
import { WorkOrdersService } from './work-order.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
