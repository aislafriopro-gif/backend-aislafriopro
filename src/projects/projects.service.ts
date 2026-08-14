import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, In, IsNull, Repository } from 'typeorm';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { Media } from '../media/entities/media.entity';
import { Service } from '../services/entities/service.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import {
  ProjectImage,
  ProjectImageType,
} from './media/entities/project-image.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ProjectImage)
    private readonly projectImageRepository: Repository<ProjectImage>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    await this.ensureSlugAvailable(createProjectDto.slug);

    const { coverMediaId, beforeMediaId, afterMediaId, ...projectData } =
      createProjectDto;

    const project = this.projectRepository.create(projectData);

    if (createProjectDto.clientId) {
      await this.validateClient(createProjectDto.clientId);
    }

    if (createProjectDto.serviceIds?.length) {
      project.services = await this.validateServices(
        createProjectDto.serviceIds,
      );
    }

    const imageInputs: Array<{ type: ProjectImageType; mediaId: string }> = [];
    if (coverMediaId) {
      imageInputs.push({ type: ProjectImageType.COVER, mediaId: coverMediaId });
    }
    if (beforeMediaId) {
      imageInputs.push({
        type: ProjectImageType.BEFORE,
        mediaId: beforeMediaId,
      });
    }
    if (afterMediaId) {
      imageInputs.push({ type: ProjectImageType.AFTER, mediaId: afterMediaId });
    }

    if (imageInputs.length > 0) {
      await this.validateMedia(imageInputs.map((input) => input.mediaId));
      project.images = imageInputs.map((input) =>
        this.projectImageRepository.create({
          mediaId: input.mediaId,
          type: input.type,
          displayOrder: 1,
        }),
      );
    }

    return this.projectRepository.save(project);
  }

  async findAll(
    query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    const where: FindOptionsWhere<Project> | FindOptionsWhere<Project>[] =
      this.buildWhereClause(query, { activeOnly: true });

    const [data, total] = await this.projectRepository.findAndCount({
      where,
      relations: ['images', 'services', 'client'],
      order: { createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findAllAdmin(
    query: FindProjectsQueryDto,
  ): Promise<PaginatedResponse<Project>> {
    const where: FindOptionsWhere<Project> | FindOptionsWhere<Project>[] =
      this.buildWhereClause(query, { activeOnly: false });

    const [data, total] = await this.projectRepository.findAndCount({
      where,
      withDeleted: true,
      relations: ['images', 'services', 'client'],
      order: { createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['images', 'services', 'client'],
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['services'],
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    if (updateProjectDto.slug !== undefined) {
      await this.ensureSlugAvailable(updateProjectDto.slug, id);
    }

    if (updateProjectDto.clientId) {
      await this.validateClient(updateProjectDto.clientId);
    }

    if (updateProjectDto.serviceIds !== undefined) {
      project.services = await this.validateServices(
        updateProjectDto.serviceIds,
      );
      delete updateProjectDto.serviceIds;
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    await this.projectRepository.softDelete(id);
  }

  async restore(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${id}" not found`);
    }

    if (project.deletedAt === null || project.deletedAt === undefined) {
      throw new ConflictException(`Project with id "${id}" is not deleted`);
    }

    await this.ensureSlugAvailable(project.slug, id);

    project.deletedAt = null;
    return this.projectRepository.save(project);
  }

  async setProjectImage(
    projectId: string,
    mediaId: string,
    type: ProjectImageType,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, deletedAt: IsNull() },
    });

    if (!project) {
      throw new NotFoundException(`Project with id "${projectId}" not found`);
    }

    const media = await this.mediaRepository.findOne({
      where: { id: mediaId, deletedAt: IsNull() },
    });

    if (!media) {
      throw new NotFoundException(`Media with id "${mediaId}" not found`);
    }

    await this.projectImageRepository.increment(
      { projectId, type },
      'displayOrder',
      1,
    );

    const image = this.projectImageRepository.create({
      projectId,
      mediaId,
      type,
      displayOrder: 1,
    });
    await this.projectImageRepository.save(image);

    return this.findOne(projectId);
  }

  private buildWhereClause(
    query: FindProjectsQueryDto,
    options: { activeOnly: boolean },
  ): FindOptionsWhere<Project> | FindOptionsWhere<Project>[] {
    const baseWhere: FindOptionsWhere<Project> = {};

    if (options.activeOnly) {
      baseWhere.deletedAt = IsNull();
    }

    if (query.location) {
      baseWhere.location = ILike(`%${query.location}%`);
    }

    if (query.clientId) {
      baseWhere.clientId = query.clientId;
    }

    if (query.search) {
      return [
        { ...baseWhere, title: ILike(`%${query.search}%`) },
        { ...baseWhere, description: ILike(`%${query.search}%`) },
      ];
    }

    return baseWhere;
  }

  private async ensureSlugAvailable(
    slug: string,
    excludedId?: string,
  ): Promise<void> {
    const existing = await this.projectRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (existing && existing.id !== excludedId) {
      throw new ConflictException(`Project slug "${slug}" is already in use`);
    }
  }

  private async validateServices(serviceIds: string[]): Promise<Service[]> {
    const services = await this.serviceRepository.find({
      where: { id: In(serviceIds) },
      withDeleted: true,
    });

    const foundIds = new Set(services.map((service) => service.id));
    const missingIds = serviceIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Services not found: ${missingIds.join(', ')}`,
      );
    }

    const invalidServices = services
      .filter((service) => !service.isActive || service.deletedAt !== null)
      .map((service) => ({
        id: service.id,
        reason: !service.isActive
          ? 'is inactive'
          : `is soft deleted (deletedAt: ${service.deletedAt?.toISOString()})`,
      }));

    if (invalidServices.length > 0) {
      const details = invalidServices
        .map((service) => `${service.id} ${service.reason}`)
        .join('; ');
      throw new BadRequestException(
        `Cannot associate inactive or deleted services: ${details}`,
      );
    }

    return services;
  }

  private async validateMedia(mediaIds: string[]): Promise<void> {
    const media = await this.mediaRepository.find({
      where: { id: In(mediaIds) },
      withDeleted: true,
    });

    const foundIds = new Set(media.map((item) => item.id));
    const missingIds = mediaIds.filter((id) => !foundIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(`Media not found: ${missingIds.join(', ')}`);
    }

    const deletedMedia = media.filter(
      (item) => item.deletedAt !== null && item.deletedAt !== undefined,
    );

    if (deletedMedia.length > 0) {
      const details = deletedMedia.map((item) => item.id).join(', ');
      throw new BadRequestException(
        `Cannot associate deleted media: ${details}`,
      );
    }
  }

  private async validateClient(clientId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: clientId },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`Client with id "${clientId}" not found`);
    }

    if (user.deletedAt !== null && user.deletedAt !== undefined) {
      throw new BadRequestException(
        `Client with id "${clientId}" is soft deleted`,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        `Client with id "${clientId}" is not active (status: ${user.status})`,
      );
    }
  }
}
