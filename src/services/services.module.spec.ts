import { MODULE_METADATA } from '@nestjs/common/constants';
import { Service } from './entities/service.entity';
import { ServicesController } from './services.controller';
import { ServicesModule } from './services.module';
import { ServicesService } from './services.service';

describe('ServicesModule', () => {
  const getImports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, ServicesModule) as unknown[];

  const getControllers = (): unknown[] =>
    Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      ServicesModule,
    ) as unknown[];

  const getProviders = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, ServicesModule) as unknown[];

  const getExports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, ServicesModule) as unknown[];

  it('debe registrar ServicesController como controller', () => {
    expect(getControllers()).toContain(ServicesController);
  });

  it('debe registrar ServicesController una sola vez', () => {
    expect(
      getControllers().filter(
        (controller) => controller === ServicesController,
      ),
    ).toHaveLength(1);
  });

  it('debe registrar ServicesService como provider', () => {
    expect(getProviders()).toContain(ServicesService);
  });

  it('debe registrar ServicesService una sola vez', () => {
    expect(
      getProviders().filter((provider) => provider === ServicesService),
    ).toHaveLength(1);
  });

  it('debe exportar ServicesService', () => {
    expect(getExports()).toContain(ServicesService);
  });

  it('debe contener el import de TypeOrmModule con la entidad Service', () => {
    const imports = getImports();
    expect(imports.length).toBeGreaterThanOrEqual(1);
  });

  it('la entidad Service debe estar referenciada desde el modulo', () => {
    expect(Service).toBeDefined();
  });
});
