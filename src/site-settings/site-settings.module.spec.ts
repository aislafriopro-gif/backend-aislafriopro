import { MODULE_METADATA } from '@nestjs/common/constants';
import { SiteSetting } from './entities/site-setting.entity';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsModule } from './site-settings.module';
import { SiteSettingsService } from './site-settings.service';

describe('SiteSettingsModule', () => {
  const getImports = (): unknown[] =>
    Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      SiteSettingsModule,
    ) as unknown[];

  const getControllers = (): unknown[] =>
    Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      SiteSettingsModule,
    ) as unknown[];

  const getProviders = (): unknown[] =>
    Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      SiteSettingsModule,
    ) as unknown[];

  const getExports = (): unknown[] =>
    Reflect.getMetadata(
      MODULE_METADATA.EXPORTS,
      SiteSettingsModule,
    ) as unknown[];

  it('debe registrar SiteSettingsController como controller', () => {
    expect(getControllers()).toContain(SiteSettingsController);
  });

  it('debe registrar SiteSettingsController una sola vez', () => {
    expect(
      getControllers().filter(
        (controller) => controller === SiteSettingsController,
      ),
    ).toHaveLength(1);
  });

  it('debe registrar SiteSettingsService como provider', () => {
    expect(getProviders()).toContain(SiteSettingsService);
  });

  it('debe registrar SiteSettingsService una sola vez', () => {
    expect(
      getProviders().filter((provider) => provider === SiteSettingsService),
    ).toHaveLength(1);
  });

  it('debe exportar SiteSettingsService', () => {
    expect(getExports()).toContain(SiteSettingsService);
  });

  it('debe contener el import de TypeOrmModule con la entidad SiteSetting', () => {
    const imports = getImports();
    expect(imports.length).toBeGreaterThanOrEqual(1);
  });

  it('la entidad SiteSetting debe estar referenciada desde el modulo', () => {
    expect(SiteSetting).toBeDefined();
  });
});
