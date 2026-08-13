import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
// supertest is consumed through CommonJS here to match the project's tsconfig/runtime setup.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { App } from 'supertest/types';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { QuoteRequestsController } from './quote-requests.controller';
import { QuoteRequestsService } from './quote-requests.service';
import { QuoteRequest, QuoteRequestStatus } from './entities/quote-request.entity';
import { Service } from '../services/entities/service.entity';

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

describe('QuoteRequestsController (integration)', () => {
  let app: INestApplication<App>;
  let quoteRequestRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let serviceRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    quoteRequestRepository = {
      create: jest.fn((input) => Object.assign(new QuoteRequest(), input)),
      save: jest.fn((quoteRequest: QuoteRequest) =>
        Promise.resolve(
          Object.assign(quoteRequest, {
            id: quoteRequest.id ?? 'b2c3d4e5-f6a7-4890-bcde-f1234567890a',
            createdAt:
              quoteRequest.createdAt ?? new Date('2026-01-01T10:00:00.000Z'),
            updatedAt:
              quoteRequest.updatedAt ?? new Date('2026-01-01T10:00:00.000Z'),
          }),
        ),
      ),
    };

    serviceRepository = {
      findOne: jest.fn().mockResolvedValue(buildService()),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QuoteRequestsController],
      providers: [
        QuoteRequestsService,
        {
          provide: getRepositoryToken(QuoteRequest),
          useValue: quoteRequestRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: serviceRepository,
        },
      ],
    })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: {
          target: false,
          value: false,
        },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it.each([
    {
      name: 'María Pérez',
      email: 'maria.perez@example.com',
      phone: '+54 9 11 1234 5678',
      serviceId: '123e4567-e89b-42d3-a456-426614174000',
      message: 'Necesitamos una cotización para instalar un aire acondicionado.',
    },
    {
      name: 'José Álvarez',
      email: 'jose.alvarez@example.com',
      phone: '+1 (555) 123-4567',
      serviceId: '123e4567-e89b-42d3-a456-426614174000',
      message: 'Presupuesto para obra comercial con instalación y mantenimiento.',
    },
    {
      name: 'Ana María Núñez',
      email: 'ana.nunez@example.com',
      phone: '1123456789',
      serviceId: '123e4567-e89b-42d3-a456-426614174000',
      message: 'x'.repeat(1000),
    },
  ])('crea una solicitud válida con datos variados', async (body) => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/quote-requests')
      .send(body)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: QuoteRequestStatus.NEW,
        message: 'Solicitud de cotización creada correctamente.',
      }),
    );
    expect(serviceRepository.findOne).toHaveBeenCalledWith({
      where: { id: body.serviceId, deletedAt: expect.any(Object) },
    });
    expect(quoteRequestRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: body.message,
        service: expect.objectContaining({ id: body.serviceId }),
        status: QuoteRequestStatus.NEW,
      }),
    );
  });

  it('devuelve un 400 con formato estándar cuando falta un campo requerido', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/quote-requests')
      .send({
        email: 'maria.perez@example.com',
        phone: '+54 9 11 1234 5678',
        serviceId: '123e4567-e89b-42d3-a456-426614174000',
        message: 'Necesitamos una cotización para instalar un aire acondicionado.',
      })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        path: '/api/v1/quote-requests',
        method: 'POST',
      }),
    );
    expect(Array.isArray(response.body.message)).toBe(true);
    expect(response.body.message).toContain('El nombre es obligatorio.');
  });

  it('devuelve un 500 amigable si falla el guardado', async () => {
    serviceRepository.findOne.mockResolvedValue(buildService());
    quoteRequestRepository.save.mockRejectedValue(new Error('db connection lost'));

    const response = await request(app.getHttpServer())
      .post('/api/v1/quote-requests')
      .send({
        name: 'María Pérez',
        email: 'maria.perez@example.com',
        phone: '+54 9 11 1234 5678',
        serviceId: '123e4567-e89b-42d3-a456-426614174000',
        message: 'Necesitamos una cotización para instalar un aire acondicionado.',
      })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        path: '/api/v1/quote-requests',
        method: 'POST',
      }),
    );
  });
});