import { Service } from '../services/entities/service.entity';
import { FindQuoteRequestsQueryDto } from './dto/find-quote-requests-query.dto';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from './entities/quote-request.entity';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';

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

const buildPaginatedResponse = <T>(data: T[], total: number) => ({
  data,
  total,
  page: 1,
  limit: 10,
  totalPages: total === 0 ? 0 : Math.ceil(total / 10),
});

describe('QuoteRequestsController', () => {
  let controller: QuoteRequestsController;
  let createMock: jest.MockedFunction<QuoteRequestsService['create']>;
  let findAllMock: jest.MockedFunction<QuoteRequestsService['findAll']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();

    const quoteRequestsService = {
      create: createMock,
      findAll: findAllMock,
    } as unknown as QuoteRequestsService;

    controller = new QuoteRequestsController(quoteRequestsService);
  });

  describe('create', () => {
    it('debe retornar el DTO de respuesta al crear una solicitud', async () => {
      const quoteRequest = buildQuoteRequest();
      createMock.mockResolvedValue(quoteRequest);

      const dto = {
        name: quoteRequest.name,
        email: quoteRequest.email,
        phone: quoteRequest.phone,
        serviceId: quoteRequest.service.id,
        message: quoteRequest.message,
      };

      const result = await controller.create(dto);

      expect(result).toEqual({
        id: quoteRequest.id,
        status: quoteRequest.status,
        createdAt: quoteRequest.createdAt,
        message: 'Solicitud de cotización creada correctamente.',
      });
      expect(createMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('debe listar solicitudes con los filtros de la query', async () => {
      const quoteRequests = [buildQuoteRequest()];
      const paginatedResponse = buildPaginatedResponse(quoteRequests, 1);
      findAllMock.mockResolvedValue(paginatedResponse);

      const query = Object.assign(new FindQuoteRequestsQueryDto(), {
        page: 1,
        limit: 10,
        status: QuoteRequestStatus.RESPONDED,
      });

      const result = await controller.findAll(query);

      expect(result).toBe(paginatedResponse);
      expect(findAllMock).toHaveBeenCalledWith(query, {
        status: QuoteRequestStatus.RESPONDED,
      });
    });
  });
});
