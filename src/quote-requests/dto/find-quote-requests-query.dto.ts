import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationParamsDto } from '../../common/pagination';
import { QuoteRequestStatus } from '../entities/quote-request.entity';

export class FindQuoteRequestsQueryDto extends PaginationParamsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la solicitud',
    enum: QuoteRequestStatus,
    example: QuoteRequestStatus.NEW,
  })
  @IsEnum(QuoteRequestStatus)
  @IsOptional()
  status?: QuoteRequestStatus;
}
