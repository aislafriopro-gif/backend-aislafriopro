import { Request } from 'express';
import { RoleName } from '../roles/entities/roles.entity';
import { ChangeStatusDto } from './dto/change-status.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { User, UserStatus } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const buildUser = (overrides: Partial<User> = {}): User =>
  Object.assign(
    {
      id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
      name: 'Usuario de prueba',
      email: 'usuario@aislafriopro.com',
      password: 'password-hash',
      phone: null,
      status: 'ACTIVE',
      lastLoginAt: null,
      role: {
        id: '6d7e544a-22ce-41cb-a3cf-dae900834c31',
        name: RoleName.USER,
        users: [],
        createdAt: new Date(),
      },
      sessions: [],
      auditLogs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User,
    overrides,
  );

const buildRequestUser = () => ({
  userId: '7be6ef16-1a45-4b82-950c-3411fef49b28',
  email: 'usuario@aislafriopro.com',
  role: RoleName.USER,
});

const buildRequest = (): Request =>
  ({
    headers: {
      'x-forwarded-for': '127.0.0.1',
      'user-agent': 'Jest',
    },
    ip: '127.0.0.1',
  }) as unknown as Request;

const buildPaginatedResponse = () => ({
  data: [buildUser()],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
});

describe('UsersController', () => {
  let usersController: UsersController;

  let createMock: jest.MockedFunction<UsersService['create']>;
  let findAllMock: jest.MockedFunction<UsersService['findAll']>;
  let findMeMock: jest.MockedFunction<UsersService['findMe']>;
  let findOneMock: jest.MockedFunction<UsersService['findOne']>;
  let updateMock: jest.MockedFunction<UsersService['update']>;
  let removeMock: jest.MockedFunction<UsersService['remove']>;
  let restoreMock: jest.MockedFunction<UsersService['restore']>;
  let assignRoleMock: jest.MockedFunction<UsersService['assignRole']>;
  let changeStatusMock: jest.MockedFunction<UsersService['changeStatus']>;

  beforeEach(() => {
    createMock = jest.fn();
    findAllMock = jest.fn();
    findMeMock = jest.fn();
    findOneMock = jest.fn();
    updateMock = jest.fn();
    removeMock = jest.fn();
    restoreMock = jest.fn();
    assignRoleMock = jest.fn();
    changeStatusMock = jest.fn();

    const usersService = {
      create: createMock,
      findAll: findAllMock,
      findMe: findMeMock,
      findOne: findOneMock,
      update: updateMock,
      remove: removeMock,
      restore: restoreMock,
      assignRole: assignRoleMock,
      changeStatus: changeStatusMock,
      recordLogin: jest.fn(),
      promoteToClient: jest.fn(),
    } as unknown as UsersService;

    usersController = new UsersController(usersService);
  });

  describe('create', () => {
    it('debe crear un usuario y retornarlo', async () => {
      const dto = {
        name: 'Nuevo Usuario',
        email: 'nuevo@aislafriopro.com',
        password: 'Password123',
      };
      const createdUser = buildUser({ name: dto.name, email: dto.email });
      createMock.mockResolvedValue(createdUser);

      const result = await usersController.create(dto);

      expect(result).toBe(createdUser);
      expect(createMock).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('debe listar usuarios con los filtros de la query', async () => {
      const paginatedResponse = buildPaginatedResponse();
      findAllMock.mockResolvedValue(paginatedResponse);

      const query = Object.assign(new FindUsersQueryDto(), {
        page: 1,
        limit: 10,
        role: RoleName.ADMIN,
        status: UserStatus.ACTIVE,
        includeDeleted: true,
        search: 'juan',
      });

      const result = await usersController.findAll(query);

      expect(result).toBe(paginatedResponse);
      expect(findAllMock).toHaveBeenCalledWith(query, {
        role: RoleName.ADMIN,
        isActive: true,
        status: UserStatus.ACTIVE,
        search: 'juan',
      });
    });
  });

  describe('findMe', () => {
    it('debe retornar el perfil del usuario autenticado', async () => {
      const requestUser = buildRequestUser();
      const user = buildUser();
      findMeMock.mockResolvedValue(user);

      const result = await usersController.findMe(requestUser);

      expect(result).toBe(user);
      expect(findMeMock).toHaveBeenCalledWith(requestUser.userId);
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por id', async () => {
      const user = buildUser();
      findOneMock.mockResolvedValue(user);

      const result = await usersController.findOne(user.id);

      expect(result).toBe(user);
      expect(findOneMock).toHaveBeenCalledWith(user.id);
    });
  });

  describe('update', () => {
    it('debe actualizar un usuario y retornarlo', async () => {
      const user = buildUser();
      const dto = { name: 'Nombre actualizado' };
      const requestUser = buildRequestUser();
      const req = buildRequest();
      updateMock.mockResolvedValue(user);

      const result = await usersController.update(
        user.id,
        dto,
        requestUser,
        req,
      );

      expect(result).toBe(user);
      expect(updateMock).toHaveBeenCalledWith(user.id, dto, requestUser, {
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
      });
    });
  });

  describe('remove', () => {
    it('debe eliminar un usuario por id', async () => {
      const userId = '7be6ef16-1a45-4b82-950c-3411fef49b28';
      removeMock.mockResolvedValue(undefined);

      await usersController.remove(userId);

      expect(removeMock).toHaveBeenCalledWith(userId);
    });
  });

  describe('restore', () => {
    it('debe restaurar un usuario eliminado', async () => {
      const user = buildUser();
      restoreMock.mockResolvedValue(user);

      const result = await usersController.restore(user.id);

      expect(result).toBe(user);
      expect(restoreMock).toHaveBeenCalledWith(user.id);
    });
  });

  describe('assignRole', () => {
    it('debe asignar un rol a un usuario', async () => {
      const user = buildUser();
      const requestUser = buildRequestUser();
      const req = buildRequest();
      const dto = { roleId: 'new-role-id' };
      assignRoleMock.mockResolvedValue(user);

      const result = await usersController.assignRole(
        user.id,
        dto,
        requestUser,
        req,
      );

      expect(result).toBe(user);
      expect(assignRoleMock).toHaveBeenCalledWith(
        user.id,
        dto.roleId,
        requestUser,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Jest',
        },
      );
    });
  });

  describe('changeStatus', () => {
    it('debe cambiar el estado de un usuario', async () => {
      const user = buildUser();
      const requestUser = buildRequestUser();
      const req = buildRequest();
      const dto: ChangeStatusDto = { status: UserStatus.INACTIVE };
      changeStatusMock.mockResolvedValue(user);

      const result = await usersController.changeStatus(
        user.id,
        dto,
        requestUser,
        req,
      );

      expect(result).toBe(user);
      expect(changeStatusMock).toHaveBeenCalledWith(
        user.id,
        dto.status,
        requestUser,
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Jest',
        },
      );
    });
  });
});
