import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrdersController } from './work-order.controller';
import { WorkOrdersService } from './work-order.service';
import { CloudinaryService } from '../media/cloudinary.service';
import { WorkOrderImage } from './media/entities/work-order-image.entity';
import { Media } from 'src/media/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder, WorkOrderImage, Media])],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService, CloudinaryService],
})
export class WorkOrdersModule {}
