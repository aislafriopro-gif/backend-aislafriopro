import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PaginatedResponse } from '../common/pagination';
import { RoleName } from '../roles/entities/roles.entity';
import { QuoteRequestsService } from './quote-requests.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { FindQuoteRequestsQueryDto } from './dto/find-quote-requests-query.dto';
import { ResponseQuoteRequestDto } from './dto/response-quote-request.dto';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from './entities/quote-request.entity';

@ApiTags('Quote Requests')
@Controller('quote-requests')
export class QuoteRequestsController {
  constructor(private readonly quoteRequestsService: QuoteRequestsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva solicitud de cotización' })
  @ApiBody({ type: CreateQuoteRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Solicitud creada correctamente.',
    type: ResponseQuoteRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o serviceId no válido.',
  })
  async create(
    @Body() createQuoteRequestDto: CreateQuoteRequestDto,
  ): Promise<ResponseQuoteRequestDto> {
    const quoteRequest = await this.quoteRequestsService.create(
      createQuoteRequestDto,
    );

    return {
      id: quoteRequest.id,
      status: quoteRequest.status,
      createdAt: quoteRequest.createdAt,
      message: 'Solicitud de cotización creada correctamente.',
    };
  }

  @Get()
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary:
      'Listar cotizaciones (ADMIN)',
  })
  @ApiQuery({
    name: 'status',
    enum: QuoteRequestStatus,
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado paginado de solicitudes de cotización',
    type: QuoteRequest,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sin permisos' })
  async findAll(
    @Query() query: FindQuoteRequestsQueryDto,
  ): Promise<PaginatedResponse<QuoteRequest>> {
    return this.quoteRequestsService.findAll(query, { status: query.status });
  }
}
