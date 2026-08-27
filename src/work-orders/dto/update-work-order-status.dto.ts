import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WorkOrderStatus } from '../entities/work-order.entity';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
    description: 'Nuevo estado de la orden de trabajo.',
  })
  @IsEnum(WorkOrderStatus, {
    message: 'El status debe ser uno de los valores válidos del estado.',
  })
  status!: WorkOrderStatus;
}
