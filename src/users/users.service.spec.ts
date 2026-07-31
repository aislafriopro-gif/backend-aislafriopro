import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuditAction, AuditLog } from '../audit/entities/audit-action.entity';
import { AuditService } from '../audit/audit.service';
import { PaginationParamsDto, PaginatedResponse } from '../common/pagination';
import { Role, RoleName } from '../roles/entities/roles.entity';
import { SessionsService } from '../sessions/sessions.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserStatus } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

type FindOneUser = Repository<User>['findOne'];
type FindOneByUser = Repository<User>['findOneBy'];
type CreateUser = Repository<User>['create'];
type SaveUser = Repository<User>['save'];
type UpdateUser = Repository<User>['update'];
type SoftDeleteUser = Repository<User>['softDelete'];
type RestoreUser = Repository<User>['restore'];

type FindOneRole = Repository<Role>['findOne'];
type FindOneByRole = Repository<Role>['findOneBy'];

const MOCK_HASHED_PASSWORD = 'hashed-password';

const buildRole = (overrides: Partial<Role> = {}): Role => ({
  id: '6d7e544a-22ce-41cb-a3cf-dae900834c31',
  name: RoleName.USER,
  users: [],
  createdAt: new Date(),
  ...overrides,
});

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
  name: 'Usuario de prueba',
  email: 'usuario@aislafriopro.com',
  password: MOCK_HASHED_PASSWORD,
  phone: null,
  status: UserStatus.ACTIVE,
  lastLoginAt: null,
  role: buildRole(),
  sessions: [],
  auditLogs: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const buildAuditLog = (): AuditLog =>
  Object.assign(new AuditLog(), {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    action: AuditAction.UPDATE,
    entityName: 'User',
    entityId: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    userId: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    previousData: {},
    newData: {},
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
  });

const buildPagination = (
  overrides: Partial<PaginationParamsDto> = {},
): PaginationParamsDto => {
  const dto = new PaginationParamsDto();
  dto.page = 1;
  dto.limit = 10;
  return Object.assign(dto, overrides);
};

const buildPaginatedResponse = <T>(
  data: T[],
  total: number,
): PaginatedResponse<T> => ({
  data,
  total,
  page: 1,
  limit: 10,
  totalPages: total === 0 ? 0 : Math.ceil(total / 10),
});

