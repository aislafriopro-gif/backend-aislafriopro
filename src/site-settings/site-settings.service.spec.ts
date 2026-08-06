import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/pagination';
import { FindSiteSettingsQueryDto } from './dto/find-site-settings-query.dto';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSetting, SiteSettingType } from './entities/site-setting.entity';
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

describe('SiteSettingsService', () => {
  let siteSettingsService: SiteSettingsService;
  let repository: {
    create: jest.Mock<SiteSetting, [Partial<SiteSetting>]>;
    save: jest.Mock<Promise<SiteSetting>, [SiteSetting]>;
    findAndCount: jest.Mock<Promise<[SiteSetting[], number]>, [unknown]>;
    findOne: jest.Mock<Promise<SiteSetting | null>, [unknown]>;
    update: jest.Mock<Promise<unknown>, [string, UpdateSiteSettingDto]>;
    findOneByOrFail: jest.Mock<Promise<SiteSetting>, [Partial<SiteSetting>]>;
    delete: jest.Mock<Promise<unknown>, [string]>;
  };

  beforeEach(() => {
    jest.resetAllMocks();

    repository = {
      create: jest.fn((input: Partial<SiteSetting>) =>
        Object.assign(new SiteSetting(), input),
      ),
      save: jest.fn((setting: SiteSetting) =>
        Promise.resolve(
          Object.assign(setting, {
            id: setting.id ?? 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          }),
        ),
      ),
      findAndCount: jest
        .fn<Promise<[SiteSetting[], number]>, [unknown]>()
        .mockResolvedValue([[], 0]),
      findOne: jest.fn<Promise<SiteSetting | null>, [unknown]>(),
      update: jest
        .fn<Promise<unknown>, [string, UpdateSiteSettingDto]>()
        .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 }),
      findOneByOrFail: jest.fn<Promise<SiteSetting>, [Partial<SiteSetting>]>(),
      delete: jest
        .fn<Promise<unknown>, [string]>()
        .mockResolvedValue({ generatedMaps: [], raw: [], affected: 1 }),
    };

    siteSettingsService = new SiteSettingsService(
      repository as unknown as Repository<SiteSetting>,
    );
  });

  describe('create', () => {
    it('debe crear y persistir una configuracion', async () => {
      const dto = {
        key: 'contact.whatsapp',
        value: '+5491112345678',
        type: SiteSettingType.STRING,
        description: 'Numero de WhatsApp visible en el sitio',
      };

      repository.findOne.mockResolvedValue(null);

      const result = await siteSettingsService.create(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { key: dto.key },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalled();
      expect(result.key).toBe(dto.key);
    });

    it('debe lanzar ConflictException si la clave ya existe', async () => {
      const setting = buildSetting();
      repository.findOne.mockResolvedValue(setting);

      await expect(
        siteSettingsService.create({
          key: setting.key,
          value: setting.value,
          type: setting.type,
          description: setting.description,
        }),
      ).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('debe retornar una lista paginada ordenada por clave', async () => {
      const settings = [buildSetting(), buildSetting({ key: 'site.email' })];
      repository.findAndCount.mockResolvedValue([settings, 2]);

      const query = buildFindSiteSettingsQuery();
      const result = await siteSettingsService.findAll(query);

      expect(result).toEqual(buildPaginatedResponse(settings, 2));
      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { key: 'ASC' },
        skip: 0,
        take: 10,
      });
    });

    it('debe respetar la paginacion recibida', async () => {
      const query = buildFindSiteSettingsQuery({ page: 2, limit: 5 });

      await siteSettingsService.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar una configuracion por id', async () => {
      const setting = buildSetting();
      repository.findOne.mockResolvedValue(setting);

      const result = await siteSettingsService.findOne(setting.id);

      expect(result).toBe(setting);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: setting.id },
      });
    });

    it('debe lanzar NotFoundException si la configuracion no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(siteSettingsService.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('debe actualizar una configuracion existente y retornarla', async () => {
      const setting = buildSetting();
      const dto: UpdateSiteSettingDto = { value: '+5491198765432' };
      const updated = buildSetting({ id: setting.id, value: dto.value! });

      repository.findOne.mockResolvedValueOnce(setting);
      repository.findOneByOrFail.mockResolvedValue(updated);

      const result = await siteSettingsService.update(setting.id, dto);

      expect(repository.update).toHaveBeenCalledWith(setting.id, dto);
      expect(repository.findOneByOrFail).toHaveBeenCalledWith({
        id: setting.id,
      });
      expect(result).toBe(updated);
    });

    it('debe validar clave duplicada si se cambia la key', async () => {
      const setting = buildSetting({ key: 'contact.whatsapp' });
      const existingSetting = buildSetting({
        id: 'other-setting',
        key: 'site.email',
      });

      repository.findOne
        .mockResolvedValueOnce(setting)
        .mockResolvedValueOnce(existingSetting);

      await expect(
        siteSettingsService.update(setting.id, { key: existingSetting.key }),
      ).rejects.toThrow(ConflictException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si la configuracion no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        siteSettingsService.update('no-existe', { value: 'nuevo' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar una configuracion existente', async () => {
      const setting = buildSetting();
      repository.findOne.mockResolvedValue(setting);

      await expect(
        siteSettingsService.remove(setting.id),
      ).resolves.toBeUndefined();

      expect(repository.delete).toHaveBeenCalledWith(setting.id);
    });

    it('debe lanzar NotFoundException si la configuracion no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(siteSettingsService.remove('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
