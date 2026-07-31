import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import type { ApplicationConfiguration } from '../../config/configuration';
import { RoleName } from '../../roles/entities/roles.entity';
import { User, UserStatus } from '../../users/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtStrategy } from './jwt.strategy';

type FindOneUser = Repository<User>['findOne'];

const JWT_SECRET = 'test-jwt-secret-with-at-least-32-characters';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let findOneMock: jest.Mock<ReturnType<FindOneUser>, Parameters<FindOneUser>>;
  let configService: ConfigService<ApplicationConfiguration, true>;
  let getOrThrowMock: jest.Mock<string, [string, { infer: true }]>;

  beforeEach(() => {
    findOneMock = jest.fn<ReturnType<FindOneUser>, Parameters<FindOneUser>>();

    const userRepository = {
      findOne: findOneMock,
    } as unknown as Repository<User>;

    getOrThrowMock = jest
      .fn<string, [string, { infer: true }]>()
      .mockReturnValue(JWT_SECRET);

    configService = {
      getOrThrow: getOrThrowMock,
    } as unknown as ConfigService<ApplicationConfiguration, true>;

    jwtStrategy = new JwtStrategy(configService, userRepository);
  });

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    name: 'Usuario de prueba',
    email: 'usuario@aislafriopro.com',
    password: 'password-hash',
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

  const buildPayload = (overrides: Partial<JwtPayload> = {}): JwtPayload => ({
    sub: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    email: 'usuario@aislafriopro.com',
    role: RoleName.USER,
    ...overrides,
  });

  it('debe obtener el secreto desde la configuración tipada', () => {
    expect(getOrThrowMock).toHaveBeenCalledWith('jwt.secret', {
      infer: true,
    });
  });

  it('debe validar el payload y construir el usuario autenticado', async () => {
    const user = buildUser();

    findOneMock.mockResolvedValue(user);

    const result = await jwtStrategy.validate(buildPayload());

    expect(findOneMock).toHaveBeenCalledWith({
      where: {
        id: user.id,
      },
      relations: {
        role: true,
      },
    });

    expect(result).toEqual({
      userId: user.id,
      email: user.email,
      role: RoleName.USER,
    });
  });

  it('debe rechazar un usuario inexistente', async () => {
    findOneMock.mockResolvedValue(null);

    await expect(jwtStrategy.validate(buildPayload())).rejects.toThrow(
      UnauthorizedException,
    );

    await expect(jwtStrategy.validate(buildPayload())).rejects.toThrow(
      'Usuario inválido.',
    );
  });

  it('debe rechazar un usuario eliminado', async () => {
    findOneMock.mockResolvedValue(
      buildUser({
        deletedAt: new Date(),
      }),
    );

    await expect(jwtStrategy.validate(buildPayload())).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
