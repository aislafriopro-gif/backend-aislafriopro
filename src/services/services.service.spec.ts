import { NotFoundException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServicesService } from './services.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-action.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';
import { PaginatedResponse } from '../common/pagination';

type FindOneService = Repository<Service>['findOne'];
type FindOneByService = Repository<Service>['findOneBy'];
type FindOneByOrFailService = Repository<Service>['findOneByOrFail'];
type CreateService = Repository<Service>['create'];
type SaveService = Repository<Service>['save'];
type FindAndCountService = Repository<Service>['findAndCount'];
type UpdateService = Repository<Service>['update'];
type SoftDeleteService = Repository<Service>['softDelete'];

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
  let logMock: jest.Mock;

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
    saveServiceMock = jest.fn<ReturnType<SaveService>, Parameters<SaveService>>(
      (service) =>
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
    logMock = jest.fn().mockResolvedValue(undefined);

    const serviceRepository = {
      findOne: findOneServiceMock,
      findOneBy: findOneByServiceMock,
      findOneByOrFail: findOneByOrFailServiceMock,
      create: createServiceMock,
      save: saveServiceMock,
      findAndCount: findAndCountServiceMock,
      update: updateServiceMock,
      softDelete: softDeleteServiceMock,
    } as unknown as Repository<Service>;

    const auditService = {
      log: logMock,
    } as unknown as AuditService;

    servicesService = new ServicesService(serviceRepository, auditService);
  });

  describe('create', () => {
    it('debe crear y persistir un servicio generando el slug automaticamente', async () => {
      const dto: CreateServiceDto = {
        name: 'Aislación térmica',
        description: 'Servicio de aislación',
      };
      findOneServiceMock.mockResolvedValue(null);

      const result = await servicesService.create(dto);

      expect(createServiceMock).toHaveBeenCalledWith({
        ...dto,
        slug: 'aislacion-termica',
      });
      expect(saveServiceMock).toHaveBeenCalled();
      expect(result.name).toBe(dto.name);
      expect(result.slug).toBe('aislacion-termica');
      expect(result.description).toBe(dto.description);
    });

    it('debe generar el slug correctamente para titulos en mayusculas', async () => {
      const dto: CreateServiceDto = {
        name: 'AHORA SI',
        description: 'Descripcion',
      };
      findOneServiceMock.mockResolvedValue(null);

      const result = await servicesService.create(dto);

      expect(result.slug).toBe('ahora-si');
    });

    it('debe lanzar ConflictException si el slug generado ya esta en uso', async () => {
      const dto: CreateServiceDto = {
        name: 'Aislación térmica',
        description: 'Otro servicio con el mismo slug',
      };
      findOneServiceMock.mockResolvedValue(
        buildService({ slug: 'aislacion-termica' }),
      );

      await expect(servicesService.create(dto)).rejects.toThrow(
        'Service slug "aislacion-termica" is already in use',
      );
      expect(createServiceMock).not.toHaveBeenCalled();
      expect(saveServiceMock).not.toHaveBeenCalled();
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
      const services = [
        buildService(),
        buildService({ deletedAt: new Date() }),
      ];
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
          where: {
            id: service.id,
            isActive: true,
            deletedAt: expect.anything(),
          },
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
      const updated = buildService({
        id: service.id,
        name: dto.name!,
        slug: 'nuevo-nombre',
      });

      findOneServiceMock
        .mockResolvedValueOnce(service)
        .mockResolvedValueOnce(null);
      findOneByOrFailServiceMock.mockResolvedValue(updated);

      const result = await servicesService.update(service.id, dto);

      expect(updateServiceMock).toHaveBeenCalledWith(service.id, {
        ...dto,
        slug: 'nuevo-nombre',
      });
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

    it('debe lanzar ConflictException si el nuevo slug generado ya esta en uso', async () => {
      const service = buildService({ id: 'service-to-update' });
      const dto: UpdateServiceDto = { name: 'Nombre en uso' };
      const conflictingService = buildService({
        id: 'other-service',
        slug: 'nombre-en-uso',
      });
      findOneServiceMock
        .mockResolvedValueOnce(service)
        .mockResolvedValueOnce(conflictingService);

      await expect(servicesService.update(service.id, dto)).rejects.toThrow(
        'Service slug "nombre-en-uso" is already in use',
      );
      expect(updateServiceMock).not.toHaveBeenCalled();
    });

    it('no debe regenerar el slug si el nombre no cambia', async () => {
      const service = buildService();
      const dto: UpdateServiceDto = { description: 'Nueva descripcion' };
      const updated = buildService({
        id: service.id,
        description: dto.description,
      });

      findOneServiceMock.mockResolvedValueOnce(service);
      findOneByOrFailServiceMock.mockResolvedValue(updated);

      await servicesService.update(service.id, dto);

      expect(updateServiceMock).toHaveBeenCalledWith(service.id, dto);
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
      const deletedAt = new Date();
      const service = buildService({ deletedAt, isActive: false });
      const restored = buildService({
        id: service.id,
        deletedAt: null,
        isActive: false,
      });
      findOneServiceMock
        .mockResolvedValueOnce(service)
        .mockResolvedValueOnce(null);
      saveServiceMock.mockResolvedValue(restored);

      const result = await servicesService.restore(service.id);

      expect(service.deletedAt).toBeNull();
      expect(saveServiceMock).toHaveBeenCalledWith(service);
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

    it('debe lanzar ConflictException si el slug ya esta en uso al restaurar', async () => {
      const service = buildService({
        id: 'deleted-service',
        deletedAt: new Date(),
      });
      const conflictingService = buildService({
        id: 'active-service',
        slug: service.slug,
      });
      findOneServiceMock
        .mockResolvedValueOnce(service)
        .mockResolvedValueOnce(conflictingService);

      await expect(servicesService.restore(service.id)).rejects.toThrow(
        `Service slug "${service.slug}" is already in use`,
      );
      expect(saveServiceMock).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    const userId = 'user-id';

    it('debe publicar un servicio y registrar auditoria', async () => {
      const service = buildService({ isActive: false });
      const published = buildService({ id: service.id, isActive: true });
      findOneServiceMock.mockResolvedValue(service);
      saveServiceMock.mockResolvedValue(published);

      const result = await servicesService.publish(service.id, userId);

      expect(result.isActive).toBe(true);
      expect(logMock).toHaveBeenCalledWith({
        action: AuditAction.UPDATE,
        entityName: 'Service',
        entityId: service.id,
        userId,
        previousData: { isActive: false },
        newData: { isActive: true },
        ipAddress: null,
        userAgent: null,
      });
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(servicesService.publish('no-existe', userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el servicio ya esta publicado', async () => {
      const service = buildService({ isActive: true });
      findOneServiceMock.mockResolvedValue(service);

      await expect(
        servicesService.publish(service.id, userId),
      ).rejects.toThrow(ConflictException);
      await expect(
        servicesService.publish(service.id, userId),
      ).rejects.toThrow(
        `Service with id "${service.id}" is already published`,
      );
    });
  });

  describe('unpublish', () => {
    const userId = 'user-id';

    it('debe despublicar un servicio y registrar auditoria', async () => {
      const service = buildService({ isActive: true });
      const unpublished = buildService({ id: service.id, isActive: false });
      findOneServiceMock.mockResolvedValue(service);
      saveServiceMock.mockResolvedValue(unpublished);

      const result = await servicesService.unpublish(service.id, userId);

      expect(result.isActive).toBe(false);
      expect(logMock).toHaveBeenCalledWith({
        action: AuditAction.UPDATE,
        entityName: 'Service',
        entityId: service.id,
        userId,
        previousData: { isActive: true },
        newData: { isActive: false },
        ipAddress: null,
        userAgent: null,
      });
    });

    it('debe lanzar NotFoundException si el servicio no existe', async () => {
      findOneServiceMock.mockResolvedValue(null);

      await expect(
        servicesService.unpublish('no-existe', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el servicio ya esta despublicado', async () => {
      const service = buildService({ isActive: false });
      findOneServiceMock.mockResolvedValue(service);

      await expect(
        servicesService.unpublish(service.id, userId),
      ).rejects.toThrow(ConflictException);
      await expect(
        servicesService.unpublish(service.id, userId),
      ).rejects.toThrow(
        `Service with id "${service.id}" is already unpublished`,
      );
    });
  });
});
