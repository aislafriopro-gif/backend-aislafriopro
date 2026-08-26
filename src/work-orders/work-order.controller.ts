import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';
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
}
