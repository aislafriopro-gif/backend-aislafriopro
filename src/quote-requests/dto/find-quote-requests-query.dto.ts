import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { QuoteRequestStatus } from '../entities/quote-request.entity';

export class FindQuoteRequestsQueryDto extends PaginationParamsDto {
  @ApiProperty({
    description: 'Filtrar por estado de la solicitud',
    enum: QuoteRequestStatus,
    required: false,
  })
  @IsEnum(QuoteRequestStatus)
  @IsOptional()
  status?: QuoteRequestStatus;
}
