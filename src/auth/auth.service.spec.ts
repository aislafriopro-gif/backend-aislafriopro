import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { RoleName } from '../roles/entities/roles.entity';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type FindOneUser = Repository<User>['findOne'];

describe('AuthService', () => {
  let authService: AuthService;
  let passwordHash: string;
  let findOneMock: jest.Mock<ReturnType<FindOneUser>, Parameters<FindOneUser>>;
  let signAsyncMock: jest.Mock<Promise<string>, [JwtPayload]>;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Password123', 4);
  });

  beforeEach(() => {
    findOneMock = jest.fn<ReturnType<FindOneUser>, Parameters<FindOneUser>>();

    signAsyncMock = jest.fn<Promise<string>, [JwtPayload]>();

    const userRepository = {
      findOne: findOneMock,
    } as unknown as Repository<User>;

    const jwtService = {
      signAsync: signAsyncMock,
    } as unknown as JwtService;

    authService = new AuthService(userRepository, jwtService);
  });

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    name: 'Usuario de prueba',
    email: 'usuario@aislafriopro.com',
    password: passwordHash,
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
    ...overrides,
  });

  it('debe validar credenciales correctas y normalizar el correo', async () => {
    const user = buildUser();

    findOneMock.mockResolvedValue(user);

    const result = await authService.validateCredentials({
      email: '  Usuario@AislaFrioPro.com  ',
      password: 'Password123',
    });

    expect(result).toBe(user);
    expect(findOneMock).toHaveBeenCalledWith({
      where: {
        email: 'usuario@aislafriopro.com',
      },
      relations: {
        role: true,
      },
    });
  });

  it('debe rechazar un usuario inexistente', async () => {
    findOneMock.mockResolvedValue(null);

    await expect(
      authService.validateCredentials({
        email: 'inexistente@aislafriopro.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      authService.validateCredentials({
        email: 'inexistente@aislafriopro.com',
        password: 'Password123',
      }),
    ).rejects.toThrow('Credenciales inválidas.');
  });

  it('debe rechazar una contraseña incorrecta', async () => {
    findOneMock.mockResolvedValue(buildUser());

    await expect(
      authService.validateCredentials({
        email: 'usuario@aislafriopro.com',
        password: 'PasswordIncorrecta',
      }),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      authService.validateCredentials({
        email: 'usuario@aislafriopro.com',
        password: 'PasswordIncorrecta',
      }),
    ).rejects.toThrow('Credenciales inválidas.');
  });

  it('debe rechazar un usuario eliminado', async () => {
    findOneMock.mockResolvedValue(
      buildUser({
        deletedAt: new Date(),
      }),
    );

    await expect(
      authService.validateCredentials({
        email: 'usuario@aislafriopro.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe validar las credenciales y generar un access token', async () => {
    const user = buildUser();

    findOneMock.mockResolvedValue(user);
    signAsyncMock.mockResolvedValue('jwt-access-token');

    const result = await authService.login({
      email: 'usuario@aislafriopro.com',
      password: 'Password123',
    });

    expect(signAsyncMock).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    expect(result).toEqual({
      accessToken: 'jwt-access-token',
    });
  });

  it('no debe generar un token cuando las credenciales son inválidas', async () => {
    findOneMock.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'inexistente@aislafriopro.com',
        password: 'Password123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(signAsyncMock).not.toHaveBeenCalled();
  });
});
