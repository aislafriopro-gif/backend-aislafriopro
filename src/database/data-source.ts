import 'dotenv/config';
import { DataSource } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import { Session } from '../sessions/entities/session.entity';

export default new DataSource({
  type: 'postgres',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,

  database: process.env.DB_DATABASE,

  synchronize: false,
  logging: false,

  entities: [User, Role, Session],

  migrations: ['src/database/migrations/*.ts'],
});