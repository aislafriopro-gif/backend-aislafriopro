import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { IsNull, Repository } from 'typeorm';
import { Service } from '../services/entities/service.entity';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QuoteRequest } from './entities/quote-request.entity';
import { QuoteRequestsService } from './quote-requests.service';

const buildValidDto = (
  overrides: Partial<CreateQuoteRequestDto> = {},
): CreateQuoteRequestDto =>
  Object.assign(new CreateQuoteRequestDto(), {
    name: 'María Pérez',
    email: 'maria.perez@example.com',
    phone: '+54 9 11 1234-5678',
    serviceId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    message: 'Necesitamos una cotización para instalar un aire acondicionado.',
    ...overrides,
  });

describe('QuoteRequestsService', () => {
  let quoteRequestRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let serviceRepository: {
    findOne: jest.Mock;
  };
  let quoteRequestsService: QuoteRequestsService;

  beforeEach(() => {
    jest.resetAllMocks();

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
    };

    serviceRepository = {
      findOne: jest.fn(),
    };

    quoteRequestsService = new QuoteRequestsService(
      quoteRequestRepository as unknown as Repository<QuoteRequest>,
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
      ['serviceId', 'serviceId'],
      ['message', 'message'],
    ])('debe exigir el campo %s cuando falta', async (_, property) => {
      const dto = buildValidDto({
        [property]: undefined,
      } as Partial<CreateQuoteRequestDto>);

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === property)).toBe(true);
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
        } as Partial<CreateQuoteRequestDto>);

        const errors = await validate(dto);

        expect(errors.some((error) => error.property === property)).toBe(true);
      },
    );

    it('debe rechazar un serviceId con UUID inválido', async () => {
      const dto = buildValidDto({ serviceId: 'not-a-uuid' });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === 'serviceId')).toBe(true);
    });
  });

  describe('create', () => {
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
});
