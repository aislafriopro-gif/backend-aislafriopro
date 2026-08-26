import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkOrdersService } from './work-order.service';
import { Auth } from '../common/decorators/auth.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { WorkOrder } from './entities/work-order.entity';

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
}
