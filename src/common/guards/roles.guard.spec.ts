import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../roles/entities/roles.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

interface TestRequest {
  user?: {
    role: RoleName;
  };
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  const handler = jest.fn();

  class TestController {}

  const buildContext = (request: TestRequest = {}): ExecutionContext =>
    ({
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(TestController),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    jest.restoreAllMocks();
  });

  it('debe permitir el acceso cuando no hay roles requeridos', () => {
    const context = buildContext();

    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);

    expect(reflectorSpy).toHaveBeenCalledWith(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('debe rechazar el acceso cuando no existe un usuario autenticado', () => {
    const context = buildContext();

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleName.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

    expect(() => guard.canActivate(context)).toThrow('No autenticado');
  });

  it('debe rechazar el acceso cuando el usuario no tiene el rol requerido', () => {
    const context = buildContext({
      user: {
        role: RoleName.USER,
      },
    });

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleName.ADMIN]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);

    expect(() => guard.canActivate(context)).toThrow(
      'No tenés permisos para acceder a este recurso',
    );
  });

  it('debe permitir el acceso cuando el usuario tiene un rol permitido', () => {
    const context = buildContext({
      user: {
        role: RoleName.ADMIN,
      },
    });

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([RoleName.ADMIN, RoleName.TECHNICIAN]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it.each([RoleName.ADMIN, RoleName.CLIENT, RoleName.TECHNICIAN])(
    'debe permitir acceso al rol %s cuando está permitido',
    (role) => {
      const context = buildContext({
        user: {
          role,
        },
      });

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([role]);

      expect(guard.canActivate(context)).toBe(true);
    },
  );
});
