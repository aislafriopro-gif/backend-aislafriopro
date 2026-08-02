import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  const handler = jest.fn();

  class TestController {}

  const buildContext = (): ExecutionContext =>
    ({
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(TestController),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);

    jest.restoreAllMocks();
  });

  it('debe permitir el acceso cuando la ruta está marcada como pública', () => {
    const context = buildContext();

    const reflectorSpy = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(result).toBe(true);

    expect(reflectorSpy).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });

  it('debe delegar en AuthGuard JWT cuando la ruta no es pública', () => {
    const context = buildContext();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const jwtGuardClass = AuthGuard('jwt') as unknown as {
      prototype: CanActivate;
    };

    const parentCanActivateSpy = jest
      .spyOn(jwtGuardClass.prototype, 'canActivate')
      .mockReturnValue(true);

    const result = guard.canActivate(context);

    expect(parentCanActivateSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });
});
