import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role, RoleName } from '../roles/entities/roles.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_PUBLIC_FIELDS: (keyof User)[] = [
  'id',
  'name',
  'email',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

const BCRYPT_SALT_ROUNDS = 10;

interface RequestUser {
  userId: string;
  email: string;
  role: RoleName;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
      withDeleted: true,
    });
    if (existingUser) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const role = await this.roleRepository.findOneBy({ name: dto.roleName });
    if (!role) {
      throw new NotFoundException(`Role with name "${dto.roleName}" not found`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);
    return this.findOne(savedUser.id);
  }

  async findAll(
    pagination: PaginationParamsDto,
    filters?: { role?: RoleName; isActive?: boolean },
  ): Promise<PaginatedResponse<User>> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .select(USER_PUBLIC_FIELDS.map((field) => `user.${field}`))
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.createdAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit);

    if (filters?.role) {
      query.andWhere('role.name = :roleName', { roleName: filters.role });
    }

    if (filters?.isActive === false) {
      query.andWhere('user.deletedAt IS NOT NULL');
    } else {
      query.andWhere('user.deletedAt IS NULL');
    }

    const [data, total] = await query.getManyAndCount();
    return buildPaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findMe(userId: string): Promise<User> {
    return this.findOne(userId);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
      select: USER_PUBLIC_FIELDS,
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    requestUser: RequestUser,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    const isAdmin = requestUser.role === RoleName.ADMIN;
    const isOwner = requestUser.userId === id;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'No tenés permisos para actualizar este usuario',
      );
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: dto.email },
        withDeleted: true,
      });
      if (existingUser) {
        throw new ConflictException(
          `User with email "${dto.email}" already exists`,
        );
      }
    }

    await this.userRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    await this.userRepository.softDelete(id);
  }

  async restore(id: string): Promise<User> {
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
    return this.findOne(id);
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
      select: USER_PUBLIC_FIELDS,
    });
    return buildPaginatedResponse(
      data,
      total,
      pagination.page,
      pagination.limit,
    );
  }
}
