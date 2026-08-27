import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkOrderStatus } from '../entities/work-order.entity';
import { MaterialDto } from './diligence.dto';

export class UpdateWorkOrderDto {
  @ApiPropertyOptional({
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
    description: 'Estado actual de la orden de trabajo.',
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus, {
    message: 'El status debe ser uno de los valores válidos del estado.',
  })
  status?: WorkOrderStatus;

  @ApiPropertyOptional({
    description: 'Detalle del trabajo realizado.',
    example: 'Se realizó la instalación del material en el sitio.',
  })
  @IsOptional()
  @IsString()
  workDone?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales de la orden de trabajo.',
    example: 'Se requiere volver el próximo lunes para revisión final.',
  })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({
    description: 'Materiales utilizados en la orden de trabajo.',
    type: () => [MaterialDto],
    example: [
      {
        name: 'Aislante térmico',
        quantity: '12',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDto)
  materials?: MaterialDto[];

  @ApiPropertyOptional({
    description: 'ID del técnico asignado a la orden de trabajo.',
    example: '9f0f5efb-cb65-4d7c-a5d2-9d7caed4d253',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El technicianId debe ser un UUID válido.' })
  technicianId?: string;
}

