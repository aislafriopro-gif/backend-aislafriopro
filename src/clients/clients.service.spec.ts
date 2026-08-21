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

describe('ClientsService', () => {
  let clientsService: ClientsService;

  let findOneClientMock: jest.Mock<Promise<Client | null>, [unknown]>;
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
    findQuoteRequestsMock = jest.fn<Promise<QuoteRequest[]>, [unknown]>();

    const clientRepository = {
      findOne: findOneClientMock,
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
