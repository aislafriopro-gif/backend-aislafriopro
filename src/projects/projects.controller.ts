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
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { SetProjectImageDto } from './dto/set-project-image.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectImageType } from './media/entities/project-image.entity';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Crear un proyecto (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Proyecto creado', type: Project })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Get('all')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los proyectos incluyendo eliminados (ADMIN)',
  })
  async findAllAdmin(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    return this.projectsService.findAllAdmin(query);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proyectos activos' })
  async findAll(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    return this.projectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto activo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Editar un proyecto (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Patch(':id/cover-image')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary:
      'Subir imagen de portada (queda primera en la galería de portadas) (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async setCoverImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() setProjectImageDto: SetProjectImageDto,
  ): Promise<Project> {
    return this.projectsService.setProjectImage(
      id,
      setProjectImageDto.mediaId,
      ProjectImageType.COVER,
    );
  }

  @Patch(':id/before-image')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary:
      'Subir imagen "antes" (queda primera en la galería de antes) (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async setBeforeImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() setProjectImageDto: SetProjectImageDto,
  ): Promise<Project> {
    return this.projectsService.setProjectImage(
      id,
      setProjectImageDto.mediaId,
      ProjectImageType.BEFORE,
    );
  }

  @Patch(':id/after-image')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary:
      'Subir imagen "después" (queda primera en la galería de después) (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async setAfterImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() setProjectImageDto: SetProjectImageDto,
  ): Promise<Project> {
    return this.projectsService.setProjectImage(
      id,
      setProjectImageDto.mediaId,
      ProjectImageType.AFTER,
    );
  }

  @Delete(':id')
  @Auth(RoleName.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar (soft delete) un proyecto (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.projectsService.remove(id);
  }

  @Post(':id/restore')
  @Auth(RoleName.ADMIN)
  @ApiOperation({ summary: 'Restaurar un proyecto eliminado (ADMIN)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async restore(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Project> {
    return this.projectsService.restore(id);
  }
}
