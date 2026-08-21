import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import configuration, {
  ApplicationConfiguration,
  validateEnvironment,
} from './config/configuration';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ServicesModule } from './services/services.module';
import { QuoteRequestsModule } from './quote-requests/quote-requests.module';
import { HealthModule } from './health/health.module';
import { FaqsModule } from './faqs/faqs.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { CloudinaryModule } from './media/cloudinary.module';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<ApplicationConfiguration, true>,
      ) => ({
        type: 'postgres',
        host: configService.getOrThrow('database.host', { infer: true }),
        port: configService.getOrThrow('database.port', { infer: true }),
        username: configService.getOrThrow('database.username', {
          infer: true,
        }),
        password: configService.getOrThrow('database.password', {
          infer: true,
        }),
        database: configService.getOrThrow('database.name', { infer: true }),
        ssl: configService.getOrThrow('database.ssl', { infer: true })
          ? { rejectUnauthorized: false }
          : false,
        synchronize: configService.getOrThrow('database.synchronize', {
          infer: true,
        }),
        logging: configService.getOrThrow('database.logging', { infer: true }),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    ServicesModule,
    QuoteRequestsModule,
    HealthModule,
    FaqsModule,
    SiteSettingsModule,
    CloudinaryModule,
    ProductsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
