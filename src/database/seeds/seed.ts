import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Role, RoleName } from '../../roles/entities/roles.entity';
import { User } from '../../users/entities/user.entity';
import { Client } from '../../clients/entities/client.entity';
import { Service } from '../../services/entities/service.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import { Project } from '../../projects/entities/project.entity';
import { SiteSetting, SiteSettingType } from '../../site-settings/entities/site-setting.entity';
import { Faq } from '../../faqs/entities/faq.entity';

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
    name: RoleName.CLIENT,
    emailEnv: 'SEED_CLIENT_EMAIL',
    defaultEmail: 'client@aislafriopro.com',
    fullName: 'Cliente Aislafríopro',
  },
  {
    name: RoleName.TECHNICIAN,
    emailEnv: 'SEED_TECHNICIAN_EMAIL',
    defaultEmail: 'technician@aislafriopro.com',
    fullName: 'Técnico Aislafríopro',
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
  clientRepository: ReturnType<typeof dataSource.getRepository<Client>>,
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

      if (name === RoleName.CLIENT) {
        const existingClient = await clientRepository.findOneBy({
          userId: existingUser.id,
        });

        if (!existingClient) {
          const client = clientRepository.create({
            userId: existingUser.id,
            user: existingUser,
          });

          await clientRepository.save(client);
          console.log(`[SEED] Perfil Client creado para "${email}".`);
        }
      }

      continue;
    }

    const user = userRepository.create({
      name: fullName,
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await userRepository.save(user);
    console.log(`[SEED] Usuario "${email}" creado con rol "${name}".`);

    if (name === RoleName.CLIENT) {
      const client = clientRepository.create({
        userId: savedUser.id,
        user: savedUser,
      });

      await clientRepository.save(client);
      console.log(`[SEED] Perfil Client creado para "${email}".`);
    }
  }
}

// ============================================================================
// DATOS DE EJEMPLO (OPCIONALES PARA PRODUCCIÓN - COMENTAR SI NO LOS NECESITA)
// ============================================================================

async function seedServices(
  serviceRepository: ReturnType<typeof dataSource.getRepository<Service>>,
): Promise<void> {
  console.log('\n[SEED] === DATOS DE EJEMPLO: SERVICIOS ===');

  const exampleServices = [
    {
      name: 'Aislación Térmica',
      slug: 'aislacion-termica',
      description: 'Instalación de sistemas de aislación térmica para reducir consumo energético.',
      shortDescription: 'Aislación térmica profesional',
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Aislación Acústica',
      slug: 'aislacion-acustica',
      description: 'Soluciones de aislación acústica para espacios residenciales y comerciales.',
      shortDescription: 'Control del ruido',
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Mantenimiento',
      slug: 'mantenimiento',
      description: 'Servicios de mantenimiento preventivo y correctivo de sistemas de aislación.',
      shortDescription: 'Mantenimiento y reparación',
      isActive: true,
      displayOrder: 3,
    },
  ];

  for (const serviceData of exampleServices) {
    const existing = await serviceRepository.findOneBy({ slug: serviceData.slug });

    if (existing) {
      console.log(`[SEED] Servicio "${serviceData.name}" ya existe. Omitiendo.`);
    } else {
      const service = serviceRepository.create(serviceData);
      await serviceRepository.save(service);
      console.log(`[SEED] Servicio "${serviceData.name}" creado.`);
    }
  }
}

async function seedProducts(
  productRepository: ReturnType<typeof dataSource.getRepository<Product>>,
): Promise<void> {
  console.log('\n[SEED] === DATOS DE EJEMPLO: PRODUCTOS ===');

  const exampleProducts = [
    {
      name: 'Panel Aislante XPS 50mm',
      slug: 'panel-aislante-xps-50mm',
      description: 'Paneles de espuma rígida XPS de 50mm de espesor, resistentes a la humedad y con excelente resistencia térmica.',
      price: 2500.00,
      status: ProductStatus.ACTIVE,
      isPublished: true,
    },
    {
      name: 'Lana Mineral 100mm',
      slug: 'lana-mineral-100mm',
      description: 'Rollos de lana mineral de 100mm, ideales para aislación térmica y acústica en techos y paredes.',
      price: 1850.50,
      status: ProductStatus.ACTIVE,
      isPublished: true,
    },
    {
      name: 'Membrana Impermeable',
      slug: 'membrana-impermeable',
      description: 'Membrana impermeabilizante de alta densidad para protección contra infiltraciones.',
      price: 3200.00,
      status: ProductStatus.ACTIVE,
      isPublished: true,
    },
  ];

  for (const productData of exampleProducts) {
    const existing = await productRepository.findOneBy({ slug: productData.slug });

    if (existing) {
      console.log(`[SEED] Producto "${productData.name}" ya existe. Omitiendo.`);
    } else {
      const product = productRepository.create(productData);
      await productRepository.save(product);
      console.log(`[SEED] Producto "${productData.name}" creado.`);
    }
  }
}

