import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardStatsResponseDto } from './dto/dashboard-stats-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../roles/entities/roles.entity';

interface RequestUser {
  userId: string;
  email: string;
  role: RoleName;
}

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Auth()
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del dashboard',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getStats(
    @CurrentUser() requestUser: RequestUser,
  ): Promise<DashboardStatsResponseDto> {
    return this.dashboardService.getStats(requestUser);
  }
}
