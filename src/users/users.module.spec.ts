import { MODULE_METADATA } from '@nestjs/common/constants';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { UsersController } from './users.controller';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';

describe('UsersModule', () => {
  const getImports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, UsersModule) as unknown[];

  const getControllers = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, UsersModule) as unknown[];

  const getProviders = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, UsersModule) as unknown[];

  const getExports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, UsersModule) as unknown[];

  it('debe importar AuditModule y SessionsModule', () => {
    const imports = getImports();

    expect(imports).toContain(AuditModule);
    expect(imports).toContain(SessionsModule);
  });

  it('debe registrar UsersController como controller', () => {
    expect(getControllers()).toContain(UsersController);
  });

  it('debe registrar UsersController una sola vez', () => {
    expect(
      getControllers().filter((controller) => controller === UsersController),
    ).toHaveLength(1);
  });

  it('debe registrar UsersService como provider', () => {
    expect(getProviders()).toContain(UsersService);
  });

  it('debe registrar UsersService una sola vez', () => {
    expect(
      getProviders().filter((provider) => provider === UsersService),
    ).toHaveLength(1);
  });

  it('debe exportar UsersService', () => {
    expect(getExports()).toContain(UsersService);
  });
});
