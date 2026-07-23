import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async remove(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });
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
    await this.serviceRepository.restore(id);
    return this.serviceRepository.findOneByOrFail({ id });
  }

  async findAllWithDeleted(
    pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<Service>> {
    const [data, total] = await this.serviceRepository.findAndCount({
      withDeleted: true,
      order: { createdAt: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return buildPaginatedResponse(data, total, pagination.page, pagination.limit);
  }
}
