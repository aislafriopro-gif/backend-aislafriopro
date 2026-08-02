import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { Role, RoleName } from '../roles/entities/roles.entity';
import {
  PaginationParamsDto,
  PaginatedResponse,
  buildPaginatedResponse,
} from '../common/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-action.entity';
import { SessionsService } from '../sessions/sessions.service';

const USER_PUBLIC_FIELDS: (keyof User)[] = [
  'id',
  'name',
  'email',
  'phone',
  'status',
  'lastLoginAt',
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

interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly auditService: AuditService,
    private readonly sessionsService: SessionsService,
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

    const defaultRole = await this.roleRepository.findOneBy({
      name: RoleName.USER,
    });
    if (!defaultRole) {
      throw new NotFoundException('Default role USER not found in catalog');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: defaultRole,
    });

    const savedUser = await this.userRepository.save(user);
    return this.findOne(savedUser.id);
  }

  async findAll(
    pagination: PaginationParamsDto,
    filters?: {
      role?: RoleName;
      isActive?: boolean;
      status?: UserStatus;
      search?: string;
    },
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

    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.isActive === false) {
      query.andWhere('user.deletedAt IS NOT NULL');
    } else {
      query.andWhere('user.deletedAt IS NULL');
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
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
    requestContext?: RequestContext,
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

    const previousData: Record<string, any> = {};
    const newData: Record<string, any> = {};

    for (const key of Object.keys(dto) as (keyof UpdateUserDto)[]) {
      const newValue = dto[key];
      if (newValue !== undefined && newValue !== user[key as keyof User]) {
        previousData[key] = user[key as keyof User];
        newData[key] = newValue;
      }
    }

    await this.userRepository.update(id, dto);

    if (Object.keys(newData).length > 0) {
      await this.auditService.log({
        action: AuditAction.UPDATE,
        entityName: 'User',
        entityId: id,
        userId: requestUser.userId,
        previousData,
        newData,
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      });
    }

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

  async assignRole(
    userId: string,
    roleId: string,
    actingUser?: RequestUser,
    requestContext?: RequestContext,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    const newRole = await this.roleRepository.findOne({
      where: { id: roleId },
    });
    if (!newRole) {
      throw new NotFoundException(`Role with id "${roleId}" not found`);
    }

    if (actingUser && actingUser.userId === userId) {
      throw new ForbiddenException(
        'Un admin no puede reasignarse su propio rol',
      );
    }

    if (user.role.name === RoleName.ADMIN && newRole.name !== RoleName.ADMIN) {
      const activeAdminsCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.name = :roleName', { roleName: RoleName.ADMIN })
        .andWhere('user.deletedAt IS NULL')
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
        .getCount();

      if (activeAdminsCount <= 1) {
        throw new ConflictException(
          'No se puede cambiar el rol del último admin activo del sistema',
        );
      }

      // await this.sessionsService.revokeAllByUser(userId);
    }

    const previousRoleName = user.role.name;
    await this.userRepository.update(userId, { role: newRole });

    if (actingUser) {
      await this.auditService.log({
        action: AuditAction.UPDATE,
        entityName: 'User',
        entityId: userId,
        userId: actingUser.userId,
        previousData: { role: previousRoleName },
        newData: { role: newRole.name },
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      });
    }

    return this.findOne(userId);
  }

  async changeStatus(
    userId: string,
    newStatus: UserStatus,
    actingUser: RequestUser,
    requestContext?: RequestContext,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    if (actingUser.userId === userId) {
      throw new ForbiddenException(
        'Un admin no puede cambiar su propio estado',
      );
    }

    if (user.status === newStatus) {
      throw new ConflictException(`El usuario ya tiene el estado ${newStatus}`);
    }

    if (user.role.name === RoleName.ADMIN && newStatus !== UserStatus.ACTIVE) {
      const activeAdminsCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .where('role.name = :roleName', { roleName: RoleName.ADMIN })
        .andWhere('user.deletedAt IS NULL')
        .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
        .getCount();

      if (activeAdminsCount <= 1) {
        throw new ConflictException(
          'No se puede desactivar al último admin activo del sistema',
        );
      }

      // await this.sessionsService.revokeAllByUser(userId);
    }

    const previousStatus = user.status;
    await this.userRepository.update(userId, { status: newStatus });

    await this.auditService.log({
      action: AuditAction.UPDATE,
      entityName: 'User',
      entityId: userId,
      userId: actingUser.userId,
      previousData: { status: previousStatus },
      newData: { status: newStatus },
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    });

    return this.findOne(userId);
  }

  async recordLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async promoteToClient(userId: string): Promise<User> {
    const clientRole = await this.roleRepository.findOneBy({
      name: RoleName.CLIENT,
    });
    if (!clientRole) {
      throw new NotFoundException('Role CLIENT not found in catalog');
    }
    return this.assignRole(userId, clientRole.id);
  }
}
