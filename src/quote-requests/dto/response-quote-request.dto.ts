import { ApiProperty } from '@nestjs/swagger';
import { QuoteRequestStatus } from '../entities/quote-request.entity';

export class ResponseQuoteRequestDto {
  @ApiProperty({
    description: 'ID de la solicitud de cotización creada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id!: string;

  @ApiProperty({
    description: 'Estado actual de la solicitud',
    example: QuoteRequestStatus.NEW,
    enum: QuoteRequestStatus,
  })
  status!: QuoteRequestStatus;

  @ApiProperty({
    description: 'Fecha de creación de la solicitud',
    example: '2026-08-11T12:34:56.789Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Mensaje de confirmación de la creación de la solicitud',
    example: 'Solicitud de cotización creada correctamente.',
  })
  message!: string;
}
