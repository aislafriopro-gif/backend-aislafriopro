import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { ClientMeResponseDto } from './dto/client-me-response.dto';
import { RoleName } from '../roles/entities/roles.entity';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';
import { ClientProfileResponseDto } from './dto/client-me-response.dto';

interface RequestUser {
  userId: string;
}

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar clientes con paginación (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Listado paginado de clientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findAll(
    @Query() pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<ClientProfileResponseDto>> {
    return this.clientsService.findAll(pagination);
  }

  @Get('me')
  @Auth()
  @ApiOperation({
    summary: 'Obtener datos del cliente autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos propios del cliente autenticado',
    type: ClientMeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Perfil de cliente no encontrado' })
  async findMe(
    @CurrentUser() requestUser: RequestUser,
  ): Promise<ClientMeResponseDto> {
    return this.clientsService.findMe(requestUser.userId);
  }

  @Get(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Obtener detalle de un cliente (ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del cliente',
    type: ClientMeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ClientMeResponseDto> {
    return this.clientsService.findOne(id);
  }
}
