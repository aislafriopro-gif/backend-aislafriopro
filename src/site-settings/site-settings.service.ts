import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CreateSiteSettingDto } from './dto/create-site-setting.dto';
import { FindSiteSettingsQueryDto } from './dto/find-site-settings-query.dto';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSetting } from './entities/site-setting.entity';

@Injectable()
export class SiteSettingsService {
  constructor(
    @InjectRepository(SiteSetting)
    private readonly siteSettingRepository: Repository<SiteSetting>,
  ) {}

  async create(dto: CreateSiteSettingDto): Promise<SiteSetting> {
    const existingSetting = await this.siteSettingRepository.findOne({
      where: { key: dto.key },
    });

    if (existingSetting) {
      throw new ConflictException(
        `Site setting with key "${dto.key}" already exists`,
      );
    }

    const setting = this.siteSettingRepository.create(dto);
    return this.siteSettingRepository.save(setting);
  }

  async findAll(
    query: FindSiteSettingsQueryDto,
  ): Promise<PaginatedResponse<SiteSetting>> {
    const [data, total] = await this.siteSettingRepository.findAndCount({
      order: { key: 'ASC' },
      skip: query.offset,
      take: query.limit,
    });

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<SiteSetting> {
    const setting = await this.siteSettingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException(`Site setting with id "${id}" not found`);
    }

    return setting;
  }

  async update(id: string, dto: UpdateSiteSettingDto): Promise<SiteSetting> {
    const setting = await this.siteSettingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException(`Site setting with id "${id}" not found`);
    }

    if (dto.key && dto.key !== setting.key) {
      const existingSetting = await this.siteSettingRepository.findOne({
        where: { key: dto.key },
      });

      if (existingSetting) {
        throw new ConflictException(
          `Site setting with key "${dto.key}" already exists`,
        );
      }
    }

    await this.siteSettingRepository.update(id, dto);
    return this.siteSettingRepository.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<void> {
    const setting = await this.siteSettingRepository.findOne({ where: { id } });

    if (!setting) {
      throw new NotFoundException(`Site setting with id "${id}" not found`);
    }

    await this.siteSettingRepository.delete(id);
  }
}
