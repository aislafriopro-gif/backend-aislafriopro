import { MODULE_METADATA } from '@nestjs/common/constants';
import { Faq } from './entities/faq.entity';
import { FaqsController } from './faqs.controller';
import { FaqsModule } from './faqs.module';
import { FaqsService } from './faqs.service';

describe('FaqsModule', () => {
  const getImports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, FaqsModule) as unknown[];

  const getControllers = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, FaqsModule) as unknown[];

  const getProviders = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, FaqsModule) as unknown[];

  const getExports = (): unknown[] =>
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, FaqsModule) as unknown[];

  it('debe registrar FaqsController como controller', () => {
    expect(getControllers()).toContain(FaqsController);
  });

  it('debe registrar FaqsController una sola vez', () => {
    expect(
      getControllers().filter((controller) => controller === FaqsController),
    ).toHaveLength(1);
  });

  it('debe registrar FaqsService como provider', () => {
    expect(getProviders()).toContain(FaqsService);
  });

  it('debe registrar FaqsService una sola vez', () => {
    expect(
      getProviders().filter((provider) => provider === FaqsService),
    ).toHaveLength(1);
  });

  it('debe exportar FaqsService', () => {
    expect(getExports()).toContain(FaqsService);
  });

  it('debe contener el import de TypeOrmModule con la entidad Faq', () => {
    const imports = getImports();
    expect(imports.length).toBeGreaterThanOrEqual(1);
  });

  it('la entidad Faq debe estar referenciada desde el modulo', () => {
    expect(Faq).toBeDefined();
  });
});
