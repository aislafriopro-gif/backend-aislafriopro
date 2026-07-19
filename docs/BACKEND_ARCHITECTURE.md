# Arquitectura Backend Oficial - Aislafríopro

**Versión:** 1.0
**Fecha:** 18 de Julio 2026
**Autor:** lider tecnico Backend
**Estado:** Aprobado para desarrollo

## 1. Visión General

Este documento define la **arquitectura oficial del Backend** para el proyecto Aislafríopro.

- **Framework**: NestJS + TypeScript
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **Autenticación**: JWT propio (NestJS)
- **Almacenamiento**: Cloudinary
- **Documentación**: Swagger / OpenAPI
- **Enfoque**: Monolito Modular (ideal para MVP de 8 semanas)

## 2. Estructura Oficial de Carpetas

```bash
src/
├── main.ts
├── app.module.ts
├── config/
│   └── configuration.ts          # Configuración tipada + validación
├── database/
│   ├── data-source.ts
│   ├── migrations/
│   └── seeds/
│       └── seed.ts
├── common/
│   ├── decorators/
│   ├── dto/
│   ├── enums/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pagination/
│   ├── utils/
│   └── constants.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── dto/
│   ├── strategies/
│   ├── guards/
│   └── entities/
├── users/
├── roles/
├── sessions/
├── services/
├── projects/
│   ├── projects.module.ts
│   ├── projects.service.ts
│   ├── projects.controller.ts
│   ├── dto/
│   ├── entities/
│   └── media/
├── media/                        # Cloudinary global
│   └── cloudinary.service.ts
├── quote-requests/
│   ├── quote-requests.module.ts
│   ├── quote-requests.service.ts
│   ├── quote-requests.controller.ts
│   ├── dto/
│   ├── entities/
│   └── notes/
├── faqs/
├── site-settings/
├── audit/
├── health/
├── clients/                      # Condicionado
├── technical-visits/             # Condicionado
└── shared/                       # Código reutilizable
```

### Justificación de la estructura

- Organización por **dominio de negocio** (feature modules)
- `common/` para código transversal
- `media/` como servicio global para Cloudinary
- Sub-módulos claros (`projects/media`, `quote-requests/notes`)

## 3. Decisiones de Arquitectura

| Decisión                | Razón                                       |
| ----------------------- | ------------------------------------------- |
| Monolito Modular        | Velocidad para MVP de 8 semanas             |
| JWT propio (NestJS)     | Mayor control vs Supabase Auth en esta fase |
| TypeORM + Migraciones   | Control total de esquema                    |
| Cloudinary centralizado | Mejor reutilización y limpieza              |
| Swagger como contrato   | Alineación clara con Frontend               |

## 4. Convenciones y Mejores Prácticas

- **Naming**: `kebab-case` para archivos, `PascalCase` para clases
- **DTOs**: Siempre usar `class-validator` + `class-transformer`
- **Validación**: `ValidationPipe` global con `whitelist: true`
- **Errores**: Global Exception Filter con formato estandarizado
- **Paginación**: Estandarizada en `common/pagination`
- **Soft Delete**: En entidades sensibles
- **Auditoría**: En operaciones críticas

## 5. Cómo Ejecutar Localmente

```bash
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run start:dev
```

## 6. Roadmap Backend (8 Semanas)

Ver el documento de planificación de Sprints (Jira) para el detalle diario por desarrollador.

## 7. Integración con Frontend

- Prefijo: `/api/v1`
- Autenticación: JWT + Refresh Token
- Formato de respuestas: Paginación y errores estandarizados

---

**Este documento es la referencia oficial del Backend.**
Cualquier Cambio debe ser aprobada.
