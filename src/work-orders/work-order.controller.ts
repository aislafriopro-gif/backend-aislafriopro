import {
  Controller,
  Get,
  UseGuards,
  Patch,
  Param,
  Body,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkOrdersService } from './work-order.service';
import { Auth } from '../common/decorators/auth.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkOrder } from './entities/work-order.entity';
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
