import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateWorkOrderDto {
  @ApiProperty({
    description: 'ID del cliente asociado a la orden de trabajo.',
    example: '7be6ef16-1a45-4b82-950c-3411fef49b28',
  })
  @IsNotEmpty({ message: 'El clientId es obligatorio.' })
  @IsUUID('4', { message: 'El clientId debe ser un UUID válido.' })
  clientId!: string;

  @ApiPropertyOptional({
    description: 'ID del técnico asignado a la orden de trabajo.',
    example: '9f0f5efb-cb65-4d7c-a5d2-9d7caed4d253',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El technicianId debe ser un UUID válido.' })
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'ID de la solicitud de cotización asociada.',
    example: 'd2c5cf01-4cb6-42f8-8d8f-3c1f7d6eb365',
  })
  @IsOptional()
  @IsUUID('4', { message: 'El quoteRequestId debe ser un UUID válido.' })
  quoteRequestId?: string;
}
