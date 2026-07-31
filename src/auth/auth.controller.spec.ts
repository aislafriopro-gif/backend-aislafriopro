import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let logoutMock: jest.Mock<Promise<void>, [string]>;

  beforeEach(() => {
    logoutMock = jest.fn<Promise<void>, [string]>().mockResolvedValue();

    const authService = {
      logout: logoutMock,
    } as unknown as AuthService;

    authController = new AuthController(authService);
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
