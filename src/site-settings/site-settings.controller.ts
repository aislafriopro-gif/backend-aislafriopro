import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { PaginatedResponse } from '../common/pagination';
import { RoleName } from '../roles/entities/roles.entity';
import { CreateSiteSettingDto } from './dto/create-site-setting.dto';
import { FindSiteSettingsQueryDto } from './dto/find-site-settings-query.dto';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSetting } from './entities/site-setting.entity';
import { SiteSettingsService } from './site-settings.service';
import { Public } from '../common/decorators/public.decorator';
import { PublicSiteSettingsResponseDto } from './dto/public-site-settings-response.dto';

@ApiTags('Site Settings')
@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Crear una configuracion del sitio (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Configuracion creada',
    type: SiteSetting,
  })
  async create(
    @Body() createSiteSettingDto: CreateSiteSettingDto,
  ): Promise<SiteSetting> {
    return this.siteSettingsService.create(createSiteSettingDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Listado de configuraciones del sitio', type: SiteSetting, isArray: true })
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Listar configuraciones del sitio (ADMIN)' })
  async findAll(
    @Query() query: FindSiteSettingsQueryDto,
  ): Promise<PaginatedResponse<SiteSetting>> {
    return this.siteSettingsService.findAll(query);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Obtener configuraciones publicas del sitio' })
  @ApiResponse({
    status: 200,
    description: 'Configuraciones publicas necesarias para el frontend',
    type: PublicSiteSettingsResponseDto,
  })
  async findPublicSettings(): Promise<PublicSiteSettingsResponseDto> {
    return this.siteSettingsService.findPublicSettings();
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Configuración encontrada', type: SiteSetting })
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Obtener una configuracion del sitio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<SiteSetting> {
    return this.siteSettingsService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Editar una configuracion del sitio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSiteSettingDto: UpdateSiteSettingDto,
  ): Promise<SiteSetting> {
    return this.siteSettingsService.update(id, updateSiteSettingDto);
  }

  @Delete(':id')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una configuracion del sitio (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.siteSettingsService.remove(id);
  }
}
