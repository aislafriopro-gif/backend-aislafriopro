import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/pagination';
import { FindFaqsQueryDto } from './dto/find-faqs-query.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';
import { FaqsService } from './faqs.service';

const buildFaq = (overrides: Partial<Faq> = {}): Faq => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  question: 'Realizan trabajos industriales?',
  answer: 'Si, realizamos trabajos industriales y comerciales.',
  displayOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildFindFaqsQuery = (
  overrides: Partial<FindFaqsQueryDto> = {},
): FindFaqsQueryDto => {
  const dto = new FindFaqsQueryDto();
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

describe('FaqsService', () => {
  let faqsService: FaqsService;
  let faqRepository: {
    create: jest.Mock<Faq, [Partial<Faq>]>;
    save: jest.Mock<Promise<Faq>, [Faq]>;
    findAndCount: jest.Mock<Promise<[Faq[], number]>, [unknown]>;
    findOne: jest.Mock<Promise<Faq | null>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [string, UpdateFaqDto]>;
    findOneByOrFail: jest.Mock<Promise<Faq>, [Partial<Faq>]>;
    delete: jest.Mock<Promise<unknown>, [string]>;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    faqRepository = {
      create: jest.fn((input: Partial<Faq>) => Object.assign(new Faq(), input)),
      save: jest.fn((faq: Faq) =>
        Promise.resolve(
          Object.assign(faq, {
            id: faq.id ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        ),
      ),
      findAndCount: jest
        .fn<Promise<[Faq[], number]>, [unknown]>()
        .mockResolvedValue([[], 0]),
      findOne: jest.fn<Promise<Faq | null>, [unknown]>(),
      update: jest
        .fn<Promise<unknown>, [string, UpdateFaqDto]>()
        .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 }),
      findOneByOrFail: jest.fn<Promise<Faq>, [Partial<Faq>]>(),
      delete: jest
        .fn<Promise<unknown>, [string]>()
        .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 }),
    };

    faqsService = new FaqsService(faqRepository as unknown as Repository<Faq>);
  });

  describe('create', () => {
    it('debe crear y persistir una pregunta frecuente', async () => {
      const dto = {
        question: 'Realizan trabajos industriales?',
        answer: 'Si, realizamos trabajos industriales.',
        displayOrder: 1,
        isActive: true,
      };

      const result = await faqsService.create(dto);

      expect(faqRepository.create).toHaveBeenCalledWith(dto);
      expect(faqRepository.save).toHaveBeenCalled();
      expect(result.question).toBe(dto.question);
      expect(result.answer).toBe(dto.answer);
      expect(result.displayOrder).toBe(dto.displayOrder);
    });
  });

  describe('findAll', () => {
    it('debe retornar una lista paginada de preguntas activas', async () => {
      const faqs = [buildFaq({ id: 'faq-1' }), buildFaq({ id: 'faq-2' })];
      faqRepository.findAndCount.mockResolvedValue([faqs, 2]);

      const query = buildFindFaqsQuery();
      const result = await faqsService.findAll(query);

      expect(result).toEqual(buildPaginatedResponse(faqs, 2));
      expect(faqRepository.findAndCount).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { displayOrder: 'ASC', createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('debe respetar la paginacion recibida', async () => {
      const query = buildFindFaqsQuery({ page: 2, limit: 5 });

      await faqsService.findAll(query);

      expect(faqRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findAllAdmin', () => {
    it('debe listar todas las preguntas frecuentes', async () => {
      const faqs = [buildFaq(), buildFaq({ isActive: false })];
      faqRepository.findAndCount.mockResolvedValue([faqs, 2]);

      const query = buildFindFaqsQuery();
      const result = await faqsService.findAllAdmin(query);

      expect(result).toEqual(buildPaginatedResponse(faqs, 2));
      expect(faqRepository.findAndCount).toHaveBeenCalledWith({
        order: { displayOrder: 'ASC', createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar una pregunta activa por id', async () => {
      const faq = buildFaq();
      faqRepository.findOne.mockResolvedValue(faq);

      const result = await faqsService.findOne(faq.id);

      expect(result).toBe(faq);
      expect(faqRepository.findOne).toHaveBeenCalledWith({
        where: { id: faq.id, isActive: true },
      });
    });

    it('debe lanzar NotFoundException si la pregunta no existe', async () => {
      faqRepository.findOne.mockResolvedValue(null);

      await expect(faqsService.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(faqsService.findOne('no-existe')).rejects.toThrow(
        'Faq with id "no-existe" not found',
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una pregunta existente y retornarla', async () => {
      const faq = buildFaq();
      const dto: UpdateFaqDto = { question: 'Nueva pregunta?' };
      const updatedFaq = buildFaq({ id: faq.id, question: dto.question! });

      faqRepository.findOne.mockResolvedValue(faq);
      faqRepository.findOneByOrFail.mockResolvedValue(updatedFaq);

      const result = await faqsService.update(faq.id, dto);

      expect(faqRepository.update).toHaveBeenCalledWith(faq.id, dto);
      expect(faqRepository.findOneByOrFail).toHaveBeenCalledWith({
        id: faq.id,
      });
      expect(result).toBe(updatedFaq);
    });

    it('debe lanzar NotFoundException si la pregunta no existe', async () => {
      faqRepository.findOne.mockResolvedValue(null);

      await expect(
        faqsService.update('no-existe', { question: 'Nueva pregunta?' }),
      ).rejects.toThrow(NotFoundException);
      expect(faqRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar una pregunta existente', async () => {
      const faq = buildFaq();
      faqRepository.findOne.mockResolvedValue(faq);

      await expect(faqsService.remove(faq.id)).resolves.toBeUndefined();

      expect(faqRepository.delete).toHaveBeenCalledWith(faq.id);
    });

    it('debe lanzar NotFoundException si la pregunta no existe', async () => {
      faqRepository.findOne.mockResolvedValue(null);

      await expect(faqsService.remove('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      expect(faqRepository.delete).not.toHaveBeenCalled();
    });
  });
});
