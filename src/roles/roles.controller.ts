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
import { RoleName, Role } from './entities/roles.entity';
import { RolesService } from './roles.service';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de un rol (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Rol eliminado (soft delete)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.rolesService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un rol soft-deleted (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Rol restaurado', type: Role })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'El rol no está eliminado' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Role> {
    return this.rolesService.restore(id);
  }

  @Get('deleted')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar todos los roles (incluye soft-deleted) (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAllWithDeleted(
    @Query() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<Role>> {
    return this.rolesService.findAllWithDeleted(pagination);
  }
}
