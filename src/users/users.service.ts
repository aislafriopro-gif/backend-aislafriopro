import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async remove(id: string): Promise<void> {
    // findOne excluye soft-deleted por defecto; si no existe o ya está borrado, 404
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    await this.userRepository.softDelete(id);
  }

  async restore(id: string): Promise<User> {
    // Con withDeleted para poder operar sobre registros soft-deleted
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    if (user.deletedAt === null || user.deletedAt === undefined) {
      throw new ConflictException(`User with id "${id}" is not deleted`);
    }
    await this.userRepository.restore(id);
    return this.userRepository.findOneByOrFail({ id });
  }

  async findAllWithDeleted(
    pagination: PaginationParamsDto,
  ): Promise<PaginatedResponse<User>> {
    const [data, total] = await this.userRepository.findAndCount({
      withDeleted: true,
      relations: { role: true },
      order: { createdAt: 'DESC' },
      skip: pagination.offset,
      take: pagination.limit,
    });
    return buildPaginatedResponse(data, total, pagination.page, pagination.limit);
  }
}
