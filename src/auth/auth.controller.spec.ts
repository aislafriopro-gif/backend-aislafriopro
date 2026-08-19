import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let logoutMock: jest.Mock<Promise<void>, [string]>;
  let registerMock: jest.Mock<
    Promise<{
      user: {
        id: string;
        name: string;
        email: string;
        role: 'CLIENT';
      };
      token: string;
    }>,
    [RegisterDto, { ipAddress: string; userAgent: string }]
  >;

  beforeEach(() => {
    logoutMock = jest.fn<Promise<void>, [string]>().mockResolvedValue();

    registerMock = jest
      .fn<
        Promise<{
          user: {
            id: string;
            name: string;
            email: string;
            role: 'CLIENT';
          };
          token: string;
        }>,
        [RegisterDto, { ipAddress: string; userAgent: string }]
      >()
      .mockResolvedValue({
        user: {
          id: 'user-id',
          name: 'Juan Pérez',
          email: 'juan@example.com',
          role: 'CLIENT',
        },
        token: 'jwt-access-token',
      });

    const authService = {
      logout: logoutMock,
      register: registerMock,
    } as unknown as AuthService;

    authController = new AuthController(authService);
  });

  it('debe registrar un usuario público', async () => {
    const dto = {
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+54 9 11 1234-5678',
      password: 'PassWord23!',
    };

    const req = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Jest',
      },
    } as Request;

    const result = await authController.register(dto, req);

    expect(registerMock).toHaveBeenCalledWith(dto, {
      ipAddress: '127.0.0.1',
      userAgent: 'Jest',
    });

    expect(result).toEqual({
      user: {
        id: 'user-id',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        role: 'CLIENT',
      },
      token: 'jwt-access-token',
    });
  });

  it('debe cerrar sesión usando el refresh token recibido', async () => {
    const refreshToken = 'refresh-token-de-prueba';

    await expect(
      authController.logout({ refreshToken }),
    ).resolves.toBeUndefined();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(logoutMock).toHaveBeenCalledWith(refreshToken);
  });
});
