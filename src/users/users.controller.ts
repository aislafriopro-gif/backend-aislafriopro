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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de un usuario (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado (soft delete)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.usersService.remove(id);
  }

  @Patch(':id/restore')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un usuario soft-deleted (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuario restaurado', type: User })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario no está eliminado' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<User> {
    return this.usersService.restore(id);
  }

  @Get('deleted')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar todos los usuarios (incluye soft-deleted) (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAllWithDeleted(
    @Query() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAllWithDeleted(pagination);
  }
}
