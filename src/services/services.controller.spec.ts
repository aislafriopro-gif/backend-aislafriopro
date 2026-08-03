import { plainToInstance } from 'class-transformer';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';

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
) => ({
  data,
  total,
  page,
  limit,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
});

describe('ServicesController', () => {
  let servicesController: ServicesController;

  let createMock: jest.MockedFunction<ServicesService['create']>;
  let findAllMock: jest.MockedFunction<ServicesService['findAll']>;
  let findAllAdminMock: jest.MockedFunction<ServicesService['findAllAdmin']>;
  let findOneMock: jest.MockedFunction<ServicesService['findOne']>;
  let updateMock: jest.MockedFunction<ServicesService['update']>;
  let removeMock: jest.MockedFunction<ServicesService['remove']>;
  let restoreMock: jest.MockedFunction<ServicesService['restore']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findAllAdminMock = jest.fn();
    findOneMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();
    restoreMock = jest.fn();

    const servicesService = {
      create: createMock,
      findAll: findAllMock,
      findAllAdmin: findAllAdminMock,
      findOne: findOneMock,
      update: updateMock,
      remove: removeMock,
      restore: restoreMock,
    } as unknown as ServicesService;

    servicesController = new ServicesController(servicesService);
  });

  describe('create', () => {
    it('debe crear un servicio y retornarlo', async () => {
      const dto: CreateServiceDto = {
        name: 'Nuevo servicio',
        slug: 'nuevo-servicio',
        description: 'Descripcion',
      };
      const created = buildService(dto);
      createMock.mockResolvedValue(created);

      const result = await servicesController.create(dto);

      expect(result).toBe(created);
      expect(createMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll (publico)', () => {
    it('debe transformar los datos a ServiceResponseDto excluyendo deletedAt', async () => {
      const service = buildService();
      const paginated = buildPaginatedResponse<Service>([service], 1);
      findAllMock.mockResolvedValue(paginated);

      const query = buildFindServicesQuery();
      const result = await servicesController.findAll(query);

      expect(findAllMock).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(ServiceResponseDto);
      const json = JSON.parse(JSON.stringify(result.data[0]));
      expect(json).not.toHaveProperty('deletedAt');
      expect(json.id).toBe(service.id);
      expect(json.name).toBe(service.name);
    });

    it('debe retornar data vacia si el servicio no encontro resultados', async () => {
      findAllMock.mockResolvedValue(buildPaginatedResponse<Service>([], 0));

      const result = await servicesController.findAll(
        buildFindServicesQuery(),
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('debe delegar el query al servicio', async () => {
      const query = buildFindServicesQuery({ search: 'aislacion', page: 2 });
      findAllMock.mockResolvedValue(buildPaginatedResponse<Service>([], 0));

      await servicesController.findAll(query);

      expect(findAllMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findAllAdmin', () => {
    it('debe delegar en el servicio sin transformar a response DTO', async () => {
      const service = buildService();
      const paginated = buildPaginatedResponse<Service>([service], 1);
      findAllAdminMock.mockResolvedValue(paginated);

      const query = buildFindServicesQuery();
      const result = await servicesController.findAllAdmin(query);

      expect(findAllAdminMock).toHaveBeenCalledWith(query);
      expect(result).toBe(paginated);
      expect(result.data[0]).not.toBeInstanceOf(ServiceResponseDto);
    });
  });

  describe('findOne (publico)', () => {
    it('debe retornar un ServiceResponseDto sin deletedAt', async () => {
      const service = buildService();
      findOneMock.mockResolvedValue(service);

      const result = await servicesController.findOne(service.id);

      expect(findOneMock).toHaveBeenCalledWith(service.id);
      expect(result).toBeInstanceOf(ServiceResponseDto);
      const json = JSON.parse(JSON.stringify(result));
      expect(json).not.toHaveProperty('deletedAt');
    });
  });

  describe('update', () => {
    it('debe actualizar un servicio y retornarlo', async () => {
      const service = buildService();
      const dto: UpdateServiceDto = { name: 'Nombre actualizado' };
      updateMock.mockResolvedValue(service);

      const result = await servicesController.update(service.id, dto);

      expect(result).toBe(service);
      expect(updateMock).toHaveBeenCalledWith(service.id, dto);
    });
  });

  describe('remove', () => {
    it('debe eliminar un servicio por id', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      removeMock.mockResolvedValue(undefined);

      await expect(servicesController.remove(id)).resolves.toBeUndefined();
      expect(removeMock).toHaveBeenCalledWith(id);
    });
  });

  describe('restore', () => {
    it('debe restaurar un servicio eliminado', async () => {
      const service = buildService();
      restoreMock.mockResolvedValue(service);

      const result = await servicesController.restore(service.id);

      expect(result).toBe(service);
      expect(restoreMock).toHaveBeenCalledWith(service.id);
    });
  });
});
