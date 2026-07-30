import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { UserStatus } from './entities/user.entity';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PaginatedResponse } from '../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: RoleName;
}

function extractRequestContext(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string) ?? req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Crear un usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado', type: User })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({
    status: 409,
    description: 'Email o rol ya existen / duplicados',
  })
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar usuarios con paginación y filtros' })
  @ApiQuery({ name: 'role', enum: RoleName, required: false })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAll(
    @Query() query: FindUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll(query, {
      role: query.role,
      isActive: query.isActive,
      status: query.status,
      search: query.search,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario', type: User })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findMe(@CurrentUser() requestUser: RequestUser): Promise<User> {
    return this.usersService.findMe(requestUser.userId);
  }

  @Get('deleted')
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los usuarios (incluye soft-deleted) (ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAllWithDeleted(
    @Query() query: FindUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAllWithDeleted(query);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por ID (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar datos de un usuario (propio usuario o ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: User })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya en uso' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() requestUser: RequestUser,
    @Req() req: Request,
  ): Promise<User> {
    return this.usersService.update(
      id,
      dto,
      requestUser,
      extractRequestContext(req),
    );
  }

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
  async restore(@Param('id', new ParseUUIDPipe()) id: string): Promise<User> {
    return this.usersService.restore(id);
  }

  @Patch(':id/role')
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Asignar un rol a un usuario (ADMIN)',
    description:
      'Solo administradores pueden asignar roles. Un admin no puede reasignarse su propio rol. No se puede dejar el sistema sin al menos un admin activo. Si se degrada a un admin, se revocan todas sus sesiones activas.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Usuario con rol actualizado',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No es admin o intenta reasignarse su propio rol',
  })
  @ApiResponse({ status: 404, description: 'Usuario o rol no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El usuario es el último admin activo del sistema',
  })
  async assignRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() requestUser: RequestUser,
    @Req() req: Request,
  ): Promise<User> {
    return this.usersService.assignRole(
      id,
      dto.roleId,
      requestUser,
      extractRequestContext(req),
    );
  }

  @Patch(':id/status')
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Cambiar el estado de un usuario (ADMIN)',
    description:
      'Solo administradores pueden cambiar el estado de otros usuarios. Un admin no puede cambiar su propio estado. No se puede desactivar al último admin activo del sistema. Si se desactiva o suspende a un admin, se revocan todas sus sesiones activas.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado',
    type: User,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'No es admin o intenta cambiar su propio estado',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({
    status: 409,
    description:
      'El usuario ya tiene ese estado / Es el último admin activo del sistema',
  })
  async changeStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() requestUser: RequestUser,
    @Req() req: Request,
  ): Promise<User> {
    return this.usersService.changeStatus(
      id,
      dto.status,
      requestUser,
      extractRequestContext(req),
    );
  }
}
