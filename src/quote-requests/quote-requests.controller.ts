import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { QuoteRequestsService } from './quote-requests.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { ResponseQuoteRequestDto } from './dto/response-quote-request.dto';

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
}
