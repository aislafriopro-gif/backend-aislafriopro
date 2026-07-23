import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Role, RoleName } from '../../roles/entities/roles.entity';
import { User } from '../../users/entities/user.entity';

const DEFAULT_PASSWORD = 'PassWord23!';
const BCRYPT_SALT_ROUNDS = 10;

interface SeedRoleDefinition {
  name: RoleName;
  emailEnv: string;
  defaultEmail: string;
  fullName: string;
}

const ROLES_TO_SEED: SeedRoleDefinition[] = [
  {
    name: RoleName.ADMIN,
    emailEnv: 'SEED_ADMIN_EMAIL',
    defaultEmail: 'admin@aislafriopro.com',
    fullName: 'Admin Aislafríopro',
  },
  {
    name: RoleName.USER,
    emailEnv: 'SEED_USER_EMAIL',
    defaultEmail: 'user@aislafriopro.com',
    fullName: 'User Aislafríopro',
  },
  {
    name: RoleName.CLIENT,
    emailEnv: 'SEED_CLIENT_EMAIL',
    defaultEmail: 'client@aislafriopro.com',
    fullName: 'Client Aislafríopro',
  },
  {
    name: RoleName.TECHNICIAN,
    emailEnv: 'SEED_TECHNICIAN_EMAIL',
    defaultEmail: 'technician@aislafriopro.com',
    fullName: 'Technician Aislafríopro',
  },
];

async function seedRoles(
  roleRepository: ReturnType<typeof dataSource.getRepository<Role>>,
): Promise<Map<RoleName, Role>> {
  const createdRoles = new Map<RoleName, Role>();

  for (const { name } of ROLES_TO_SEED) {
    let role = await roleRepository.findOneBy({ name });

    if (role) {
      console.log(`[SEED] Rol "${name}" ya existe. Omitiendo.`);
    } else {
      role = roleRepository.create({ name });
      await roleRepository.save(role);
      console.log(`[SEED] Rol "${name}" creado.`);
    }

    createdRoles.set(name, role);
  }

  return createdRoles;
}

async function seedUsers(
  userRepository: ReturnType<typeof dataSource.getRepository<User>>,
  rolesMap: Map<RoleName, Role>,
): Promise<void> {
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD ?? DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(seedPassword, BCRYPT_SALT_ROUNDS);

  for (const { name, emailEnv, defaultEmail, fullName } of ROLES_TO_SEED) {
    const email = process.env[emailEnv] ?? defaultEmail;
    const role = rolesMap.get(name);

    if (!role) {
      throw new Error(`No se encontró el rol "${name}" en el mapa de roles.`);
    }

    const existingUser = await userRepository.findOneBy({ email });

    if (existingUser) {
      console.log(`[SEED] Usuario "${email}" (${name}) ya existe. Omitiendo.`);
      continue;
    }

    const user = userRepository.create({
      name: fullName,
      email,
      password: hashedPassword,
      role,
    });

    await userRepository.save(user);
    console.log(`[SEED] Usuario "${email}" creado con rol "${name}".`);
  }
}

async function main(): Promise<void> {
  console.log('[SEED] Iniciando seed de roles y usuarios...');

  try {
    await dataSource.initialize();
    console.log('[SEED] Conexión a la base de datos establecida.');

    const roleRepository = dataSource.getRepository(Role);
    const userRepository = dataSource.getRepository(User);

    const rolesMap = await seedRoles(roleRepository);
    await seedUsers(userRepository, rolesMap);

    console.log('[SEED] Seed finalizado correctamente.');
  } catch (error) {
    console.error('[SEED] Error durante el seed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('[SEED] Conexión a la base de datos cerrada.');
    }
  }
}

void main();
