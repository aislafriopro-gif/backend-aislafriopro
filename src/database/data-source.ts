import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration, { validateEnvironment } from '../config/configuration';

validateEnvironment(process.env);
const appConfig = configuration();

export default new DataSource({
  type: 'postgres',
  host: appConfig.database.host,
  port: appConfig.database.port,
  username: appConfig.database.username,
  password: appConfig.database.password,
  database: appConfig.database.name,
  ssl: appConfig.database.ssl ? { rejectUnauthorized: false } : false,
  synchronize: appConfig.database.synchronize,
  logging: appConfig.database.logging,
  entities: ['./**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*.ts'],
});
