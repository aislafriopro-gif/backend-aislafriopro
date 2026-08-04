import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    await this.ensureSlugAvailable(createServiceDto.slug);
    const service = this.serviceRepository.create(createServiceDto);
    return this.serviceRepository.save(service);
  }

  async findAll(
    query: FindServicesQueryDto,
  ): Promise<PaginatedResponse<Service>> {
    const where: any = {
      deletedAt: IsNull(),
      isActive: true,
    };

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.serviceRepository.findAndCount({
      where,
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });
    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findAllAdmin(
    query: FindServicesQueryDto,
  ): Promise<PaginatedResponse<Service>> {
    const where: any = {};

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }

    const [data, total] = await this.serviceRepository.findAndCount({
      where,
      withDeleted: true,
      order: { createdAt: 'DESC' },
      skip: query.offset,
      take: query.limit,
    });
    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, isActive: true, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    if (updateServiceDto.slug !== undefined) {
      await this.ensureSlugAvailable(updateServiceDto.slug, id);
    }
    await this.serviceRepository.update(id, updateServiceDto);
    return this.serviceRepository.findOneByOrFail({ id });
  }

  async remove(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    await this.serviceRepository.softDelete(id);
  }

  async restore(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    if (service.deletedAt === null || service.deletedAt === undefined) {
      throw new ConflictException(`Service with id "${id}" is not deleted`);
    }

    await this.ensureSlugAvailable(service.slug, id);
    service.deletedAt = null;
    if (!service.isActive) {
      service.isActive = true;
    }
    return this.serviceRepository.save(service);
  }

  private async ensureSlugAvailable(slug: string, excludedId?: string): Promise<void> {
    const existingService = await this.serviceRepository.findOne({
      where: { slug, isActive: true, deletedAt: IsNull() },
    });

    if (existingService && existingService.id !== excludedId) {
      throw new ConflictException(`Service slug "${slug}" is already in use`);
    }
  }
}
