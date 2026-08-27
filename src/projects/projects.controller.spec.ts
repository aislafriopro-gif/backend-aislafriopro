import { PaginatedResponse } from '../common/pagination';
import { CreateProjectDto } from './dto/create-project.dto';
import { FindProjectsQueryDto } from './dto/find-projects-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
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

describe('ProjectsController', () => {
  let projectsController: ProjectsController;

  let createMock: jest.MockedFunction<ProjectsService['create']>;
  let findAllMock: jest.MockedFunction<ProjectsService['findAll']>;
  let findAllAdminMock: jest.MockedFunction<ProjectsService['findAllAdmin']>;
  let findOneMock: jest.MockedFunction<ProjectsService['findOne']>;
  let findOneBySlugMock: jest.MockedFunction<ProjectsService['findOneBySlug']>;
  let updateMock: jest.MockedFunction<ProjectsService['update']>;
  let removeMock: jest.MockedFunction<ProjectsService['remove']>;
  let restoreMock: jest.MockedFunction<ProjectsService['restore']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findAllAdminMock = jest.fn();
    findOneMock = jest.fn();
    findOneBySlugMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();
    restoreMock = jest.fn();

    const projectsService = {
      create: createMock,
      findAll: findAllMock,
      findAllAdmin: findAllAdminMock,
      findOne: findOneMock,
      findOneBySlug: findOneBySlugMock,
      update: updateMock,
      remove: removeMock,
      restore: restoreMock,
    } as unknown as ProjectsService;

    projectsController = new ProjectsController(projectsService);
  });

  describe('create', () => {
    it('debe crear un proyecto y retornarlo', async () => {
      const dto: CreateProjectDto = {
        title: 'Proyecto test',
        slug: 'proyecto-test',
        description: 'Descripción test',
      };
      const created = buildProject({
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
      });
      createMock.mockResolvedValue(created);

      const result = await projectsController.create(dto, {}, undefined);

      expect(result).toBe(created);
      expect(createMock).toHaveBeenCalledWith(dto, {}, undefined);
    });
  });

  describe('findAll', () => {
    it('debe delegar el listado público al servicio', async () => {
      const project = buildProject();
      const paginated = buildPaginatedResponse<Project>([project], 1);
      findAllMock.mockResolvedValue(paginated as any);

      const query = buildFindProjectsQuery();
      const result = await projectsController.findAll(query);

      expect(result).toBe(paginated);
      expect(findAllMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findAllAdmin', () => {
    it('debe delegar el listado admin al servicio', async () => {
      const project = buildProject({ deletedAt: new Date() });
      const paginated = buildPaginatedResponse<Project>([project], 1);
      findAllAdminMock.mockResolvedValue(paginated as any);

      const query = buildFindProjectsQuery();
      const result = await projectsController.findAllAdmin(query);

      expect(result).toBe(paginated);
      expect(findAllAdminMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debe obtener un proyecto por id', async () => {
      const project = buildProject();
      findOneMock.mockResolvedValue(project as any);

      const result = await projectsController.findOne(project.id);

      expect(result).toBe(project);
      expect(findOneMock).toHaveBeenCalledWith(project.id);
    });
  });

  describe('findOneBySlug', () => {
    it('debe obtener un proyecto por slug', async () => {
      const slug = 'aislacion-termica-camara-frigorifica';
      const project = buildProject({ slug });
      findOneBySlugMock.mockResolvedValue(project as any);

      const result = await projectsController.findOneBySlug(slug);

      expect(result).toBe(project);
      expect(findOneBySlugMock).toHaveBeenCalledWith(slug);
    });
  });

  describe('update', () => {
    it('debe actualizar un proyecto y retornarlo', async () => {
      const project = buildProject();
      const dto: UpdateProjectDto = { title: 'Nuevo título' };
      updateMock.mockResolvedValue(project);

      const result = await projectsController.update(
        project.id,
        dto,
        {},
        undefined,
      );

      expect(result).toBe(project);
      expect(updateMock).toHaveBeenCalledWith(project.id, dto, {}, undefined);
    });
  });

  describe('remove', () => {
    it('debe eliminar un proyecto por id', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      removeMock.mockResolvedValue(undefined);

      await expect(projectsController.remove(id)).resolves.toBeUndefined();
      expect(removeMock).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('debe restaurar un proyecto eliminado y retornarlo', async () => {
      const project = buildProject({ deletedAt: null });
      restoreMock.mockResolvedValue(project);
      findOneMock.mockResolvedValue(project as any);

      const result = await projectsController.restore(project.id);

      expect(result).toBe(project);
      expect(restoreMock).toHaveBeenCalledWith(project.id);
      expect(findOneMock).toHaveBeenCalledWith(project.id);
    });
  });

});
