import { PaginatedResponse } from '../common/pagination';
import { CreateSiteSettingDto } from './dto/create-site-setting.dto';
import { FindSiteSettingsQueryDto } from './dto/find-site-settings-query.dto';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSetting, SiteSettingType } from './entities/site-setting.entity';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

const buildSetting = (overrides: Partial<SiteSetting> = {}): SiteSetting => ({
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  key: 'contact.whatsapp',
  value: '+5491112345678',
  type: SiteSettingType.STRING,
  description: 'Numero de WhatsApp visible en el sitio',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildFindSiteSettingsQuery = (
  overrides: Partial<FindSiteSettingsQueryDto> = {},
): FindSiteSettingsQueryDto => {
  const dto = new FindSiteSettingsQueryDto();
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

describe('SiteSettingsController', () => {
  let controller: SiteSettingsController;

  let createMock: jest.MockedFunction<SiteSettingsService['create']>;
  let findAllMock: jest.MockedFunction<SiteSettingsService['findAll']>;
  let findOneMock: jest.MockedFunction<SiteSettingsService['findOne']>;
  let updateMock: jest.MockedFunction<SiteSettingsService['update']>;
  let removeMock: jest.MockedFunction<SiteSettingsService['remove']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findOneMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();

    const service = {
      create: createMock,
      findAll: findAllMock,
      findOne: findOneMock,
      update: updateMock,
      remove: removeMock,
    } as unknown as SiteSettingsService;

    controller = new SiteSettingsController(service);
  });

  describe('create', () => {
    it('debe crear una configuracion y retornarla', async () => {
      const dto: CreateSiteSettingDto = {
        key: 'contact.whatsapp',
        value: '+5491112345678',
        type: SiteSettingType.STRING,
        description: 'Numero de WhatsApp visible en el sitio',
      };
      const created = buildSetting(dto);

      createMock.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(result).toBe(created);
      expect(createMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('debe delegar el listado al servicio', async () => {
      const setting = buildSetting();
      const paginated = buildPaginatedResponse<SiteSetting>([setting], 1);

      findAllMock.mockResolvedValue(paginated);

      const query = buildFindSiteSettingsQuery();
      const result = await controller.findAll(query);

      expect(result).toBe(paginated);
      expect(findAllMock).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('debe obtener una configuracion por id', async () => {
      const setting = buildSetting();

      findOneMock.mockResolvedValue(setting);

      const result = await controller.findOne(setting.id);

      expect(result).toBe(setting);
      expect(findOneMock).toHaveBeenCalledWith(setting.id);
    });
  });

  describe('update', () => {
    it('debe actualizar una configuracion y retornarla', async () => {
      const setting = buildSetting();
      const dto: UpdateSiteSettingDto = { value: '+5491198765432' };

      updateMock.mockResolvedValue(setting);

      const result = await controller.update(setting.id, dto);

      expect(result).toBe(setting);
      expect(updateMock).toHaveBeenCalledWith(setting.id, dto);
    });
  });

  describe('remove', () => {
    it('debe eliminar una configuracion por id', async () => {
      const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      removeMock.mockResolvedValue(undefined);

      await expect(controller.remove(id)).resolves.toBeUndefined();
      expect(removeMock).toHaveBeenCalledWith(id);
    });
  });
});
