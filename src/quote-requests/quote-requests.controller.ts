import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
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
import { CreateQuoteRequestNoteContentDto } from './dto/create-quote-request-note-content.dto';
import { FindQuoteRequestsQueryDto } from './dto/find-quote-requests-query.dto';
import { QuoteRequestNoteResponseDto } from './dto/quote-request-note-response.dto';
import { ResponseQuoteRequestDto } from './dto/response-quote-request.dto';
import { UpdateQuoteRequestStatusDto } from './dto/update-quote-request-status.dto';
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
    summary: 'Listar cotizaciones (ADMIN)',
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

  @Get(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Obtener detalle de una solicitud de cotización (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Detalle completo de la solicitud de cotización incluyendo notas',
    type: QuoteRequest,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sin permisos' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Solicitud de cotización no encontrada',
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.findOne(id);
  }

  @Post(':id/notes')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar una nota interna a una solicitud de cotización (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: CreateQuoteRequestNoteContentDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Nota creada correctamente',
    type: QuoteRequestNoteResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sin permisos' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Solicitud de cotización no encontrada',
  })
  async addNote(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createQuoteRequestNoteContentDto: CreateQuoteRequestNoteContentDto,
  ): Promise<QuoteRequestNoteResponseDto> {
    const note = await this.quoteRequestsService.addNote(
      id,
      createQuoteRequestNoteContentDto.content,
    );

    return {
      id: note.id,
      content: note.note,
      createdAt: note.createdAt,
      message: 'Nota creada',
    };
  }

  @Patch(':id/status')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Actualizar el estado de una solicitud de cotización (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateQuoteRequestStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cotización actualizada',
    type: QuoteRequest,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No autenticado',
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Sin permisos' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Solicitud de cotización no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Estado no válido',
  })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateQuoteRequestStatusDto: UpdateQuoteRequestStatusDto,
  ): Promise<QuoteRequest> {
    return this.quoteRequestsService.updateStatus(
      id,
      updateQuoteRequestStatusDto.status,
    );
  }
}
