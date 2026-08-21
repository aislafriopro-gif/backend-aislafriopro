import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { ClientMeResponseDto } from './dto/client-me-response.dto';

interface RequestUser {
  userId: string;
}

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

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
}
