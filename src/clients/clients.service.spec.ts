import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  QuoteRequest,
  QuoteRequestStatus,
} from '../quote-requests/entities/quote-request.entity';
import { Service } from '../services/entities/service.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Client } from './entities/client.entity';
import { ClientsService } from './clients.service';
import { PaginationParamsDto } from '../common/pagination';

describe('ClientsService', () => {
  let clientsService: ClientsService;

  let findOneClientMock: jest.Mock<Promise<Client | null>, [unknown]>;
  let findAndCountClientMock: jest.Mock<Promise<[Client[], number]>, [unknown]>;
  let findQuoteRequestsMock: jest.Mock<Promise<QuoteRequest[]>, [unknown]>;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'user-id',
      name: 'Cliente Prueba',
      email: 'cliente@example.com',
      password: 'hashed-password',
      phone: '+54 9 11 1234-5678',
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      sessions: [],
      auditLogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as User;

  const buildClient = (overrides: Partial<Client> = {}): Client => ({
    id: 'client-id',
    userId: 'user-id',
    user: buildUser(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const buildService = (overrides: Partial<Service> = {}): Service =>
    ({
      id: 'service-id',
      name: 'Instalación',
      slug: 'instalacion',
      shortDescription: 'Servicio de instalación',
      ...overrides,
    }) as Service;

  beforeEach(() => {
    findOneClientMock = jest.fn<Promise<Client | null>, [unknown]>();
    findAndCountClientMock = jest.fn<Promise<[Client[], number]>, [unknown]>();
    findQuoteRequestsMock = jest.fn<Promise<QuoteRequest[]>, [unknown]>();

    const clientRepository = {
      findOne: findOneClientMock,
      findAndCount: findAndCountClientMock,
    } as unknown as Repository<Client>;

    const quoteRequestRepository = {
      find: findQuoteRequestsMock,
    } as unknown as Repository<QuoteRequest>;

    clientsService = new ClientsService(
      clientRepository,
      quoteRequestRepository,
    );
  });

  const buildQuoteRequest = (
    overrides: Partial<QuoteRequest> = {},
  ): QuoteRequest => ({
    id: 'quote-request-id',
    name: 'Cliente Prueba',
    email: 'cliente@example.com',
    phone: '+54 9 11 1234-5678',
    service: buildService(),
    message: 'Necesito cotizar aislación para una cámara.',
    status: QuoteRequestStatus.NEW,
    notes: [],
    createdAt: new Date('2026-08-20T13:46:06.791Z'),
    updatedAt: new Date(),
    ...overrides,
  });

  it('debe listar clientes paginados para admin', async () => {
    const pagination = new PaginationParamsDto();
    pagination.page = 1;
    pagination.limit = 10;

    const clients = [
      buildClient({ id: 'client-1' }),
      buildClient({
        id: 'client-2',
        userId: 'user-2',
        user: buildUser({
          id: 'user-2',
          name: 'Cliente Dos',
          email: 'cliente2@example.com',
        }),
      }),
    ];

    findAndCountClientMock.mockResolvedValue([clients, 2]);

    const result = await clientsService.findAll(pagination);

    expect(findAndCountClientMock).toHaveBeenCalledWith({
      relations: { user: true },
      order: { createdAt: 'DESC' },
      skip: 0,
      take: 10,
    });

    expect(result).toEqual({
      data: [
        {
          id: 'client-1',
          name: 'Cliente Prueba',
          email: 'cliente@example.com',
          phone: '+54 9 11 1234-5678',
        },
        {
          id: 'client-2',
          name: 'Cliente Dos',
          email: 'cliente2@example.com',
          phone: '+54 9 11 1234-5678',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('debe devolver detalle de un cliente por id para admin', async () => {
    const client = buildClient();
    const quoteRequest = buildQuoteRequest();

    findOneClientMock.mockResolvedValue(client);
    findQuoteRequestsMock.mockResolvedValue([quoteRequest]);

    const result = await clientsService.findOne('client-id');

    expect(findOneClientMock).toHaveBeenCalledWith({
      where: { id: 'client-id' },
      relations: { user: true },
    });

    expect(result.client.id).toBe(client.id);
    expect(result.quoteRequests).toHaveLength(1);
    expect(result.workOrders).toEqual([]);
  });

  it('debe lanzar NotFoundException si admin pide un cliente inexistente', async () => {
    findOneClientMock.mockResolvedValue(null);

    await expect(clientsService.findOne('missing-client-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe devolver datos propios del cliente autenticado', async () => {
    const client = buildClient();
    const service = buildService();

    findOneClientMock.mockResolvedValue(client);
    const quoteRequest = buildQuoteRequest({ service });

    findQuoteRequestsMock.mockResolvedValue([quoteRequest]);

    const result = await clientsService.findMe('user-id');

    expect(findOneClientMock).toHaveBeenCalledWith({
      where: { userId: 'user-id' },
      relations: { user: true },
    });

    expect(findQuoteRequestsMock).toHaveBeenCalledWith({
      where: {
        email: client.user.email,
      },
      relations: {
        service: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    expect(result).toEqual({
      client: {
        id: client.id,
        name: client.user.name,
        email: client.user.email,
        phone: client.user.phone,
      },
      quoteRequests: [
        {
          id: quoteRequest.id,
          serviceName: service.name,
          message: quoteRequest.message,
          status: quoteRequest.status,
          createdAt: quoteRequest.createdAt,
        },
      ],
      workOrders: [],
    });
  });

  it('debe lanzar NotFoundException si el usuario autenticado no tiene perfil Client', async () => {
    findOneClientMock.mockResolvedValue(null);

    await expect(clientsService.findMe('admin-user-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
