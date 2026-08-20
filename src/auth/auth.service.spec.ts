import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { ApplicationConfiguration } from '../config/configuration';
import { RoleName } from '../roles/entities/roles.entity';
import { Session } from '../sessions/entities/session.entity';
import {
  CreateSessionInput,
  SessionsService,
} from '../sessions/sessions.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshJwtPayload } from './interfaces/refresh-jwt-payload.interface';
import { SessionMetadata } from './interfaces/session-metadata.interface';
import { Role } from '../roles/entities/roles.entity';

const REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';
const REFRESH_EXPIRES_IN_SECONDS = 604800;
const RAW_REFRESH_TOKEN = 'jwt-refresh-token';

type FindOneUser = Repository<User>['findOne'];

type SignToken = (
  payload: JwtPayload | RefreshJwtPayload,
  options?: {
    secret: string;
    expiresIn: number;
  },
) => Promise<string>;

type VerifyRefreshToken = (
  token: string,
  options: {
    secret: string;
  },
) => Promise<RefreshJwtPayload>;

type GetConfigValue = (
  key: 'jwt.refreshSecret' | 'jwt.refreshExpiresInSeconds',
  options: {
    infer: true;
  },
) => string | number;

type TransactionManagerMock = {
  create: jest.Mock<unknown, [unknown, unknown]>;
  save: jest.Mock<Promise<unknown>, [unknown, unknown]>;
};

type TransactionCallback = (manager: TransactionManagerMock) => Promise<User>;