describe('UsersService', () => {
  let usersService: UsersService;

  let findOneUserMock: jest.Mock<
    ReturnType<FindOneUser>,
    Parameters<FindOneUser>
  >;
  let findOneByUserMock: jest.Mock<
    ReturnType<FindOneByUser>,
    Parameters<FindOneByUser>
  >;
  let createUserMock: jest.Mock<ReturnType<CreateUser>, Parameters<CreateUser>>;
  let saveUserMock: jest.Mock<ReturnType<SaveUser>, Parameters<SaveUser>>;
  let updateUserMock: jest.Mock<ReturnType<UpdateUser>, Parameters<UpdateUser>>;
  let softDeleteUserMock: jest.Mock<
    ReturnType<SoftDeleteUser>,
    Parameters<SoftDeleteUser>
  >;
  let restoreUserMock: jest.Mock<
    ReturnType<RestoreUser>,
    Parameters<RestoreUser>
  >;
  let createUserQueryBuilderMock: jest.Mock;
  let selectMock: jest.Mock;
  let leftJoinAndSelectMock: jest.Mock;
  let orderByMock: jest.Mock;
  let skipMock: jest.Mock;
  let takeMock: jest.Mock;
  let andWhereMock: jest.Mock;
  let getManyAndCountMock: jest.Mock;
  let innerJoinMock: jest.Mock;
  let whereMock: jest.Mock;
  let getCountMock: jest.Mock;
  let setMock: jest.Mock;
  let updateQueryBuilderMock: jest.Mock;
  let executeMock: jest.Mock;

  let findOneRoleMock: jest.Mock<
    ReturnType<FindOneRole>,
    Parameters<FindOneRole>
  >;
  let findOneByRoleMock: jest.Mock<
    ReturnType<FindOneByRole>,
    Parameters<FindOneByRole>
  >;

  let auditLogMock: jest.MockedFunction<AuditService['log']>;
  let revokeAllByUserMock: jest.MockedFunction<
    SessionsService['revokeAllByUser']
  >;

  beforeEach(() => {
    jest.resetAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue(MOCK_HASHED_PASSWORD);

    findOneUserMock = jest.fn<
      ReturnType<FindOneUser>,
      Parameters<FindOneUser>
    >();
    findOneByUserMock = jest.fn<
      ReturnType<FindOneByUser>,
      Parameters<FindOneByUser>
    >();
    createUserMock = jest.fn<ReturnType<CreateUser>, Parameters<CreateUser>>(
      (input) => Object.assign(new User(), input),
    );
    saveUserMock = jest.fn<ReturnType<SaveUser>, Parameters<SaveUser>>((user) =>
      Promise.resolve(
        Object.assign(user, {
          id: user.id ?? '7be6ef16-1a45-4b82-950c-3411fef49b28',
        }) as User,
      ),
    );
    updateUserMock = jest
      .fn<ReturnType<UpdateUser>, Parameters<UpdateUser>>()
      .mockResolvedValue({
        generatedMaps: [],
        raw: [],
        affected: 1,
      });
    softDeleteUserMock = jest
      .fn<ReturnType<SoftDeleteUser>, Parameters<SoftDeleteUser>>()
      .mockResolvedValue({
        generatedMaps: [],
        raw: [],
        affected: 1,
      });
    restoreUserMock = jest
      .fn<ReturnType<RestoreUser>, Parameters<RestoreUser>>()
      .mockResolvedValue({
        generatedMaps: [],
        raw: [],
        affected: 1,
      });

    innerJoinMock = jest.fn().mockReturnThis();
    whereMock = jest.fn().mockReturnThis();
    andWhereMock = jest.fn().mockReturnThis();
    getCountMock = jest.fn().mockResolvedValue(2);
    getManyAndCountMock = jest.fn().mockResolvedValue([[], 0]);
    selectMock = jest.fn().mockReturnThis();
    leftJoinAndSelectMock = jest.fn().mockReturnThis();
    orderByMock = jest.fn().mockReturnThis();
    skipMock = jest.fn().mockReturnThis();
    takeMock = jest.fn().mockReturnThis();
    setMock = jest.fn().mockReturnThis();
    updateQueryBuilderMock = jest.fn().mockReturnThis();
    executeMock = jest.fn().mockResolvedValue({ affected: 1 });

    const userQueryBuilder = {
      select: selectMock,
      leftJoinAndSelect: leftJoinAndSelectMock,
      orderBy: orderByMock,
      skip: skipMock,
      take: takeMock,
      andWhere: andWhereMock,
      getManyAndCount: getManyAndCountMock,
      innerJoin: innerJoinMock,
      where: whereMock,
      getCount: getCountMock,
      set: setMock,
      update: updateQueryBuilderMock,
      execute: executeMock,
    };

    createUserQueryBuilderMock = jest.fn().mockReturnValue(userQueryBuilder);

    findOneRoleMock = jest.fn<
      ReturnType<FindOneRole>,
      Parameters<FindOneRole>
    >();
    findOneByRoleMock = jest.fn<
      ReturnType<FindOneByRole>,
      Parameters<FindOneByRole>
    >();

    auditLogMock = jest
      .fn<ReturnType<AuditService['log']>, Parameters<AuditService['log']>>()
      .mockResolvedValue(buildAuditLog());
    revokeAllByUserMock = jest
      .fn<
        ReturnType<SessionsService['revokeAllByUser']>,
        Parameters<SessionsService['revokeAllByUser']>
      >()
      .mockResolvedValue(undefined);

    const userRepository = {
      findOne: findOneUserMock,
      findOneBy: findOneByUserMock,
      create: createUserMock,
      save: saveUserMock,
      update: updateUserMock,
      softDelete: softDeleteUserMock,
      restore: restoreUserMock,
      createQueryBuilder: createUserQueryBuilderMock,
    } as unknown as Repository<User>;

    const roleRepository = {
      findOne: findOneRoleMock,
      findOneBy: findOneByRoleMock,
    } as unknown as Repository<Role>;

    const auditService = {
      log: auditLogMock,
    } as unknown as AuditService;

    const sessionsService = {
      revokeAllByUser: revokeAllByUserMock,
    } as unknown as SessionsService;

    usersService = new UsersService(
      userRepository,
      roleRepository,
      auditService,
      sessionsService,
    );
  });

  describe('create', () => {
    it('debe crear un usuario con el rol USER por defecto', async () => {
      const dto: CreateUserDto = {
        name: 'Nuevo Usuario',
        email: 'nuevo@aislafriopro.com',
        password: 'Password123',
      };
      const defaultRole = buildRole({ id: 'role-1', name: RoleName.USER });
      const savedUser = buildUser({
        id: 'user-1',
        name: dto.name,
        email: dto.email,
        password: MOCK_HASHED_PASSWORD,
        role: defaultRole,
      });

      findOneUserMock.mockResolvedValue(null);
      findOneByRoleMock.mockResolvedValue(defaultRole);
      findOneUserMock
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(savedUser);

      const result = await usersService.create(dto);

      expect(result).toEqual(savedUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 10);
      expect(createUserMock).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: MOCK_HASHED_PASSWORD,
        role: defaultRole,
      });
      expect(saveUserMock).toHaveBeenCalled();
    });

    it('debe rechazar un email duplicado incluso si el usuario fue eliminado', async () => {
      const dto: CreateUserDto = {
        name: 'Nuevo Usuario',
        email: 'nuevo@aislafriopro.com',
        password: 'Password123',
      };
      const existingUser = buildUser({
        id: 'user-1',
        email: dto.email,
        deletedAt: new Date(),
      });

      findOneUserMock.mockResolvedValue(existingUser);

      await expect(usersService.create(dto)).rejects.toThrow(ConflictException);
      await expect(usersService.create(dto)).rejects.toThrow(
        `User with email "${dto.email}" already exists`,
      );
    });

    it('debe lanzar NotFoundException si no existe el rol USER', async () => {
      const dto: CreateUserDto = {
        name: 'Nuevo Usuario',
        email: 'nuevo@aislafriopro.com',
        password: 'Password123',
      };

      findOneUserMock.mockResolvedValue(null);
      findOneByRoleMock.mockResolvedValue(null);

      await expect(usersService.create(dto)).rejects.toThrow(NotFoundException);
      await expect(usersService.create(dto)).rejects.toThrow(
        'Default role USER not found in catalog',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar una lista paginada de usuarios', async () => {
      const users = [buildUser({ id: 'user-1' }), buildUser({ id: 'user-2' })];
      getManyAndCountMock.mockResolvedValue([users, 2]);

      const pagination = buildPagination();
      const result = await usersService.findAll(pagination);

      expect(result).toEqual(buildPaginatedResponse(users, 2));
      expect(createUserQueryBuilderMock).toHaveBeenCalledWith('user');
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(takeMock).toHaveBeenCalledWith(10);
    });

    it('debe aplicar filtro por rol', async () => {
      const pagination = buildPagination();

      await usersService.findAll(pagination, { role: RoleName.ADMIN });

      expect(andWhereMock).toHaveBeenCalledWith('role.name = :roleName', {
        roleName: RoleName.ADMIN,
      });
    });

    it('debe aplicar filtro por estado', async () => {
      const pagination = buildPagination();

      await usersService.findAll(pagination, { status: UserStatus.INACTIVE });

      expect(andWhereMock).toHaveBeenCalledWith('user.status = :status', {
        status: UserStatus.INACTIVE,
      });
    });

    it('debe incluir usuarios eliminados cuando isActive es false', async () => {
      const pagination = buildPagination();

      await usersService.findAll(pagination, { isActive: false });

      expect(andWhereMock).toHaveBeenCalledWith('user.deletedAt IS NOT NULL');
    });

    it('debe excluir usuarios eliminados por defecto', async () => {
      const pagination = buildPagination();

      await usersService.findAll(pagination);

      expect(andWhereMock).toHaveBeenCalledWith('user.deletedAt IS NULL');
    });

    it('debe aplicar busqueda por nombre o email', async () => {
      const pagination = buildPagination();

      await usersService.findAll(pagination, { search: 'juan' });

      expect(andWhereMock).toHaveBeenCalledWith(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: '%juan%' },
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario existente', async () => {
      const user = buildUser();
      findOneUserMock.mockResolvedValue(user);

      const result = await usersService.findOne(user.id);

      expect(result).toBe(user);
      expect(findOneUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id },
          relations: { role: true },
        }),
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      findOneUserMock.mockResolvedValue(null);

      await expect(usersService.findOne('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.findOne('no-existe')).rejects.toThrow(
        'User with id "no-existe" not found',
      );
    });
  });

  describe('findMe', () => {
    it('debe delegar en findOne con el userId del request', async () => {
      const user = buildUser();
      findOneUserMock.mockResolvedValue(user);

      const result = await usersService.findMe(user.id);

      expect(result).toBe(user);
      expect(findOneUserMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: user.id },
          relations: { role: true },
        }),
      );
    });
  });

  describe('update', () => {
    it('debe permitir que un admin actualice cualquier usuario', async () => {
      const user = buildUser();
      const dto: UpdateUserDto = { name: 'Nombre actualizado' };
      const admin = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: RoleName.ADMIN,
      };

      findOneUserMock.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

      const result = await usersService.update(user.id, dto, admin);

      expect(result).toBe(user);
      expect(updateUserMock).toHaveBeenCalledWith(user.id, dto);
    });

    it('debe permitir que un usuario actualice su propio perfil', async () => {
      const user = buildUser();
      const dto: UpdateUserDto = { name: 'Mi nuevo nombre' };
      const requestUser = {
        userId: user.id,
        email: user.email,
        role: RoleName.USER,
      };

      findOneUserMock.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

      const result = await usersService.update(user.id, dto, requestUser);

      expect(result).toBe(user);
    });

    it('debe rechazar que un usuario comun actualice a otro usuario', async () => {
      const user = buildUser({ id: 'otro-user' });
      const dto: UpdateUserDto = { name: 'Hackeado' };
      const requestUser = {
        userId: 'user-1',
        email: 'user@test.com',
        role: RoleName.USER,
      };

      findOneUserMock.mockResolvedValue(user);

      await expect(
        usersService.update(user.id, dto, requestUser),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        usersService.update(user.id, dto, requestUser),
      ).rejects.toThrow('No tenés permisos para actualizar este usuario');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      const dto: UpdateUserDto = { name: 'Nuevo' };
      const requestUser = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: RoleName.ADMIN,
      };

      findOneUserMock.mockResolvedValue(null);

      await expect(
        usersService.update('no-existe', dto, requestUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar un email que ya esté en uso', async () => {
      const user = buildUser();
      const dto: UpdateUserDto = { email: 'otro@aislafriopro.com' };
      const requestUser = {
        userId: user.id,
        email: user.email,
        role: RoleName.USER,
      };
      const existingUser = buildUser({ id: 'otro-user', email: dto.email });

      findOneUserMock.mockImplementation((options) => {
        const where = options.where;
        if (!Array.isArray(where) && where?.email === dto.email) {
          return Promise.resolve(existingUser);
        }
        return Promise.resolve(user);
      });

      await expect(
        usersService.update(user.id, dto, requestUser),
      ).rejects.toThrow(ConflictException);
      await expect(
        usersService.update(user.id, dto, requestUser),
      ).rejects.toThrow(`User with email "${dto.email}" already exists`);
    });

    it('debe llamar a auditService.log cuando hay cambios reales', async () => {
      const user = buildUser({ name: 'Anterior' });
      const dto: UpdateUserDto = { name: 'Nuevo' };
      const requestUser = {
        userId: user.id,
        email: user.email,
        role: RoleName.USER,
      };
      const context = { ipAddress: '127.0.0.1', userAgent: 'Jest' };

      findOneUserMock.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

      await usersService.update(user.id, dto, requestUser, context);

      expect(auditLogMock).toHaveBeenCalledWith({
        action: AuditAction.UPDATE,
        entityName: 'User',
        entityId: user.id,
        userId: requestUser.userId,
        previousData: { name: 'Anterior' },
        newData: { name: 'Nuevo' },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
    });

    it('no debe llamar a auditService.log si el DTO no genera cambios', async () => {
      const user = buildUser({ name: 'Igual' });
      const dto: UpdateUserDto = { name: 'Igual' };
      const requestUser = {
        userId: user.id,
        email: user.email,
        role: RoleName.USER,
      };

      findOneUserMock.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

      await usersService.update(user.id, dto, requestUser);

      expect(auditLogMock).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar suavemente un usuario existente', async () => {
      const user = buildUser();
      findOneUserMock.mockResolvedValue(user);

      await expect(usersService.remove(user.id)).resolves.toBeUndefined();
      expect(softDeleteUserMock).toHaveBeenCalledWith(user.id);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      findOneUserMock.mockResolvedValue(null);

      await expect(usersService.remove('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.remove('no-existe')).rejects.toThrow(
        'User with id "no-existe" not found',
      );
    });
  });

  describe('restore', () => {
    it('debe restaurar un usuario eliminado', async () => {
      const user = buildUser({ deletedAt: new Date() });
      findOneUserMock.mockResolvedValueOnce(user).mockResolvedValueOnce(user);

      await expect(usersService.restore(user.id)).resolves.toBe(user);
      expect(restoreUserMock).toHaveBeenCalledWith(user.id);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      findOneUserMock.mockResolvedValue(null);

      await expect(usersService.restore('no-existe')).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.restore('no-existe')).rejects.toThrow(
        'User with id "no-existe" not found',
      );
    });

    it('debe lanzar ConflictException si el usuario no esta eliminado', async () => {
      const user = buildUser();
      findOneUserMock.mockResolvedValue(user);

      await expect(usersService.restore(user.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(usersService.restore(user.id)).rejects.toThrow(
        `User with id "${user.id}" is not deleted`,
      );
    });
  });

  describe('assignRole', () => {
    it('debe asignar un nuevo rol a un usuario', async () => {
      const user = buildUser({ role: buildRole({ name: RoleName.USER }) });
      const newRole = buildRole({ id: 'new-role', name: RoleName.ADMIN });
      const admin = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: RoleName.ADMIN,
      };
      const updatedUser = buildUser({ id: user.id, role: newRole });

      findOneUserMock
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(updatedUser);
      findOneRoleMock.mockResolvedValue(newRole);

      const result = await usersService.assignRole(user.id, newRole.id, admin);

      expect(result).toBe(updatedUser);
      expect(updateUserMock).toHaveBeenCalledWith(user.id, { role: newRole });
      expect(auditLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'User',
          entityId: user.id,
          userId: admin.userId,
          previousData: { role: RoleName.USER },
          newData: { role: RoleName.ADMIN },
        }),
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      findOneUserMock.mockResolvedValue(null);

      await expect(
        usersService.assignRole('no-existe', 'role-id', undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si el rol no existe', async () => {
      const user = buildUser();
      findOneUserMock.mockResolvedValue(user);
      findOneRoleMock.mockResolvedValue(null);

      await expect(
        usersService.assignRole(user.id, 'no-existe', undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar que un admin se reasigne su propio rol', async () => {
      const user = buildUser();
      const admin = {
        userId: user.id,
        email: user.email,
        role: RoleName.ADMIN,
      };
      const newRole = buildRole({ id: 'new-role', name: RoleName.USER });

      findOneUserMock.mockResolvedValue(user);
      findOneRoleMock.mockResolvedValue(newRole);

      await expect(
        usersService.assignRole(user.id, newRole.id, admin),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        usersService.assignRole(user.id, newRole.id, admin),
      ).rejects.toThrow('Un admin no puede reasignarse su propio rol');
    });

    it('debe rechazar degradar al último admin activo', async () => {
      const user = buildUser({ role: buildRole({ name: RoleName.ADMIN }) });
      const newRole = buildRole({ id: 'user-role', name: RoleName.USER });
      const admin = {
        userId: 'admin-2',
        email: 'admin2@test.com',
        role: RoleName.ADMIN,
      };
      getCountMock.mockResolvedValue(1);

      findOneUserMock.mockResolvedValue(user);
      findOneRoleMock.mockResolvedValue(newRole);

      await expect(
        usersService.assignRole(user.id, newRole.id, admin),
      ).rejects.toThrow(ConflictException);
      await expect(
        usersService.assignRole(user.id, newRole.id, admin),
      ).rejects.toThrow(
        'No se puede cambiar el rol del último admin activo del sistema',
      );
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado de un usuario', async () => {
      const user = buildUser({ role: buildRole({ name: RoleName.USER }) });
      const admin = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: RoleName.ADMIN,
      };
      const updatedUser = buildUser({
        id: user.id,
        status: UserStatus.INACTIVE,
      });

      findOneUserMock
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(updatedUser);

      const result = await usersService.changeStatus(
        user.id,
        UserStatus.INACTIVE,
        admin,
      );

      expect(result).toBe(updatedUser);
      expect(updateUserMock).toHaveBeenCalledWith(user.id, {
        status: UserStatus.INACTIVE,
      });
      expect(auditLogMock).toHaveBeenCalledWith(
        expect.objectContaining({
          entityName: 'User',
          entityId: user.id,
          userId: admin.userId,
          previousData: { status: UserStatus.ACTIVE },
          newData: { status: UserStatus.INACTIVE },
        }),
      );
    });

    it('debe rechazar cambiar el estado propio de un admin', async () => {
      const user = buildUser();
      const admin = {
        userId: user.id,
        email: user.email,
        role: RoleName.ADMIN,
      };

      findOneUserMock.mockResolvedValue(user);

      await expect(
        usersService.changeStatus(user.id, UserStatus.INACTIVE, admin),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        usersService.changeStatus(user.id, UserStatus.INACTIVE, admin),
      ).rejects.toThrow('Un admin no puede cambiar su propio estado');
    });

    it('debe rechazar cambiar al mismo estado', async () => {
      const user = buildUser();
      const admin = {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: RoleName.ADMIN,
      };

      findOneUserMock.mockResolvedValue(user);

      await expect(
        usersService.changeStatus(user.id, UserStatus.ACTIVE, admin),
      ).rejects.toThrow(ConflictException);
      await expect(
        usersService.changeStatus(user.id, UserStatus.ACTIVE, admin),
      ).rejects.toThrow(`El usuario ya tiene el estado ${UserStatus.ACTIVE}`);
    });

    it('debe rechazar desactivar al último admin activo', async () => {
      const user = buildUser({ role: buildRole({ name: RoleName.ADMIN }) });
      const admin = {
        userId: 'admin-2',
        email: 'admin2@test.com',
        role: RoleName.ADMIN,
      };
      getCountMock.mockResolvedValue(1);

      findOneUserMock.mockResolvedValue(user);

      await expect(
        usersService.changeStatus(user.id, UserStatus.INACTIVE, admin),
      ).rejects.toThrow(ConflictException);
      await expect(
        usersService.changeStatus(user.id, UserStatus.INACTIVE, admin),
      ).rejects.toThrow(
        'No se puede desactivar al último admin activo del sistema',
      );
    });
  });

  describe('recordLogin', () => {
    it('debe actualizar lastLoginAt del usuario', async () => {
      const userId = 'user-1';
      const now = new Date('2026-01-01T00:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      await usersService.recordLogin(userId);

      expect(updateUserMock).toHaveBeenCalledWith(userId, { lastLoginAt: now });

      jest.useRealTimers();
    });
  });

  describe('promoteToClient', () => {
    it('debe asignar el rol CLIENT al usuario', async () => {
      const user = buildUser({ role: buildRole({ name: RoleName.USER }) });
      const clientRole = buildRole({
        id: 'client-role',
        name: RoleName.CLIENT,
      });
      const updatedUser = buildUser({ id: user.id, role: clientRole });
      getCountMock.mockResolvedValue(2);

      findOneByRoleMock.mockResolvedValue(clientRole);
      findOneRoleMock.mockResolvedValue(clientRole);
      findOneUserMock
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(updatedUser);

      const result = await usersService.promoteToClient(user.id);

      expect(result).toBe(updatedUser);
      expect(findOneByRoleMock).toHaveBeenCalledWith({ name: RoleName.CLIENT });
      expect(updateUserMock).toHaveBeenCalledWith(user.id, {
        role: clientRole,
      });
    });

    it('debe lanzar NotFoundException si no existe el rol CLIENT', async () => {
      findOneByRoleMock.mockResolvedValue(null);

      await expect(usersService.promoteToClient('user-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(usersService.promoteToClient('user-1')).rejects.toThrow(
        'Role CLIENT not found in catalog',
      );
    });
  });
});
