import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { QuoteRequestStatus } from '../entities/quote-request.entity';

export class UpdateQuoteRequestStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la solicitud de cotización',
    enum: QuoteRequestStatus,
    example: QuoteRequestStatus.IN_PROGRESS,
  })
  @IsEnum(QuoteRequestStatus, {
    message: 'El estado debe ser uno de los valores permitidos.',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio.' })
  status!: QuoteRequestStatus;
}
