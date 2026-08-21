import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';
import { Service } from '../services/entities/service.entity';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QuoteRequestNote } from './notes/quote-request-note.entity';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from './entities/quote-request.entity';
import { QuoteRequestsService } from './quote-requests.service';

const buildValidDto = (
  overrides: Partial<CreateQuoteRequestDto> = {},
): CreateQuoteRequestDto =>
  Object.assign(new CreateQuoteRequestDto(), {
    name: 'María Pérez',
    email: 'maria.perez@example.com',
    phone: '+54 9 11 1234-5678',
    serviceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    materials: 'Necesitamos aislamiento para cubierta metálica.',
    message: 'Necesitamos una cotización para instalar un aire acondicionado.',
    ...overrides,
  });

const buildService = (overrides: Partial<Service> = {}): Service =>
  Object.assign(new Service(), {
    id: '123e4567-e89b-42d3-a456-426614174000',
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

const buildQuoteRequest = (
  overrides: Partial<QuoteRequest> = {},
): QuoteRequest =>
  Object.assign(new QuoteRequest(), {
    id: 'b2c3d4e5-f6a7-4890-bcde-f1234567890a',
    name: 'María Pérez',
    email: 'maria.perez@example.com',
    phone: '+54 9 11 1234-5678',
    service: buildService(),
    message: 'Necesitamos una cotización para instalar un aire acondicionado.',
    status: QuoteRequestStatus.NEW,
    notes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
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

const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
): PaginatedResponse<T> => ({
  data,
  total,
  page: 1,
  limit: 10,
  totalPages: total === 0 ? 0 : Math.ceil(total / 10),
});

describe('QuoteRequestsService', () => {
  let quoteRequestRepository: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let serviceRepository: {
    findOne: jest.Mock;
  };
  let quoteRequestNoteRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let quoteRequestsService: QuoteRequestsService;

  let createQueryBuilderMock: jest.Mock;
  let leftJoinAndSelectMock: jest.Mock;
  let orderByMock: jest.Mock;
  let skipMock: jest.Mock;
  let takeMock: jest.Mock;
  let andWhereMock: jest.Mock;
  let getManyAndCountMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    leftJoinAndSelectMock = jest.fn().mockReturnThis();
    orderByMock = jest.fn().mockReturnThis();
    skipMock = jest.fn().mockReturnThis();
    takeMock = jest.fn().mockReturnThis();
    andWhereMock = jest.fn().mockReturnThis();
    getManyAndCountMock = jest.fn();

    const quoteRequestQueryBuilder = {
      leftJoinAndSelect: leftJoinAndSelectMock,
      orderBy: orderByMock,
      skip: skipMock,
      take: takeMock,
      andWhere: andWhereMock,
      getManyAndCount: getManyAndCountMock,
    };

    createQueryBuilderMock = jest
      .fn()
      .mockReturnValue(quoteRequestQueryBuilder);

    quoteRequestRepository = {
      create: jest.fn((input) => Object.assign(new QuoteRequest(), input)),
      save: jest.fn((quoteRequest: QuoteRequest) =>
        Promise.resolve(
          Object.assign(quoteRequest, {
            id: quoteRequest.id ?? 'b2c3d4e5-f6a7-4890-bcde-f1234567890a',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
      ),
      createQueryBuilder: createQueryBuilderMock,
    };

    serviceRepository = {
      findOne: jest.fn(),
    };

    quoteRequestNoteRepository = {
      create: jest.fn((input) => Object.assign(new QuoteRequestNote(), input)),
      save: jest.fn((note: QuoteRequestNote) =>
        Promise.resolve(
          Object.assign(new QuoteRequestNote(), note, {
            id: note.id ?? 'c3d4e5f6-a7b8-4901-cdef-1234567890ab',
            createdAt: new Date(),
          }),
        ),
      ),
    };

    quoteRequestsService = new QuoteRequestsService(
      quoteRequestRepository as unknown as Repository<QuoteRequest>,
      quoteRequestNoteRepository as unknown as Repository<QuoteRequestNote>,
      serviceRepository as unknown as Repository<Service>,
    );
  });

  describe('DTO validation', () => {
    it('debe rechazar un email con formato inválido', async () => {
      const dto = buildValidDto({ email: 'maria@@example.com' });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'email')).toBe(true);
    });

    it('debe rechazar un teléfono con formato inválido', async () => {
      const dto = buildValidDto({ phone: 'abc-12345' });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'phone')).toBe(true);
    });

    it.each([
      ['name', 'name'],
      ['email', 'email'],
      ['phone', 'phone'],
      ['message', 'message'],
    ])('debe exigir el campo %s cuando falta', async (_, property) => {
      const dto = buildValidDto({
        [property]: undefined,
      });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === property)).toBe(true);
    });

    it('debe aceptar un dto sin serviceId', async () => {
      const dto = buildValidDto({ serviceId: undefined });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'serviceId')).toBe(false);
    });

    const maxLengthCases: Array<
      [string, keyof CreateQuoteRequestDto, string]
    > = [
      ['name', 'name', 'x'.repeat(151)],
      ['email', 'email', 'a'.repeat(256) + '@example.com'],
      ['phone', 'phone', '1'.repeat(51)],
      ['message', 'message', 'x'.repeat(1001)],
    ];

    it.each(maxLengthCases)(
      'debe rechazar cuando %s excede la longitud máxima',
      async (_, property, value) => {
        const dto = buildValidDto({
          [property]: value,
        });

        const errors = await validate(dto);

        expect(errors.some((error) => error.property === property)).toBe(true);
      },
    );

    it('debe rechazar un serviceId con UUID inválido cuando se envía', async () => {
      const dto = buildValidDto({ serviceId: 'not-a-uuid' });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'serviceId')).toBe(true);
    });
  });

  describe('create', () => {
    it('debe crear la solicitud asociando el servicio y persistirla', async () => {
      const dto = buildValidDto();
      const service = Object.assign(new Service(), {
        id: dto.serviceId,
        name: 'Aislación térmica',
      });

      serviceRepository.findOne.mockResolvedValue(service);

      const result = await quoteRequestsService.create(dto);

      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.serviceId, deletedAt: IsNull() },
      });
      expect(quoteRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          service,
          message: dto.message,
          status: 'NEW',
        }),
      );
      expect(quoteRequestRepository.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          status: 'NEW',
          service,
        }),
      );
    });

    it('debe crear la solicitud sin serviceId y con materials cuando se envía', async () => {
      const dto = buildValidDto({
        serviceId: undefined,
        materials: 'Lamina de acero galvanizada',
      });
      const result = await quoteRequestsService.create(dto);

      expect(serviceRepository.findOne).not.toHaveBeenCalled();
      expect(quoteRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          materials: 'Lamina de acero galvanizada',
          service: null,
          status: 'NEW',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          status: 'NEW',
          materials: 'Lamina de acero galvanizada',
          service: null,
        }),
      );
    });

    it('debe crear la solicitud sin serviceId y sin materials cuando no se envía', async () => {
      const dto = buildValidDto({
        serviceId: undefined,
        materials: undefined,
      });
      const result = await quoteRequestsService.create(dto);

      expect(serviceRepository.findOne).not.toHaveBeenCalled();
      expect(quoteRequestRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          materials: null,
          service: null,
          status: 'NEW',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          status: 'NEW',
          materials: null,
          service: null,
        }),
      );
    });

    it('debe rechazar si el serviceId es válido pero no existe en la base', async () => {
      const dto = buildValidDto();
      serviceRepository.findOne.mockResolvedValue(null);

      const promise = quoteRequestsService.create(dto);

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        'El servicio indicado en serviceId no existe o no está disponible.',
      );
      expect(serviceRepository.findOne).toHaveBeenCalledTimes(1);
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.serviceId, deletedAt: IsNull() },
      });
    });
  });

  describe('findAll', () => {
    it('debe retornar una lista paginada de solicitudes ordenadas por createdAt DESC', async () => {
      const quoteRequests = [buildQuoteRequest(), buildQuoteRequest()];
      getManyAndCountMock.mockResolvedValue([quoteRequests, 2]);

      const pagination = buildPagination();
      const result = await quoteRequestsService.findAll(pagination);

      expect(result).toEqual(buildPaginatedResponse(quoteRequests, 2));
      expect(createQueryBuilderMock).toHaveBeenCalledWith('quoteRequest');
      expect(leftJoinAndSelectMock).toHaveBeenCalledWith(
        'quoteRequest.service',
        'service',
      );
      expect(leftJoinAndSelectMock).toHaveBeenCalledWith(
        'quoteRequest.notes',
        'notes',
      );
      expect(orderByMock).toHaveBeenCalledWith(
        'quoteRequest.createdAt',
        'DESC',
      );
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(takeMock).toHaveBeenCalledWith(10);
    });

    it('debe aplicar filtro por estado', async () => {
      getManyAndCountMock.mockResolvedValue([[], 0]);
      const pagination = buildPagination();

      await quoteRequestsService.findAll(pagination, {
        status: QuoteRequestStatus.RESPONDED,
      });

      expect(andWhereMock).toHaveBeenCalledWith(
        'quoteRequest.status = :status',
        { status: QuoteRequestStatus.RESPONDED },
      );
    });

    it('debe retornar paginación vacía cuando no hay resultados', async () => {
      getManyAndCountMock.mockResolvedValue([[], 0]);

      const pagination = buildPagination();
      const result = await quoteRequestsService.findAll(pagination);

      expect(result).toEqual(buildPaginatedResponse([], 0));
    });
  });
});
