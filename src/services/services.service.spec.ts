import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';
import {
  PaginationParamsDto,
  PaginatedResponse,
} from '../common/pagination';

type FindOneService = Repository<Service>['findOne'];
type FindOneByService = Repository<Service>['findOneBy'];
type FindOneByOrFailService = Repository<Service>['findOneByOrFail'];
type CreateService = Repository<Service>['create'];
type SaveService = Repository<Service>['save'];
type FindAndCountService = Repository<Service>['findAndCount'];
type UpdateService = Repository<Service>['update'];
type SoftDeleteService = Repository<Service>['softDelete'];
type RestoreService = Repository<Service>['restore'];

const buildService = (overrides: Partial<Service> = {}): Service => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  name: 'Aislación térmica',
  slug: 'aislacion-termica',
  description: 'Aislación para techos y paredes',
  shortDescription: 'Aislación profesional',
  imageUrl: 'https://example.com/image.jpg',
  isActive: true,
  displayOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const buildPagination = (
  overrides: Partial<PaginationParamsDto> = {},
): PaginationParamsDto => {
  const dto = new PaginationParamsDto();
  dto.page = 1;
  dto.limit = 10;
  return Object.assign(dto, overrides);
};

const buildFindServicesQuery = (
  overrides: Partial<FindServicesQueryDto> = {},
): FindServicesQueryDto => {
  const dto = new FindServicesQueryDto();
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

describe('ServicesService', () => {
  let servicesService: ServicesService;

  let findOneServiceMock: jest.Mock<
    ReturnType<FindOneService>,
    Parameters<FindOneService>
  >;
  let findOneByServiceMock: jest.Mock<
    ReturnType<FindOneByService>,
    Parameters<FindOneByService>
  >;
  let findOneByOrFailServiceMock: jest.Mock<
    ReturnType<FindOneByOrFailService>,
    Parameters<FindOneByOrFailService>
  >;
  let createServiceMock: jest.Mock<
    ReturnType<CreateService>,
    Parameters<CreateService>
  >;
  let saveServiceMock: jest.Mock<
    ReturnType<SaveService>,
    Parameters<SaveService>
  >;
  let findAndCountServiceMock: jest.Mock<
    ReturnType<FindAndCountService>,
    Parameters<FindAndCountService>
  >;
  let updateServiceMock: jest.Mock<
    ReturnType<UpdateService>,
    Parameters<UpdateService>
  >;
  let softDeleteServiceMock: jest.Mock<
    ReturnType<SoftDeleteService>,
    Parameters<SoftDeleteService>
  >;
  let restoreServiceMock: jest.Mock<
    ReturnType<RestoreService>,
    Parameters<RestoreService>
  >;

  beforeEach(() => {
    jest.resetAllMocks();

    findOneServiceMock = jest.fn<
      ReturnType<FindOneService>,
      Parameters<FindOneService>
    >();
    findOneByServiceMock = jest.fn<
      ReturnType<FindOneByService>,
      Parameters<FindOneByService>
    >();
    findOneByOrFailServiceMock = jest.fn<
      ReturnType<FindOneByOrFailService>,
      Parameters<FindOneByOrFailService>
    >();
    createServiceMock = jest.fn<
      ReturnType<CreateService>,
      Parameters<CreateService>
    >((input) => Object.assign(new Service(), input));
    saveServiceMock = jest.fn<
      ReturnType<SaveService>,
      Parameters<SaveService>
    >((service) =>
      Promise.resolve(
        Object.assign(service, {
          id: service.id ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        }) as Service,
      ),
    );
    findAndCountServiceMock = jest
      .fn<ReturnType<FindAndCountService>, Parameters<FindAndCountService>>()
      .mockResolvedValue([[], 0]);
    updateServiceMock = jest
      .fn<ReturnType<UpdateService>, Parameters<UpdateService>>()
      .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 });
    softDeleteServiceMock = jest
      .fn<ReturnType<SoftDeleteService>, Parameters<SoftDeleteService>>()
      .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 });
    restoreServiceMock = jest
      .fn<ReturnType<RestoreService>, Parameters<RestoreService>>()
      .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 });

    const serviceRepository = {
      findOne: findOneServiceMock,
      findOneBy: findOneByServiceMock,
      findOneByOrFail: findOneByOrFailServiceMock,
      create: createServiceMock,
      save: saveServiceMock,
      findAndCount: findAndCountServiceMock,
      update: updateServiceMock,
      softDelete: softDeleteServiceMock,
      restore: restoreServiceMock,
    } as unknown as Repository<Service>;

    servicesService = new ServicesService(serviceRepository);
  });

  describe('create', () => {
    it('debe crear y persistir un servicio', async () => {
      const dto: CreateServiceDto = {
        name: 'Aislación térmica',
        slug: 'aislacion-termica',
        description: 'Servicio de aislación',
      };
      const savedService = Object.assign(new Service(), dto, {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      });

      const result = await servicesService.create(dto);

      expect(createServiceMock).toHaveBeenCalledWith(dto);
      expect(saveServiceMock).toHaveBeenCalled();
      expect(result).toEqual(savedService);
      expect(result.name).toBe(dto.name);
      expect(result.slug).toBe(dto.slug);
      expect(result.description).toBe(dto.description);
    });
  });

  describe('findAll (publico)', () => {
    it('debe retornar una lista paginada de servicios activos y no eliminados', async () => {
      const services = [
        buildService({ id: 's-1' }),
        buildService({ id: 's-2' }),
      ];
      findAndCountServiceMock.mockResolvedValue([services, 2]);

      const query = buildFindServicesQuery();
      const result = await servicesService.findAll(query);

      expect(result).toEqual(buildPaginatedResponse(services, 2));
      expect(findAndCountServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: expect.anything(),
            isActive: true,
          }),
          order: { displayOrder: 'ASC', createdAt: 'DESC' },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('debe aplicar el termino de busqueda por nombre', async () => {
      const query = buildFindServicesQuery({ search: 'aislacion' });

      await servicesService.findAll(query);

      expect(findAndCountServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('no debe incluir el filtro de nombre si no se envia search', async () => {
      const query = buildFindServicesQuery();

      await servicesService.findAll(query);

      const calls = findAndCountServiceMock.mock.calls as Array<
        [{ where: Record<string, unknown> }]
      >;
      expect(calls[0][0].where).not.toHaveProperty('name');
    });

    it('debe respetar la paginacion recibida', async () => {
      const query = buildFindServicesQuery({ page: 2, limit: 5 });

      await servicesService.findAll(query);

      expect(findAndCountServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findAllAdmin', () => {
    it('debe listar todos los servicios incluyendo eliminados', async () => {
      const services = [buildService(), buildService({ deletedAt: new Date() })];
      findAndCountServiceMock.mockResolvedValue([services, 2]);

      const query = buildFindServicesQuery();
      const result = await servicesService.findAllAdmin(query);

      expect(result).toEqual(buildPaginatedResponse(services, 2));
      expect(findAndCountServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          withDeleted: true,
          order: { createdAt: 'DESC' },
        }),
      );
    });

    it('no debe filtrar por isActive en el listado admin', async () => {
      const query = buildFindServicesQuery();

      await servicesService.findAllAdmin(query);

      const calls = findAndCountServiceMock.mock.calls as Array<
        [{ where: Record<string, unknown> }]
      >;
      expect(calls[0][0].where).not.toHaveProperty('isActive');
    });

    it('debe aplicar la busqueda por nombre si se envia', async () => {
      const query = buildFindServicesQuery({ search: 'aislacion' });

      await servicesService.findAllAdmin(query);

      expect(findAndCountServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });
  });

  describe('findOne (publico)', () => {
    it('debe retornar un servicio activo y no eliminado', async () => {
      const service = buildService();
      findOneServiceMock.mockResolvedValue(service);

      const result = await servicesService.findOne(service.id);

      expect(result).toBe(service);
      expect(findOneServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: service.id, isActive: true, deletedAt: expect.anything() },
        }),
      );
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(servicesService.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(servicesService.findOne('no-existe')).rejects.toThrow(
        'Service with id "no-existe" not found',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un servicio existente y retornarlo', async () => {
      const service = buildService();
      const dto: UpdateServiceDto = { name: 'Nuevo nombre' };
      const updated = buildService({ id: service.id, name: dto.name! });

      findOneServiceMock.mockResolvedValueOnce(service);
      findOneByOrFailServiceMock.mockResolvedValue(updated);

      const result = await servicesService.update(service.id, dto);

      expect(updateServiceMock).toHaveBeenCalledWith(service.id, dto);
      expect(findOneByOrFailServiceMock).toHaveBeenCalledWith({
        id: service.id,
      });
      expect(result).toBe(updated);
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(
        servicesService.update('no-existe', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('no debe actualizar servicios ya eliminados (soft delete)', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(
        servicesService.update('soft-deleted', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
      expect(updateServiceMock).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe hacer soft delete de un servicio existente', async () => {
      const service = buildService();
      findOneServiceMock.mockResolvedValue(service);

      await expect(servicesService.remove(service.id)).resolves.toBeUndefined();
      expect(softDeleteServiceMock).toHaveBeenCalledWith(service.id);
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(servicesService.remove('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restore', () => {
    it('debe restaurar un servicio eliminado', async () => {
      const service = buildService({ deletedAt: new Date() });
      const restored = buildService({ id: service.id, deletedAt: null });
      findOneServiceMock.mockResolvedValueOnce(service);
      findOneByOrFailServiceMock.mockResolvedValue(restored);

      const result = await servicesService.restore(service.id);

      expect(restoreServiceMock).toHaveBeenCalledWith(service.id);
      expect(findOneByOrFailServiceMock).toHaveBeenCalledWith({
        id: service.id,
      });
      expect(result).toBe(restored);
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(servicesService.restore('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el servicio no esta eliminado', async () => {
      const service = buildService({ deletedAt: null });
      findOneServiceMock.mockResolvedValue(service);

      await expect(servicesService.restore(service.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(servicesService.restore(service.id)).rejects.toThrow(
        `Service with id "${service.id}" is not deleted`,
      );
    });
  });
});
