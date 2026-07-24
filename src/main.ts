import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ApplicationConfiguration } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ApplicationConfiguration, true>);
  const port = configService.getOrThrow('app.port', { infer: true });
  const corsOrigins = configService.getOrThrow('http.corsOrigins', {
    infer: true,
  });
  const swaggerEnabled = configService.getOrThrow('swagger.enabled', {
    infer: true,
  });
  const swaggerPath = configService.getOrThrow('swagger.path', {
    infer: true,
  });

  app.use(swaggerEnabled ? helmet({ contentSecurityPolicy: false }) : helmet());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

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

  if (swaggerEnabled) {
    const swaggerConfiguration = new DocumentBuilder()
      .setTitle('Aisla Frío Pro API')
      .setDescription('API oficial del sistema Aisla Frío Pro')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Ingrese el token JWT',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const swaggerDocument = SwaggerModule.createDocument(
      app,
      swaggerConfiguration,
    );

    SwaggerModule.setup(swaggerPath, app, swaggerDocument, {
      customSiteTitle: 'Aisla Frío Pro API Docs',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(port);
}

void bootstrap();
