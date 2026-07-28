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
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { PaginatedResponse } from '../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

interface RequestUser {
  userId: string;
  email: string;
  role: RoleName;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Crear un usuario (ADMIN)' })
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
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAll(
    @Query() query: FindUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.findAll(query, {
      role: query.role,
      isActive: query.isActive,
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
  ): Promise<User> {
    return this.usersService.update(id, dto, requestUser);
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
}
