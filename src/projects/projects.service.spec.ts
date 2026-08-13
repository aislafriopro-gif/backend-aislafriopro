import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/pagination';
import { CloudinaryService } from '../media/cloudinary.service';
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
import { ProjectsService } from './projects.service';

const buildProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  title: 'Aislación térmica cámara frigorífica',
  slug: 'aislacion-termica-camara-frigorifica',
  description: 'Instalación de paneles aislantes en cámara frigorífica.',
  location: 'Buenos Aires, Argentina',
  completionDate: new Date('2026-05-15'),
  clientId: 'c1d2e3f4-5678-90ab-cdef-123456789012',
  client: null,
  clientDisplayName: 'Frigorífico Los Andes',
  services: [],
  images: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildService = (overrides: Partial<Service> = {}): Service => ({
  id: 's1a2b3c4-d5e6-7890-abcd-ef1234567890',
  name: 'Aislación térmica',
  slug: 'aislacion-termica',
  description: 'Servicio de aislación térmica industrial.',
  shortDescription: null,
  imageUrl: null,
  isActive: true,
  displayOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
  name: 'Cliente Test',
  email: 'cliente@test.com',
  password: 'hashedpassword',
  phone: null,
  status: UserStatus.ACTIVE,
  lastLoginAt: null,
  role: {} as User['role'],
  sessions: [],
  auditLogs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: undefined,
  ...overrides,
});

