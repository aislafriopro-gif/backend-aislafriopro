import {
  Controller,
  Get,
  Delete,
  Patch,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';

@ApiTags('Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de un servicio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Servicio eliminado (soft delete)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.servicesService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un servicio soft-deleted (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Servicio restaurado', type: Service })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({ status: 409, description: 'El servicio no está eliminado' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Service> {
    return this.servicesService.restore(id);
  }

  @Get('deleted')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar todos los servicios (incluye soft-deleted) (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAllWithDeleted(
    @Query() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<Service>> {
    return this.servicesService.findAllWithDeleted(pagination);
  }
}
