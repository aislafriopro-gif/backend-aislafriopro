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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkOrdersService } from './work-order.service';
import { Auth } from '../common/decorators/auth.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkOrder } from './entities/work-order.entity';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { PaginatedResponse, PaginationParamsDto } from '../common/pagination';
import { DiligenceDto } from './dto/diligence.dto';

@ApiTags('Work Orders')
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Auth(RoleName.TECHNICIAN)
  @Get('my')
  @ApiOperation({ summary: 'Mis OTs - Técnico autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Listado de OT asignadas al técnico',
    type: WorkOrder,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findMy(@CurrentUser('userId') userId: string) {
    return this.workOrdersService.findMyWorkOrders(userId);
  }

  @Post()
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear una orden de trabajo (ADMIN)' })
  @ApiBody({ type: CreateWorkOrderDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Orden creada correctamente.',
    type: WorkOrder,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Relación no encontrada.' })
  async create(
    @Body() createWorkOrderDto: CreateWorkOrderDto,
    @CurrentUser('userId') userId: string | undefined,
  ): Promise<WorkOrder> {
    return this.workOrdersService.create(createWorkOrderDto, userId);
  }

  @Get()
  @Auth(RoleName.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar órdenes de trabajo (ADMIN)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado paginado de órdenes de trabajo.',
    type: WorkOrder,
  })
  async findAll(
    @Query() query: PaginationParamsDto,
  ): Promise<PaginatedResponse<WorkOrder>> {
    return this.workOrdersService.findAll(query);
  }

  // Debe declararse después de GET /my para no interpretar "my" como UUID.
  @Get(':id')
  @Auth(RoleName.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Obtener una orden de trabajo (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Detalle de la orden.', type: WorkOrder })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orden no encontrada.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<WorkOrder> {
    return this.workOrdersService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar una orden de trabajo (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateWorkOrderDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Orden actualizada.', type: WorkOrder })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Datos inválidos.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Orden o técnico no encontrado.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto,
    @CurrentUser('userId') userId: string | undefined,
  ): Promise<WorkOrder> {
    return this.workOrdersService.update(id, updateWorkOrderDto, userId);
  @Auth(RoleName.TECHNICIAN)
  @Patch(':id/diligence')
  @ApiOperation({ summary: 'Diligenciar OT - Técnico asignado' })
  @ApiBody({ type: DiligenceDto })
  @ApiResponse({
    status: 200,
    description: 'OT diligenciada exitosamente',
    type: WorkOrder,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos o no es el técnico asignado',
  })
  @ApiResponse({ status: 404, description: 'OT no encontrada' })
  async diligence(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: DiligenceDto,
  ) {
    return this.workOrdersService.diligenceWorkOrder(id, userId, dto);
  }

  @Auth(RoleName.TECHNICIAN)
  @Post(':id/photos')
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiOperation({ summary: 'Subir fotos a la OT - Técnico asignado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Fotos subidas exitosamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          publicId: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o excede tamaño' })
  @ApiResponse({ status: 403, description: 'No es el técnico asignado' })
  @ApiResponse({ status: 404, description: 'OT no encontrada' })
  async uploadPhotos(
    @Param('id') workOrderId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Debe enviar al menos una foto.');
    }
    return this.workOrdersService.addPhotos(workOrderId, userId, files);
  }
}
