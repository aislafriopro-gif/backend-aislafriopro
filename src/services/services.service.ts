import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  IsNull,
  Repository,
} from 'typeorm';
import { Service } from './entities/service.entity';
import {
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-action.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly auditService: AuditService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const slug = this.generateSlug(createServiceDto.name);
    await this.ensureSlugAvailable(slug);

    return this.serviceRepository.manager.transaction(async (manager) => {
      const service = this.serviceRepository.create({
        ...createServiceDto,
        slug,
      });
      const saved = await manager.save(service);
      if (saved.isActive) {
        await this.moveToLast(
          saved.id,
          { isActive: true, deletedAt: IsNull() },
          manager,
        );
      }
      return saved;
    });
  }

  async findAll(
    query: FindServicesQueryDto,
  ): Promise<PaginatedResponse<Service>> {
    const where: FindOptionsWhere<Service> = {
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
    const where: FindOptionsWhere<Service> = {};

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

    const updateData: Partial<Service> = { ...updateServiceDto };

    if (updateServiceDto.name !== undefined) {
      const newSlug = this.generateSlug(updateServiceDto.name);
      await this.ensureSlugAvailable(newSlug, id);
      updateData.slug = newSlug;
    }

    await this.serviceRepository.update(id, updateData);
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
    await this.reorderRemaining();
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

    return this.serviceRepository.manager.transaction(async (manager) => {
      service.deletedAt = null;
      const saved = await manager.save(service);
      await this.moveToLast(saved.id, { deletedAt: IsNull() }, manager);
      return saved;
    });
  }

  async publish(
    id: string,
    userId: string,
    requestContext?: RequestContext,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    if (service.isActive) {
      throw new ConflictException(
        `Service with id "${id}" is already published`,
      );
    }

    return this.serviceRepository.manager.transaction(async (manager) => {
      service.isActive = true;
      const saved = await manager.save(service);

      await this.auditService.log({
        action: AuditAction.UPDATE,
        entityName: 'Service',
        entityId: id,
        userId,
        previousData: { isActive: false },
        newData: { isActive: true },
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      });

      await this.moveToLast(
        saved.id,
        { isActive: true, deletedAt: IsNull() },
        manager,
      );

      return saved;
    });
  }

  async unpublish(
    id: string,
    userId: string,
    requestContext?: RequestContext,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!service) {
      throw new NotFoundException(`Service with id "${id}" not found`);
    }
    if (!service.isActive) {
      throw new ConflictException(
        `Service with id "${id}" is already unpublished`,
      );
    }

    service.isActive = false;
    const saved = await this.serviceRepository.save(service);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      entityName: 'Service',
      entityId: id,
      userId,
      previousData: { isActive: true },
      newData: { isActive: false },
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    });

    return saved;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    const services = await this.serviceRepository.find({
      where: { deletedAt: IsNull() },
    });
    const activeIds = new Set(services.map((s) => s.id));

    for (const id of orderedIds) {
      if (!activeIds.has(id)) {
        throw new NotFoundException(`Service with id "${id}" not found`);
      }
    }

    await this.serviceRepository.manager.transaction(async (manager) => {
      for (let index = 0; index < orderedIds.length; index++) {
        await manager.update(Service, orderedIds[index], {
          displayOrder: index,
        });
      }
    });
  }

  private async moveToLast(
    serviceId: string,
    criteria: FindOptionsWhere<Service>,
    manager: EntityManager,
  ): Promise<void> {
    const services = await manager.find(Service, {
      where: criteria,
      order: { displayOrder: 'ASC' },
    });

    const targetIndex = services.findIndex(
      (service) => service.id === serviceId,
    );
    if (targetIndex === -1) {
      return;
    }

    const [target] = services.splice(targetIndex, 1);
    services.push(target);

    for (let index = 0; index < services.length; index++) {
      if (services[index].displayOrder !== index) {
        await manager.update(Service, services[index].id, {
          displayOrder: index,
        });
      }
    }
  }

  private generateSlug(name: string): string {
    const normalized = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return normalized || 'servicio';
  }

  private async ensureSlugAvailable(
    slug: string,
    excludedId?: string,
  ): Promise<void> {
    const existingService = await this.serviceRepository.findOne({
      where: { slug, deletedAt: IsNull() },
    });

    if (existingService && existingService.id !== excludedId) {
      throw new ConflictException(`Service slug "${slug}" is already in use`);
    }
  }

  private async reorderRemaining(): Promise<void> {
    const services = await this.serviceRepository.find({
      where: { deletedAt: IsNull() },
      order: { displayOrder: 'ASC' },
    });
    for (let i = 0; i < services.length; i++) {
      if (services[i].displayOrder !== i) {
        await this.serviceRepository.update(services[i].id, {
          displayOrder: i,
        });
      }
    }
  }
}
