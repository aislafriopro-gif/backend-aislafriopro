import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseEnumPipe,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
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
  async findAllAdmin(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<ProjectPublicResponseDto>> {
    return this.projectsService.findAllAdmin(query);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proyectos activos' })
  async findAll(
    @Query() query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<ProjectPublicResponseDto>> {
    return this.projectsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto activo por slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  async findOneBySlug(
    @Param('slug') slug: string,
  ): Promise<ProjectPublicResponseDto> {
    return this.projectsService.findOneBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un proyecto activo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProjectPublicResponseDto> {
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
  ): Promise<ProjectPublicResponseDto> {
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
  ): Promise<ProjectPublicResponseDto> {
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
  ): Promise<ProjectPublicResponseDto> {
    return this.projectsService.setProjectImage(
      id,
      setProjectImageDto.mediaId,
      ProjectImageType.AFTER,
    );
  }

  @Post(':id/images/upload')
  @Auth(RoleName.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Subir imagen a Cloudinary y asociarla al proyecto (cover, before o after) (ADMIN)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: {
          type: 'string',
          enum: Object.values(ProjectImageType),
          description: 'Tipo de imagen del proyecto',
        },
      },
      required: ['file', 'type'],
    },
  })
  async uploadProjectImage(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('type', new ParseEnumPipe(ProjectImageType))
    type: ProjectImageType,
    @CurrentUser('id') userId: string | undefined,
  ): Promise<ProjectPublicResponseDto> {
    return this.projectsService.uploadProjectImage(
      id,
      {
        buffer: file.buffer,
        mimetype: file.mimetype,
        size: file.size,
        originalname: file.originalname,
      },
      type,
      userId ?? null,
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
  ): Promise<ProjectPublicResponseDto> {
    await this.projectsService.restore(id);
    return this.projectsService.findOne(id);
  }
}
