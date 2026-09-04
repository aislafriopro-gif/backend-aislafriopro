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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import 'multer';
import { PaginatedResponse } from '../common/pagination';
import { RoleName } from '../roles/entities/roles.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { ProjectPublicResponseDto } from './dto/project-public-response.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectsService } from './projects.service';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Auth(RoleName.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverFile', maxCount: 1 },
      { name: 'beforeFile', maxCount: 1 },
      { name: 'afterFile', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Crear un proyecto con imágenes opcionales (coverFile, beforeFile, afterFile) (ADMIN)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string', nullable: true },
        completionDate: { type: 'string', format: 'date' },
        clientId: { type: 'string', format: 'uuid'},
        clientDisplayName: { type: 'string', nullable: true },
        serviceIds: {
          type: 'string',
          description:
            'JSON array serializado con los UUIDs de servicios. Ej: ["uuid1","uuid2"]',
          nullable: true,
        },
        coverFile: { type: 'string', format: 'binary', nullable: true, default: null },
        beforeFile: { type: 'string', format: 'binary', nullable: true, default: null },
        afterFile: { type: 'string', format: 'binary', nullable: true, default: null },
      },
      required: ['title', 'slug', 'description', 'clientId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Proyecto creado', type: Project })
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @UploadedFiles()
    files: {
      coverFile?: Express.Multer.File[];
      beforeFile?: Express.Multer.File[];
      afterFile?: Express.Multer.File[];
    },
    @CurrentUser('id') userId: string | undefined,
  ): Promise<Project> {
    return this.projectsService.create(createProjectDto, files, userId);
  }

  @Get('all')
  @Auth(RoleName.ADMIN)
  @ApiOperation({
    summary: 'Listar todos los proyectos incluyendo eliminados (ADMIN)',
  })
  @ApiResponse({ status: 200, description: 'Listado de todos los proyectos', type: ProjectPublicResponseDto, isArray: true })
  async findAllAdmin(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<ProjectPublicResponseDto>> {
    return this.projectsService.findAllAdmin(query);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar proyectos activos' })
  @ApiResponse({ status: 200, description: 'Listado de proyectos activos', type: ProjectPublicResponseDto, isArray: true })
  async findAll(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<ProjectPublicResponseDto>> {
    return this.projectsService.findAll(query);
  }

  @Public()
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto activo por slug' })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado', type: ProjectPublicResponseDto })
  @ApiParam({ name: 'slug', type: 'string' })
  async findOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ProjectPublicResponseDto> {
    return this.projectsService.findOneBySlug(slug);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto activo' })
  @ApiResponse({ status: 200, description: 'Proyecto encontrado', type: ProjectPublicResponseDto })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProjectPublicResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @Auth(RoleName.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverFile', maxCount: 1 },
      { name: 'beforeFile', maxCount: 1 },
      { name: 'afterFile', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Editar un proyecto, incluyendo imágenes opcionales (coverFile, beforeFile, afterFile) (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        location: { type: 'string', nullable: true },
        completionDate: { type: 'string', format: 'date', nullable: true },
        clientId: { type: 'string', format: 'uuid', nullable: true },
        clientDisplayName: { type: 'string', nullable: true },
        serviceIds: {
          type: 'string',
          description:
            'JSON array serializado con los UUIDs de servicios. Ej: ["uuid1","uuid2"]',
          nullable: true,
        },
        coverFile: { type: 'string', format: 'binary', nullable: true, default: null },
        beforeFile: { type: 'string', format: 'binary', nullable: true, default: null },
        afterFile: { type: 'string', format: 'binary', nullable: true, default: null },
      },
      required: [],
    },
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @UploadedFiles()
    files: {
      coverFile?: Express.Multer.File[];
      beforeFile?: Express.Multer.File[];
      afterFile?: Express.Multer.File[];
    },
    @CurrentUser('id') userId: string | undefined,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto, files, userId);
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
  ): Promise<ProjectPublicResponseDto> {
    await this.projectsService.restore(id);
    return this.projectsService.findOne(id);
  }
}
