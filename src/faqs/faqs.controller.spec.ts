import { PaginatedResponse } from '../common/pagination';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FindFaqsQueryDto } from './dto/find-faqs-query.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';
import { FaqsController } from './faqs.controller';
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

describe('FaqsController', () => {
  let faqsController: FaqsController;

  let createMock: jest.MockedFunction<FaqsService['create']>;
  let findAllMock: jest.MockedFunction<FaqsService['findAll']>;
  let findAllAdminMock: jest.MockedFunction<FaqsService['findAllAdmin']>;
  let findOneMock: jest.MockedFunction<FaqsService['findOne']>;
  let updateMock: jest.MockedFunction<FaqsService['update']>;
  let removeMock: jest.MockedFunction<FaqsService['remove']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findAllAdminMock = jest.fn();
    findOneMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();

    const faqsService = {
      create: createMock,
      findAll: findAllMock,
      findAllAdmin: findAllAdminMock,
      findOne: findOneMock,
      update: updateMock,
      remove: removeMock,
    } as unknown as FaqsService;

    faqsController = new FaqsController(faqsService);
  });

  describe('create', () => {
    it('debe crear una pregunta frecuente y retornarla', async () => {
      const dto: CreateFaqDto = {
        question: 'Realizan trabajos industriales?',
        answer: 'Si, realizamos trabajos industriales.',
        displayOrder: 1,
      };
      const created = buildFaq(dto);
      createMock.mockResolvedValue(created);

      const result = await faqsController.create(dto);

      expect(result).toBe(created);
      expect(createMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('debe delegar el listado publico al servicio', async () => {
      const faq = buildFaq();
      const paginated = buildPaginatedResponse<Faq>([faq], 1);
      findAllMock.mockResolvedValue(paginated);

      const query = buildFindFaqsQuery();
      const result = await faqsController.findAll(query);

      expect(result).toBe(paginated);
      expect(findAllMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findAllAdmin', () => {
    it('debe delegar el listado admin al servicio', async () => {
      const faq = buildFaq({ isActive: false });
      const paginated = buildPaginatedResponse<Faq>([faq], 1);
      findAllAdminMock.mockResolvedValue(paginated);

      const query = buildFindFaqsQuery();
      const result = await faqsController.findAllAdmin(query);

      expect(result).toBe(paginated);
      expect(findAllAdminMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debe obtener una pregunta frecuente por id', async () => {
      const faq = buildFaq();
      findOneMock.mockResolvedValue(faq);

      const result = await faqsController.findOne(faq.id);

      expect(result).toBe(faq);
      expect(findOneMock).toHaveBeenCalledWith(faq.id);
    });
  });

  describe('update', () => {
    it('debe actualizar una pregunta frecuente y retornarla', async () => {
      const faq = buildFaq();
      const dto: UpdateFaqDto = { question: 'Nueva pregunta?' };
      updateMock.mockResolvedValue(faq);

      const result = await faqsController.update(faq.id, dto);

      expect(result).toBe(faq);
      expect(updateMock).toHaveBeenCalledWith(faq.id, dto);
    });
  });

  describe('remove', () => {
    it('debe eliminar una pregunta frecuente por id', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      removeMock.mockResolvedValue(undefined);

      await expect(faqsController.remove(id)).resolves.toBeUndefined();
      expect(removeMock).toHaveBeenCalledWith(id);
    });
  });
});
