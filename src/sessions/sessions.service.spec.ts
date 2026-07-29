import { createHash } from 'node:crypto';
import { FindOperator, FindOneOptions, Repository } from 'typeorm';
import { RoleName } from '../roles/entities/roles.entity';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { SessionsService } from './sessions.service';

const RAW_REFRESH_TOKEN = 'refresh-token-de-prueba';

describe('SessionsService', () => {
  let sessionsService: SessionsService;

  let createMock: jest.Mock<Session, [Partial<Session>]>;
  let saveMock: jest.Mock<Promise<Session>, [Session]>;
  let findOneMock: jest.Mock<
    Promise<Session | null>,
    [FindOneOptions<Session>]
  >;

  beforeEach(() => {
    createMock = jest.fn<Session, [Partial<Session>]>((input) =>
      Object.assign(new Session(), input),
    );

    saveMock = jest.fn<Promise<Session>, [Session]>((session) =>
      Promise.resolve(session),
    );

    findOneMock = jest.fn<Promise<Session | null>, [FindOneOptions<Session>]>();

    const sessionRepository = {
      create: createMock,
      save: saveMock,
      findOne: findOneMock,
    } as unknown as Repository<Session>;

    sessionsService = new SessionsService(sessionRepository);
  });

  const buildUser = (): User => ({
    id: '7be6ef16-1a45-4b82-950c-3411fef49b28',
    name: 'Usuario de prueba',
    email: 'usuario@aislafriopro.com',
    password: 'password-hash',
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
  });

  const buildSession = (overrides: Partial<Session> = {}): Session =>
    Object.assign(new Session(), {
      id: 'f4530460-bb62-4b82-9753-7697383cd12f',
      user: buildUser(),
      refreshToken: 'stored-token-hash',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
      revoked: false,
      ...overrides,
    });

  it('debe crear una sesión almacenando el refresh token hasheado', async () => {
    const user = buildUser();
    const expiresAt = new Date(Date.now() + 60_000);

    const result = await sessionsService.createSession({
      user,
      refreshToken: RAW_REFRESH_TOKEN,
      expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });

    const expectedHash = createHash('sha256')
      .update(RAW_REFRESH_TOKEN)
      .digest('hex');

    expect(createMock).toHaveBeenCalledWith({
      user,
      refreshToken: expectedHash,
      expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
      revoked: false,
    });

    expect(saveMock).toHaveBeenCalledWith(result);
    expect(result.refreshToken).toBe(expectedHash);
    expect(result.refreshToken).not.toBe(RAW_REFRESH_TOKEN);
  });

  it('debe buscar únicamente una sesión activa y no expirada', async () => {
    const session = buildSession();

    findOneMock.mockResolvedValue(session);

    const result =
      await sessionsService.findActiveByRefreshToken(RAW_REFRESH_TOKEN);

    const expectedHash = createHash('sha256')
      .update(RAW_REFRESH_TOKEN)
      .digest('hex');

    expect(result).toBe(session);
    expect(findOneMock).toHaveBeenCalledTimes(1);

    const options = findOneMock.mock.calls[0][0];

    expect(options.where).toEqual(
      expect.objectContaining({
        refreshToken: expectedHash,
        revoked: false,
      }),
    );

    expect(options.relations).toEqual({
      user: {
        role: true,
      },
    });

    const where = options.where;

    if (!where || Array.isArray(where)) {
      throw new Error('Se esperaba una condición simple para la sesión.');
    }

    expect(where.expiresAt).toBeInstanceOf(FindOperator);

    const expiresAtOperator = where.expiresAt as FindOperator<Date>;

    expect(expiresAtOperator.type).toBe('moreThan');
    expect(expiresAtOperator.value).toBeInstanceOf(Date);
  });

  it('debe revocar una sesión existente', async () => {
    const session = buildSession();

    const result = await sessionsService.revokeSession(session);

    expect(result.revoked).toBe(true);
    expect(saveMock).toHaveBeenCalledWith(session);
  });
});
