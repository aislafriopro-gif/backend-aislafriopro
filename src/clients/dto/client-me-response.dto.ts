import { ApiProperty } from '@nestjs/swagger';

export class ClientProfileResponseDto {
  @ApiProperty({ example: '7be6ef16-1a45-4b82-950c-3411fef49b28' })
  id!: string;

  @ApiProperty({ example: 'Cliente Prueba' })
  name!: string;

  @ApiProperty({ example: 'cliente@example.com' })
  email!: string;

  @ApiProperty({ example: '+54 9 11 1234-5678', nullable: true })
  phone!: string | null;
}

export class ClientQuoteRequestResponseDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-4890-bcde-f1234567890a' })
  id!: string;

  @ApiProperty({ example: 'Instalación de aislación térmica' })
  serviceName!: string;

  @ApiProperty({ example: 'Necesito cotizar aislación para una cámara.' })
  message!: string;

  @ApiProperty({ example: 'NEW' })
  status!: string;

  @ApiProperty({ example: '2026-08-20T13:46:06.791Z' })
  createdAt!: Date;
}

export class ClientMeResponseDto {
  @ApiProperty({ type: ClientProfileResponseDto })
  client!: ClientProfileResponseDto;

  @ApiProperty({ type: [ClientQuoteRequestResponseDto] })
  quoteRequests!: ClientQuoteRequestResponseDto[];

  // TODO: integrar WorkOrder en la respuesta cuando se defina el alcance de /clients/me.
  @ApiProperty({
    type: [Object],
    description:
      'Órdenes de trabajo del cliente. Actualmente retorna vacío hasta integrar WorkOrder en este endpoint.',
  })
  workOrders!: unknown[];
}
