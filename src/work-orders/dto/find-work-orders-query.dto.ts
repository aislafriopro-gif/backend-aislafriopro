import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { WorkOrderStatus } from '../entities/work-order.entity';

export class FindWorkOrdersQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por el técnico asignado.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El technicianId debe ser un UUID válido.' })
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por el cliente asociado.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido.' })
  clientId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por la solicitud de cotización asociada.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El quoteRequestId debe ser un UUID válido.' })
  quoteRequestId?: string;

  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    description: 'Filtrar por el estado exacto de la orden.',
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus, {
    message: 'El status debe ser uno de los valores válidos del estado.',
  })
  status?: WorkOrderStatus;
}