describe('AuthService', () => {
  let authService: AuthService;
  let passwordHash: string;

  let findOneMock: jest.Mock<ReturnType<FindOneUser>, Parameters<FindOneUser>>;

  let signAsyncMock: jest.MockedFunction<SignToken>;
  let verifyAsyncMock: jest.MockedFunction<VerifyRefreshToken>;
  let getOrThrowMock: jest.MockedFunction<GetConfigValue>;

  let createSessionMock: jest.MockedFunction<
    (input: CreateSessionInput) => Promise<Session>
  >;

  let findActiveByRefreshTokenMock: jest.MockedFunction<
    (refreshToken: string) => Promise<Session | null>
  >;

  let revokeSessionMock: jest.MockedFunction<
    (session: Session) => Promise<Session>
  >;

  let findOneByRoleMock: jest.Mock<Promise<Role | null>, [{ name: RoleName }]>;
  let findOneOrFailMock: jest.Mock<Promise<User>, [unknown]>;
  let transactionMock: jest.Mock<Promise<User>, [TransactionCallback]>;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('Password123', 4);
  });

  beforeEach(() => {
    findOneMock = jest.fn<ReturnType<FindOneUser>, Parameters<FindOneUser>>();

    signAsyncMock = jest.fn<ReturnType<SignToken>, Parameters<SignToken>>();

    verifyAsyncMock = jest.fn<
      ReturnType<VerifyRefreshToken>,
      Parameters<VerifyRefreshToken>
    >();

    getOrThrowMock = jest.fn<
      ReturnType<GetConfigValue>,
      Parameters<GetConfigValue>
    >((key) => {
      if (key === 'jwt.refreshSecret') {
        return REFRESH_SECRET;
      }

      return REFRESH_EXPIRES_IN_SECONDS;
    });

    createSessionMock = jest.fn<Promise<Session>, [CreateSessionInput]>();

    findActiveByRefreshTokenMock = jest.fn<Promise<Session | null>, [string]>();

    revokeSessionMock = jest.fn<Promise<Session>, [Session]>();

    findOneByRoleMock = jest.fn<Promise<Role | null>, [{ name: RoleName }]>();

    findOneOrFailMock = jest.fn<Promise<User>, [unknown]>();

    transactionMock = jest.fn<Promise<User>, [TransactionCallback]>();

    const userRepository = {
      findOne: findOneMock,
      findOneOrFail: findOneOrFailMock,
      manager: {
        transaction: transactionMock,
      },
    } as unknown as Repository<User>;

    const roleRepository = {
      findOneBy: findOneByRoleMock,
    } as unknown as Repository<Role>;

    const jwtService = {
      signAsync: signAsyncMock,
      verifyAsync: verifyAsyncMock,
    } as unknown as JwtService;

    const configService = {
      getOrThrow: getOrThrowMock,
    } as unknown as ConfigService<ApplicationConfiguration, true>;

    const sessionsService = {
      createSession: createSessionMock,
      findActiveByRefreshToken: findActiveByRefreshTokenMock,
      revokeSession: revokeSessionMock,
    } as unknown as SessionsService;

    authService = new AuthService(
      userRepository,
      roleRepository,
      jwtService,
      configService,
      sessionsService,
    );
  });

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    name: 'Usuario de prueba',
    email: 'usuario@aislafriopro.com',
    password: passwordHash,
    phone: null,
    status: UserStatus.ACTIVE,
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
    ...overrides,
  });

  const buildSession = (overrides: Partial<Session> = {}): Session =>
    Object.assign(new Session(), {
      id: 'f4530460-bb62-4b82-9753-7697383cd12f',
      user: buildUser(),
      refreshToken: 'stored-refresh-token-hash',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
      revoked: false,
      ...overrides,
    });

  const buildRefreshPayload = (
    overrides: Partial<RefreshJwtPayload> = {},
  ): RefreshJwtPayload => ({
    sub: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    email: 'usuario@aislafriopro.com',
    role: RoleName.USER,
    type: 'refresh',
    jti: 'refresh-token-id',
    ...overrides,
  });

  const metadata: SessionMetadata = {
    ipAddress: '127.0.0.1',
    userAgent: 'Jest',
  };

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

  it('debe iniciar sesión y devolver usuario con rol y token', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const user = buildUser();
    const persistedSession = buildSession({ user });

    findOneMock.mockResolvedValue(user);

    signAsyncMock
      .mockResolvedValueOnce('jwt-access-token')
      .mockResolvedValueOnce(RAW_REFRESH_TOKEN);

    createSessionMock.mockResolvedValue(persistedSession);

    const result = await authService.login(
      {
        email: 'usuario@aislafriopro.com',
        password: 'Password123',
      },
      metadata,
    );

    expect(result).toEqual({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
      token: 'jwt-access-token',
    });

    expect(signAsyncMock).toHaveBeenCalledTimes(2);

    expect(signAsyncMock).toHaveBeenNthCalledWith(1, {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    expect(signAsyncMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sub: user.id,
        email: user.email,
        role: user.role.name,
        type: 'refresh',
      }),
      {
        secret: REFRESH_SECRET,
        expiresIn: REFRESH_EXPIRES_IN_SECONDS,
      },
    );

    const refreshPayload = signAsyncMock.mock.calls[1][0];

    if (!('jti' in refreshPayload)) {
      throw new Error('Se esperaba un jti en el refresh token.');
    }

    expect(typeof refreshPayload.jti).toBe('string');
    expect(refreshPayload.jti.length).toBeGreaterThan(0);

    expect(createSessionMock).toHaveBeenCalledWith({
      user,
      refreshToken: RAW_REFRESH_TOKEN,
      expiresAt: new Date(now + REFRESH_EXPIRES_IN_SECONDS * 1000),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });
  });

  it('no debe generar tokens cuando las credenciales son inválidas', async () => {
    findOneMock.mockResolvedValue(null);

    await expect(
      authService.login(
        {
          email: 'inexistente@aislafriopro.com',
          password: 'Password123',
        },
        metadata,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(signAsyncMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('debe rotar un refresh token válido y revocar la sesión anterior', async () => {
    const now = 1_800_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    const user = buildUser();
    const previousSession = buildSession({ user });

    verifyAsyncMock.mockResolvedValue(
      buildRefreshPayload({
        sub: user.id,
      }),
    );

    findActiveByRefreshTokenMock.mockResolvedValue(previousSession);
    revokeSessionMock.mockResolvedValue(
      Object.assign(previousSession, {
        revoked: true,
      }),
    );

    signAsyncMock
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    createSessionMock.mockResolvedValue(
      buildSession({
        user,
        refreshToken: 'new-refresh-token-hash',
      }),
    );

    const result = await authService.refresh(RAW_REFRESH_TOKEN, metadata);

    expect(verifyAsyncMock).toHaveBeenCalledWith(RAW_REFRESH_TOKEN, {
      secret: REFRESH_SECRET,
    });

    expect(findActiveByRefreshTokenMock).toHaveBeenCalledWith(
      RAW_REFRESH_TOKEN,
    );

    expect(revokeSessionMock).toHaveBeenCalledWith(previousSession);

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(createSessionMock).toHaveBeenCalledWith({
      user,
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(now + REFRESH_EXPIRES_IN_SECONDS * 1000),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    });

    expect(revokeSessionMock.mock.invocationCallOrder[0]).toBeLessThan(
      createSessionMock.mock.invocationCallOrder[0],
    );
  });

  it('debe rechazar un refresh token inválido o expirado', async () => {
    verifyAsyncMock.mockRejectedValue(new Error('jwt expired'));

    await expect(
      authService.refresh(RAW_REFRESH_TOKEN, metadata),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      authService.refresh(RAW_REFRESH_TOKEN, metadata),
    ).rejects.toThrow('Refresh token inválido.');

    expect(findActiveByRefreshTokenMock).not.toHaveBeenCalled();
    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('debe rechazar un refresh token sin sesión activa', async () => {
    verifyAsyncMock.mockResolvedValue(buildRefreshPayload());

    findActiveByRefreshTokenMock.mockResolvedValue(null);

    await expect(
      authService.refresh(RAW_REFRESH_TOKEN, metadata),
    ).rejects.toThrow('Refresh token inválido.');

    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it('debe rechazar una sesión perteneciente a otro usuario', async () => {
    verifyAsyncMock.mockResolvedValue(buildRefreshPayload());

    const session = buildSession({
      user: buildUser({
        id: '19e5e267-a314-416d-bf98-b92647598a51',
      }),
    });

    findActiveByRefreshTokenMock.mockResolvedValue(session);

    await expect(
      authService.refresh(RAW_REFRESH_TOKEN, metadata),
    ).rejects.toThrow('Refresh token inválido.');

    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
  });
  it('debe cerrar sesión revocando la sesión activa', async () => {
    const session = buildSession();

    findActiveByRefreshTokenMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(
      Object.assign(session, { revoked: true }),
    );

    await authService.logout(RAW_REFRESH_TOKEN);

    expect(findActiveByRefreshTokenMock).toHaveBeenCalledWith(
      RAW_REFRESH_TOKEN,
    );
    expect(revokeSessionMock).toHaveBeenCalledWith(session);
  });

  it('debe permitir logout idempotente cuando no existe una sesión activa', async () => {
    findActiveByRefreshTokenMock.mockResolvedValue(null);

    await expect(
      authService.logout(RAW_REFRESH_TOKEN),
    ).resolves.toBeUndefined();

    expect(findActiveByRefreshTokenMock).toHaveBeenCalledWith(
      RAW_REFRESH_TOKEN,
    );
    expect(revokeSessionMock).not.toHaveBeenCalled();
  });

  describe('register', () => {
    it('debe crear usuario CLIENT, registro Client y devolver token', async () => {
      const clientRole = {
        id: 'client-role-id',
        name: RoleName.CLIENT,
        users: [],
        createdAt: new Date(),
      } as Role;

      const savedUser = buildUser({
        id: 'new-user-id',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+54 9 11 1234-5678',
        role: clientRole,
      });

      findOneMock.mockResolvedValue(null);
      findOneByRoleMock.mockResolvedValue(clientRole);
      findOneOrFailMock.mockResolvedValue(savedUser);

      transactionMock.mockImplementation(async (callback) => {
        const manager: TransactionManagerMock = {
          create: jest.fn<unknown, [unknown, unknown]>((_entity, data) => data),
          save: jest.fn<Promise<unknown>, [unknown, unknown]>(
            (entity, data) => {
              if (
                entity === User &&
                typeof data === 'object' &&
                data !== null
              ) {
                return Promise.resolve({ ...data, id: savedUser.id });
              }

              return Promise.resolve(data);
            },
          ),
        };

        return callback(manager);
      });

      signAsyncMock
        .mockResolvedValueOnce('jwt-access-token')
        .mockResolvedValueOnce(RAW_REFRESH_TOKEN);

      createSessionMock.mockResolvedValue(buildSession({ user: savedUser }));

      const result = await authService.register(
        {
          name: 'Juan Pérez',
          email: 'Juan@Example.com',
          phone: '+54 9 11 1234-5678',
          password: 'PassWord23!',
        },
        metadata,
      );

      expect(result).toEqual({
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          role: RoleName.CLIENT,
        },
        token: 'jwt-access-token',
      });

      expect(findOneMock).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
        withDeleted: true,
      });
      expect(findOneByRoleMock).toHaveBeenCalledWith({ name: RoleName.CLIENT });
      expect(createSessionMock).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      findOneMock.mockResolvedValue(buildUser());

      await expect(
        authService.register(
          {
            name: 'Juan Pérez',
            email: 'usuario@aislafriopro.com',
            phone: '+54 9 11 1234-5678',
            password: 'PassWord23!',
          },
          metadata,
        ),
      ).rejects.toThrow(ConflictException);

      await expect(
        authService.register(
          {
            name: 'Juan Pérez',
            email: 'usuario@aislafriopro.com',
            phone: '+54 9 11 1234-5678',
            password: 'PassWord23!',
          },
          metadata,
        ),
      ).rejects.toThrow('Email ya registrado');
    });

    it('debe lanzar NotFoundException si no existe el rol CLIENT', async () => {
      findOneMock.mockResolvedValue(null);
      findOneByRoleMock.mockResolvedValue(null);

      await expect(
        authService.register(
          {
            name: 'Juan Pérez',
            email: 'nuevo@example.com',
            phone: '+54 9 11 1234-5678',
            password: 'PassWord23!',
          },
          metadata,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
