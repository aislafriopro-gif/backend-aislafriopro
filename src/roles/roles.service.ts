import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from './entities/roles.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';

@Injectable()
export class RolesService implements OnModuleInit {

    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}


    async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const defaultRoles:RoleName[] = [RoleName.ADMIN, RoleName.USER, RoleName.CLIENT, RoleName.TECHNICIAN];

    for (const name of defaultRoles) {
      const exists = await this.roleRepository.findOneBy({ name });
      if (!exists) {
        await this.roleRepository.save(this.roleRepository.create({ name }));
      }
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role with id "${id}" not found`);
    }
    await this.roleRepository.softDelete(id);
  }

  async restore(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!role) {
      throw new NotFoundException(`Role with id "${id}" not found`);
    }
    if (role.deletedAt === null || role.deletedAt === undefined) {
      throw new ConflictException(`Role with id "${id}" is not deleted`);
    }
    await this.roleRepository.restore(id);
    return this.roleRepository.findOneByOrFail({ id });
  }

  async findAllWithDeleted(
    pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<Role>> {
    const [data, total] = await this.roleRepository.findAndCount({
      withDeleted: true,
      order: { createdAt: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return buildPaginatedResponse(data, total, pagination.page, pagination.limit);
  }
}