async function seedProjects(
  projectRepository: ReturnType<typeof dataSource.getRepository<Project>>,
): Promise<void> {
  console.log('\n[SEED] === DATOS DE EJEMPLO: PROYECTOS ===');

  const exampleProjects = [
    {
      title: 'Aislación Térmica - Edificio Comercial Centro',
      slug: 'aislacion-termica-edificio-comercial-centro',
      description: 'Proyecto de aislación térmica integral en edificio de oficinas en zona central de la ciudad.',
      location: 'Zona Centro',
      completionDate: new Date('2026-06-30'),
      clientDisplayName: 'Empresa XYZ S.A.',
    },
    {
      title: 'Aislación Acústica - Estudio de Grabación',
      slug: 'aislacion-acustica-estudio-grabacion',
      description: 'Implementación de sistema de aislación acústica profesional para estudio de grabación.',
      location: 'Barrio Tecnológico',
      completionDate: new Date('2026-05-15'),
      clientDisplayName: 'Audio Pro Estudio',
    },
  ];

  for (const projectData of exampleProjects) {
    const existing = await projectRepository.findOneBy({ slug: projectData.slug });

    if (existing) {
      console.log(`[SEED] Proyecto "${projectData.title}" ya existe. Omitiendo.`);
    } else {
      const project = projectRepository.create(projectData);
      await projectRepository.save(project);
      console.log(`[SEED] Proyecto "${projectData.title}" creado.`);
    }
  }
}

async function seedSiteSettings(
  siteSettingRepository: ReturnType<typeof dataSource.getRepository<SiteSetting>>,
): Promise<void> {
  console.log('\n[SEED] === CONFIGURACIÓN DEL SITIO ===');

  const exampleSettings = [
    {
      key: 'site_name',
      value: 'AislaFrío Pro',
      type: SiteSettingType.STRING,
      description: 'Nombre del sitio web',
    },
    {
      key: 'site_phone',
      value: '+54 11 1234 5678',
      type: SiteSettingType.STRING,
      description: 'Teléfono de contacto principal',
    },
    {
      key: 'site_email',
      value: 'contacto@aislafriopro.com',
      type: SiteSettingType.STRING,
      description: 'Email de contacto principal',
    },
  ];

  for (const settingData of exampleSettings) {
    const existing = await siteSettingRepository.findOneBy({ key: settingData.key });

    if (existing) {
      console.log(`[SEED] Configuración "${settingData.key}" ya existe. Omitiendo.`);
    } else {
      const setting = siteSettingRepository.create(settingData);
      await siteSettingRepository.save(setting);
      console.log(`[SEED] Configuración "${settingData.key}" creada.`);
    }
  }
}

async function seedFaqs(
  faqRepository: ReturnType<typeof dataSource.getRepository<Faq>>,
): Promise<void> {
  console.log('\n[SEED] === PREGUNTAS FRECUENTES ===');

  const exampleFaqs = [
    {
      question: '¿Cuáles son los beneficios de la aislación térmica?',
      answer: 'La aislación térmica reduce significativamente el consumo de energía para calefacción y refrigeración, disminuye costos operativos y mejora el confort interior.',
      displayOrder: 1,
      isActive: true,
    },
    {
      question: '¿Qué materiales utilizan para la aislación?',
      answer: 'Utilizamos materiales de alta calidad como espuma XPS, lana mineral y membranas impermeabilizantes, seleccionados según las necesidades específicas de cada proyecto.',
      displayOrder: 2,
      isActive: true,
    },
    {
      question: '¿Cuánto tiempo tarda una instalación típica?',
      answer: 'El tiempo varía según el tamaño y complejidad del proyecto. Generalmente, desde una evaluación inicial podemos estimar el cronograma de instalación con precisión.',
      displayOrder: 3,
      isActive: true,
    },
  ];

  for (const faqData of exampleFaqs) {
    const existing = await faqRepository.findOneBy({
      question: faqData.question,
    });

    if (existing) {
      console.log(`[SEED] FAQ "${faqData.question}" ya existe. Omitiendo.`);
    } else {
      const faq = faqRepository.create(faqData);
      await faqRepository.save(faq);
      console.log(`[SEED] FAQ creada: "${faqData.question}".`);
    }
  }
}

// ============================================================================
// FIN DATOS DE EJEMPLO
// ============================================================================

async function main(): Promise<void> {
  console.log('[SEED] Iniciando seed de roles, usuarios y datos de ejemplo...\n');

  try {
    await dataSource.initialize();
    console.log('[SEED] Conexión a la base de datos establecida.\n');

    const roleRepository = dataSource.getRepository(Role);
    const userRepository = dataSource.getRepository(User);
    const clientRepository = dataSource.getRepository(Client);
    const serviceRepository = dataSource.getRepository(Service);
    const productRepository = dataSource.getRepository(Product);
    const projectRepository = dataSource.getRepository(Project);
    const siteSettingRepository = dataSource.getRepository(SiteSetting);
    const faqRepository = dataSource.getRepository(Faq);

    // Seed núcleos del sistema
    const rolesMap = await seedRoles(roleRepository);
    await seedUsers(userRepository, clientRepository, rolesMap);

    // Seed de datos de ejemplo (opcionales para producción)
    await seedServices(serviceRepository);
    await seedProducts(productRepository);
    await seedProjects(projectRepository);
    await seedSiteSettings(siteSettingRepository);
    await seedFaqs(faqRepository);

    console.log('\n[SEED] ✓ Seed finalizado correctamente.');
  } catch (error) {
    console.error('\n[SEED] ✗ Error durante el seed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('[SEED] Conexión a la base de datos cerrada.');
    }
  }
}

void main();
