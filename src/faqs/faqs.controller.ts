import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { PaginatedResponse } from '../common/pagination';
import { RoleName } from '../roles/entities/roles.entity';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FindFaqsQueryDto } from './dto/find-faqs-query.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';
import { FaqsService } from './faqs.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Crear una pregunta frecuente (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Pregunta frecuente creada',
    type: Faq,
  })
  async create(@Body() createFaqDto: CreateFaqDto): Promise<Faq> {
    return this.faqsService.create(createFaqDto);
  }

  @Get('all')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar todas las preguntas frecuentes (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Listado de preguntas frecuentes', type: Faq, isArray: true })
  async findAllAdmin(
    @Query() query: FindFaqsQueryDto,
  ): Promise<PaginatedResponse<Faq>> {
    return this.faqsService.findAllAdmin(query);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar preguntas frecuentes activas' })
  @ApiResponse({ status: 200, description: 'Listado de preguntas frecuentes activas', type: Faq, isArray: true })
  async findAll(
    @Query() query: FindFaqsQueryDto,
  ): Promise<PaginatedResponse<Faq>> {
    return this.faqsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una pregunta frecuente activa' })
  @ApiResponse({ status: 200, description: 'Pregunta frecuente encontrada', type: Faq })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Faq> {
    return this.faqsService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Editar una pregunta frecuente (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ): Promise<Faq> {
    return this.faqsService.update(id, updateFaqDto);
  }

  @Delete(':id')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una pregunta frecuente (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.faqsService.remove(id);
  }
}