const buildMedia = (overrides: Partial<Media> = {}): Media => ({
  id: 'm1a2b3c4-d5e6-7890-abcd-ef1234567890',
  publicId: 'aislafriopro/projects/test',
  url: 'http://res.cloudinary.com/test/image/upload/test.jpg',
  secureUrl: 'https://res.cloudinary.com/test/image/upload/test.jpg',
  format: 'jpg',
  resourceType: 'image',
  width: 1920,
  height: 1080,
  bytes: 245000,
  originalName: 'test.jpg',
  uploadedById: null,
  uploadedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildFindProjectsQuery = (
  overrides: Partial<FindProjectsQueryDto> = {},
): FindProjectsQueryDto => {
  const dto = new FindProjectsQueryDto();
  dto.page = 1;
  dto.limit = 10;
  return Object.assign(dto, overrides);
};

const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
  page = 1,
  limit = 10,
): PaginatedResponse<T> => ({
  data,
  total,
  page,
  limit,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let projectRepository: {
    create: jest.Mock<Project, [Partial<Project>]>;
    save: jest.Mock<Promise<Project>, [Project]>;
    findAndCount: jest.Mock<Promise<[Project[], number]>, [unknown]>;
    findOne: jest.Mock<Promise<Project | null>, [unknown]>;
    softDelete: jest.Mock<Promise<unknown>, [string]>;
  };
  let serviceRepository: {
    find: jest.Mock<Promise<Service[]>, [unknown]>;
  };
  let userRepository: {
    findOne: jest.Mock<Promise<User | null>, [unknown]>;
  };
  let projectImageRepository: {
    increment: jest.Mock<Promise<unknown>, [unknown, string, number]>;
    create: jest.Mock<ProjectImage, [Partial<ProjectImage>]>;
    save: jest.Mock<Promise<ProjectImage>, [ProjectImage]>;
  };
  let mediaRepository: {
    findOne: jest.Mock<Promise<Media | null>, [unknown]>;
    find: jest.Mock<Promise<Media[]>, [unknown]>;
  };
  let cloudinaryService: {
    uploadImage: jest.Mock<
      Promise<ReturnType<CloudinaryService['uploadImage']>>,
      [Parameters<CloudinaryService['uploadImage']>[0], (string | null)?]
    >;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    projectRepository = {
      create: jest.fn((input: Partial<Project>) =>
        Object.assign(new Project(), input),
      ),
      save: jest.fn((project: Project) =>
        Promise.resolve(
          Object.assign(project, {
            id: project.id ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        ),
      ),
      findAndCount: jest
        .fn<Promise<[Project[], number]>, [unknown]>()
        .mockResolvedValue([[], 0]),
      findOne: jest.fn<Promise<Project | null>, [unknown]>(),
      softDelete: jest
        .fn<Promise<unknown>, [string]>()
        .mockResolvedValue({ affected: 1 }),
    };

    serviceRepository = {
      find: jest.fn<Promise<Service[]>, [unknown]>().mockResolvedValue([]),
    };

    userRepository = {
      findOne: jest
        .fn<Promise<User | null>, [unknown]>()
        .mockResolvedValue(null),
    };

    projectImageRepository = {
      increment: jest
        .fn<Promise<unknown>, [unknown, string, number]>()
        .mockResolvedValue({ affected: 0 }),
      create: jest.fn((input: Partial<ProjectImage>) =>
        Object.assign(new ProjectImage(), input),
      ),
      save: jest.fn((image: ProjectImage) => Promise.resolve(image)),
    };

    mediaRepository = {
      findOne: jest
        .fn<Promise<Media | null>, [unknown]>()
        .mockResolvedValue(null),
      find: jest.fn<Promise<Media[]>, [unknown]>().mockResolvedValue([]),
    };

    cloudinaryService = {
      uploadImage: jest.fn().mockResolvedValue(buildMedia()),
    };

    projectsService = new ProjectsService(
      projectRepository as unknown as Repository<Project>,
      serviceRepository as unknown as Repository<Service>,
      userRepository as unknown as Repository<User>,
      projectImageRepository as unknown as Repository<ProjectImage>,
      mediaRepository as unknown as Repository<Media>,
      cloudinaryService as unknown as CloudinaryService,
    );
  });

  describe('create', () => {
    it('debe crear un proyecto sin services', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
      };

      const result = await projectsService.create(dto);

      expect(projectRepository.create).toHaveBeenCalledWith(dto);
      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.title).toBe(dto.title);
    });

    it('debe crear un proyecto con services asociados', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        serviceIds: ['s1a2b3c4-d5e6-7890-abcd-ef1234567890'],
      };
      const service = buildService();
      serviceRepository.find.mockResolvedValue([service]);

      const result = await projectsService.create(dto);

      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
      expect(result.services).toEqual([service]);
    });

    it('debe lanzar NotFoundException si un service no existe', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        serviceIds: ['non-existent-id'],
      };
      serviceRepository.find.mockResolvedValue([]);

      await expect(projectsService.create(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Services not found: non-existent-id',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si un service está inactivo', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        serviceIds: ['s1a2b3c4-d5e6-7890-abcd-ef1234567890'],
      };
      const service = buildService({ isActive: false });
      serviceRepository.find.mockResolvedValue([service]);

      await expect(projectsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Cannot associate inactive or deleted services',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si un service está soft deleted', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        serviceIds: ['s1a2b3c4-d5e6-7890-abcd-ef1234567890'],
      };
      const service = buildService({ deletedAt: new Date() });
      serviceRepository.find.mockResolvedValue([service]);

      await expect(projectsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe crear un proyecto con un clientId válido', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        clientId: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
      };
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await projectsService.create(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.clientId },
        withDeleted: true,
      });
      expect(result.clientId).toBe(dto.clientId);
    });

    it('debe lanzar NotFoundException si el clientId no existe', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        clientId: 'non-existent-id',
      };
      userRepository.findOne.mockResolvedValue(null);

      await expect(projectsService.create(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Client with id "non-existent-id" not found',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el client está soft deleted', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        clientId: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
      };
      const user = buildUser({ deletedAt: new Date() });
      userRepository.findOne.mockResolvedValue(user);

      await expect(projectsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Client with id "u1a2b3c4-d5e6-7890-abcd-ef1234567890" is soft deleted',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el client no está activo', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        clientId: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
      };
      const user = buildUser({ status: UserStatus.INACTIVE });
      userRepository.findOne.mockResolvedValue(user);

      await expect(projectsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Client with id "u1a2b3c4-d5e6-7890-abcd-ef1234567890" is not active (status: INACTIVE)',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el slug ya existe', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'slug-existente',
        description: 'Descripción test',
      };
      projectRepository.findOne.mockResolvedValue(buildProject());

      await expect(projectsService.create(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe crear un proyecto con las 3 imágenes adjuntas', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        coverMediaId: 'm1a2b3c4-d5e6-7890-abcd-ef1234567890',
        beforeMediaId: 'm2a2b3c4-d5e6-7890-abcd-ef1234567890',
        afterMediaId: 'm3a2b3c4-d5e6-7890-abcd-ef1234567890',
      };
      mediaRepository.find.mockResolvedValue([
        buildMedia({ id: dto.coverMediaId }),
        buildMedia({ id: dto.beforeMediaId }),
        buildMedia({ id: dto.afterMediaId }),
      ]);

      const result = await projectsService.create(dto);

      expect(projectRepository.create).toHaveBeenCalledWith({
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
      });
      expect(mediaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
      expect(projectImageRepository.create).toHaveBeenCalledTimes(3);
      expect(projectImageRepository.create).toHaveBeenCalledWith({
        mediaId: dto.coverMediaId,
        type: ProjectImageType.COVER,
        displayOrder: 1,
      });
      expect(projectImageRepository.create).toHaveBeenCalledWith({
        mediaId: dto.beforeMediaId,
        type: ProjectImageType.BEFORE,
        displayOrder: 1,
      });
      expect(projectImageRepository.create).toHaveBeenCalledWith({
        mediaId: dto.afterMediaId,
        type: ProjectImageType.AFTER,
        displayOrder: 1,
      });
      expect(result.images).toHaveLength(3);
      expect(projectRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si un media del create no existe', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        coverMediaId: 'no-existe',
      };
      mediaRepository.find.mockResolvedValue([]);

      await expect(projectsService.create(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Media not found: no-existe',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si un media del create está soft deleted', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
        beforeMediaId: 'm2a2b3c4-d5e6-7890-abcd-ef1234567890',
      };
      mediaRepository.find.mockResolvedValue([
        buildMedia({ id: dto.beforeMediaId, deletedAt: new Date() }),
      ]);

      await expect(projectsService.create(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(projectsService.create(dto)).rejects.toThrow(
        'Cannot associate deleted media',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar proyectos activos paginados', async () => {
      const projects = [buildProject({ id: 'p1' }), buildProject({ id: 'p2' })];
      projectRepository.findAndCount.mockResolvedValue([projects, 2]);

      const query = buildFindProjectsQuery();
      const result = await projectsService.findAll(query);

      expect(result).toEqual(buildPaginatedResponse(projects, 2));
      expect(projectRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          relations: ['images', 'services', 'client'],
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('debe respetar la paginación recibida', async () => {
      const query = buildFindProjectsQuery({ page: 2, limit: 5 });

      await projectsService.findAll(query);

      expect(projectRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('debe aplicar filtro de búsqueda por título', async () => {
      const query = buildFindProjectsQuery({ search: 'cámara' });

      await projectsService.findAll(query);

      const callArgs = projectRepository.findAndCount.mock.calls[0][0] as {
        where: Array<{ title?: unknown }>;
      };
      expect(Array.isArray(callArgs.where)).toBe(true);
    });

    it('debe aplicar filtro de ubicación', async () => {
      const query = buildFindProjectsQuery({ location: 'Buenos Aires' });

      await projectsService.findAll(query);

      expect(projectRepository.findAndCount).toHaveBeenCalled();
    });

    it('debe aplicar filtro de clientId', async () => {
      const query = buildFindProjectsQuery({
        clientId: 'c1d2e3f4-5678-90ab-cdef-123456789012',
      });

      await projectsService.findAll(query);

      expect(projectRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findAllAdmin', () => {
    it('debe listar todos los proyectos incluyendo eliminados', async () => {
      const projects = [
        buildProject(),
        buildProject({ deletedAt: new Date() }),
      ];
      projectRepository.findAndCount.mockResolvedValue([projects, 2]);

      const query = buildFindProjectsQuery();
      const result = await projectsService.findAllAdmin(query);

      expect(result).toEqual(buildPaginatedResponse(projects, 2));
      expect(projectRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar un proyecto activo por id con relaciones', async () => {
      const project = buildProject();
      projectRepository.findOne.mockResolvedValue(project);

      const result = await projectsService.findOne(project.id);

      expect(result).toBe(project);
      expect(projectRepository.findOne).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar NotFoundException si el proyecto no existe', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(projectsService.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(projectsService.findOne('no-existe')).rejects.toThrow(
        'Project with id "no-existe" not found',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un proyecto existente y retornarlo', async () => {
      const project = buildProject();
      const dto: UpdateProjectDto = { title: 'Nuevo título' };
      const updated = buildProject({ ...project, title: dto.title });

      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue(updated);

      const result = await projectsService.update(project.id, dto);

      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.title).toBe(dto.title);
    });

    it('debe actualizar los services si se envían serviceIds', async () => {
      const project = buildProject({ services: [] });
      const service = buildService();
      const dto: UpdateProjectDto = {
        serviceIds: ['s1a2b3c4-d5e6-7890-abcd-ef1234567890'],
      };

      projectRepository.findOne.mockResolvedValue(project);
      serviceRepository.find.mockResolvedValue([service]);
      projectRepository.save.mockResolvedValue(
        buildProject({ services: [service] }),
      );

      const result = await projectsService.update(project.id, dto);

      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
      expect(result.services).toEqual([service]);
    });

    it('debe lanzar BadRequestException al asociar un service inactivo en update', async () => {
      const project = buildProject({ services: [] });
      const service = buildService({ isActive: false });
      const dto: UpdateProjectDto = {
        serviceIds: ['s1a2b3c4-d5e6-7890-abcd-ef1234567890'],
      };

      projectRepository.findOne.mockResolvedValue(project);
      serviceRepository.find.mockResolvedValue([service]);

      await expect(projectsService.update(project.id, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException al asociar un client inactivo en update', async () => {
      const project = buildProject();
      const user = buildUser({ status: UserStatus.SUSPENDED });
      const dto: UpdateProjectDto = {
        clientId: 'u1a2b3c4-d5e6-7890-abcd-ef1234567890',
      };

      projectRepository.findOne.mockResolvedValue(project);
      userRepository.findOne.mockResolvedValue(user);

      await expect(projectsService.update(project.id, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(projectsService.update(project.id, dto)).rejects.toThrow(
        'Client with id "u1a2b3c4-d5e6-7890-abcd-ef1234567890" is not active (status: SUSPENDED)',
      );
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el proyecto no existe', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        projectsService.update('no-existe', { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
      expect(projectRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el slug ya existe en otro proyecto', async () => {
      const project = buildProject();
      const otherProject = buildProject({
        id: 'other-id',
        slug: 'slug-duplicado',
      });

      projectRepository.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(otherProject);

      await expect(
        projectsService.update(project.id, { slug: 'slug-duplicado' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe hacer soft delete de un proyecto existente', async () => {
      const project = buildProject();
      projectRepository.findOne.mockResolvedValue(project);

      await expect(projectsService.remove(project.id)).resolves.toBeUndefined();

      expect(projectRepository.softDelete).toHaveBeenCalledWith(project.id);
    });

    it('debe lanzar NotFoundException si el proyecto no existe', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(projectsService.remove('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      expect(projectRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('debe restaurar un proyecto eliminado', async () => {
      const project = buildProject({ deletedAt: new Date() });
      projectRepository.findOne.mockResolvedValue(project);
      projectRepository.save.mockResolvedValue(
        buildProject({ ...project, deletedAt: null }),
      );

      const result = await projectsService.restore(project.id);

      expect(projectRepository.save).toHaveBeenCalled();
      expect(result.deletedAt).toBeNull();
    });

    it('debe lanzar NotFoundException si el proyecto no existe', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(projectsService.restore('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el proyecto no está eliminado', async () => {
      const project = buildProject({ deletedAt: null });
      projectRepository.findOne.mockResolvedValue(project);

      await expect(projectsService.restore(project.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar ConflictException si el slug colisiona al restaurar', async () => {
      const project = buildProject({ deletedAt: new Date() });
      const conflict = buildProject({ id: 'other-id', slug: project.slug });
      projectRepository.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(conflict);

      await expect(projectsService.restore(project.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('setProjectImage', () => {
    it('debe crear la imagen con displayOrder 1 e incrementar las existentes del mismo tipo', async () => {
      const project = buildProject();
      const media = buildMedia();
      projectRepository.findOne.mockResolvedValue(project);
      mediaRepository.findOne.mockResolvedValue(media);

      const result = await projectsService.setProjectImage(
        project.id,
        media.id,
        ProjectImageType.COVER,
      );

      expect(projectImageRepository.increment).toHaveBeenCalledWith(
        { projectId: project.id, type: ProjectImageType.COVER },
        'displayOrder',
        1,
      );
      expect(projectImageRepository.create).toHaveBeenCalledWith({
        projectId: project.id,
        mediaId: media.id,
        type: ProjectImageType.COVER,
        displayOrder: 1,
      });
      expect(projectImageRepository.save).toHaveBeenCalled();
      expect(result).toBe(project);
    });

    it('debe lanzar NotFoundException si el proyecto no existe', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(
        projectsService.setProjectImage(
          'no-existe',
          'm1a2b3c4-d5e6-7890-abcd-ef1234567890',
          ProjectImageType.BEFORE,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(mediaRepository.findOne).not.toHaveBeenCalled();
      expect(projectImageRepository.save).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el media no existe', async () => {
      const project = buildProject();
      projectRepository.findOne.mockResolvedValue(project);
      mediaRepository.findOne.mockResolvedValue(null);

      await expect(
        projectsService.setProjectImage(
          project.id,
          'no-existe',
          ProjectImageType.AFTER,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        projectsService.setProjectImage(
          project.id,
          'no-existe',
          ProjectImageType.AFTER,
        ),
      ).rejects.toThrow('Media with id "no-existe" not found');
      expect(projectImageRepository.save).not.toHaveBeenCalled();
    });
  });
});
