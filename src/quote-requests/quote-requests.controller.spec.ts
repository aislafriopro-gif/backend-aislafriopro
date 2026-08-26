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
  let findOneMock: jest.MockedFunction<QuoteRequestsService['findOne']>;
  let addNoteMock: jest.MockedFunction<QuoteRequestsService['addNote']>;
  let updateStatusMock: jest.MockedFunction<QuoteRequestsService['updateStatus']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findOneMock = jest.fn();
    addNoteMock = jest.fn();
    updateStatusMock = jest.fn();

    const quoteRequestsService = {
      create: createMock,
      findAll: findAllMock,
      findOne: findOneMock,
      addNote: addNoteMock,
      updateStatus: updateStatusMock,
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
        serviceId: quoteRequest.service?.id ?? '123e4567-e89b-42d3-a456-426614174000',
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
        status: QuoteRequestStatus.RESOLVED,
      });

      const result = await controller.findAll(query);

      expect(result).toBe(paginatedResponse);
      expect(findAllMock).toHaveBeenCalledWith(query, {
        status: QuoteRequestStatus.RESOLVED,
      });
    });
  });

  describe('findOne', () => {
    it('debe devolver la solicitud por id', async () => {
      const quoteRequest = buildQuoteRequest();
      findOneMock.mockResolvedValue(quoteRequest);

      const result = await controller.findOne(quoteRequest.id);

      expect(result).toBe(quoteRequest);
      expect(findOneMock).toHaveBeenCalledWith(quoteRequest.id);
    });
  });

  describe('addNote', () => {
    it('debe crear una nota para la solicitud', async () => {
      const quoteRequest = buildQuoteRequest();
      const note = {
        id: '8f4f3a0d-8a49-4d5f-a20d-9f091d2e8d10',
        note: 'Se requiere revisión técnica del cliente.',
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
      };
      addNoteMock.mockResolvedValue(note as any);

      const result = await controller.addNote(quoteRequest.id, {
        content: note.note,
      });

      expect(result).toEqual({
        id: note.id,
        content: note.note,
        createdAt: note.createdAt,
        message: 'Nota creada',
      });
      expect(addNoteMock).toHaveBeenCalledWith(quoteRequest.id, note.note);
    });
  });

  describe('updateStatus', () => {
    it('debe actualizar el estado de la solicitud', async () => {
      const quoteRequest = buildQuoteRequest({
        status: QuoteRequestStatus.IN_PROGRESS,
      });
      updateStatusMock.mockResolvedValue(quoteRequest);

      const dto = { status: QuoteRequestStatus.IN_PROGRESS };
      const result = await controller.updateStatus(quoteRequest.id, dto);

      expect(result).toBe(quoteRequest);
      expect(updateStatusMock).toHaveBeenCalledWith(
        quoteRequest.id,
        QuoteRequestStatus.IN_PROGRESS,
      );
    });
  });
});
