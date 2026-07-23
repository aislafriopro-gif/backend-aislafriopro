import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ApplicationConfiguration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApplicationConfiguration, true>);
  const port = configService.getOrThrow('app.port', { infer: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(port);
}
void bootstrap();
