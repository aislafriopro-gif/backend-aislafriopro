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
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { RoleName } from '../roles/entities/roles.entity';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { PaginatedResponse } from '../common/pagination';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo servicio (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Servicio creado',
    type: Service,
  })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Get('all')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los servicios incluyendo eliminados (ADMIN)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de todos los servicios',
    type: Service,
  })
  async findAllAdmin(
    @Query() query: FindServicesQueryDto,
  ): Promise<PaginatedResponse<Service>> {
    return this.servicesService.findAllAdmin(query);
  }

  @Get()
  @ApiOperation({ summary: 'Listar servicios activos' })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de servicios activos',
    type: ServiceResponseDto,
  })
  async findAll(
    @Query() query: FindServicesQueryDto,
  ): Promise<PaginatedResponse<ServiceResponseDto>> {
    const response = await this.servicesService.findAll(query);
    return {
      ...response,
      data: response.data.map((service) =>
        plainToInstance(ServiceResponseDto, service),
      ),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un servicio activo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del servicio',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.findOne(id);
    return plainToInstance(ServiceResponseDto, service);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Editar un servicio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Servicio actualizado',
    type: Service,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de un servicio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Servicio eliminado (soft delete)' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.servicesService.remove(id);
  }

  @Patch(':id/restore')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un servicio soft-deleted (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Servicio restaurado',
    type: Service,
  })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  @ApiResponse({ status: 409, description: 'El servicio no está eliminado' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Service> {
    return this.servicesService.restore(id);
  }
}
