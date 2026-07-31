import { MODULE_METADATA } from '@nestjs/common/constants';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthModule } from './auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

describe('AuthModule', () => {
  const getImports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule) as unknown[];

  const getControllers = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, AuthModule) as unknown[];

  const getProviders = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) as unknown[];

  const getExports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) as unknown[];

  it('debe importar SessionsModule para persistir refresh tokens', () => {
    expect(getImports()).toContain(SessionsModule);
  });

  it('debe registrar AuthController como controller', () => {
    expect(getControllers()).toContain(AuthController);
  });

  it('debe registrar AuthController una sola vez', () => {
    expect(
      getControllers().filter((controller) => controller === AuthController),
    ).toHaveLength(1);
  });

  it('debe registrar AuthService y JwtStrategy como providers', () => {
    const providers = getProviders();

    expect(providers).toEqual(
      expect.arrayContaining([AuthService, JwtStrategy]),
    );
  });

  it('debe registrar AuthService y JwtStrategy una sola vez', () => {
    const providers = getProviders();

    expect(
      providers.filter((provider) => provider === AuthService),
    ).toHaveLength(1);

    expect(
      providers.filter((provider) => provider === JwtStrategy),
    ).toHaveLength(1);
  });

  it('debe exportar AuthService y los módulos de autenticación', () => {
    const exportedProviders = getExports();

    expect(exportedProviders).toEqual(
      expect.arrayContaining([AuthService, PassportModule, JwtModule]),
    );
  });
});
