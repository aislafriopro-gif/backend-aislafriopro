# Handover Backend - Aisla Frío Pro

## Resumen

El backend de Aisla Frío Pro está construido con NestJS, TypeScript, PostgreSQL, TypeORM, JWT y Cloudinary. La API usa prefijo global `/api/v1`, documentación Swagger y validación centralizada de variables de entorno.

## Arquitectura

- Framework: NestJS + TypeScript.
- Base de datos: PostgreSQL.
- ORM: TypeORM con migraciones.
- Autenticación: JWT + refresh token.
- Media: Cloudinary centralizado en el módulo `media`.
- Documentación: Swagger/OpenAPI.
- Seguridad: Helmet, CORS configurado por entorno, rate limiting con Throttler.
- Observabilidad: health check público y logs HTTP estructurados.

## Endpoints Operativos

- Health check: `GET /api/v1/health`.
- Swagger: configurable con `SWAGGER_PATH`, por defecto `/api/docs`.
- La mayoría de endpoints privados requieren JWT Bearer token.
- Los endpoints públicos usan el decorador `@Public()`.

## Variables de Entorno

Variables requeridas para producción:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn

CORS_ORIGINS=https://frontend-produccion.com
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

SWAGGER_ENABLED=false
SWAGGER_PATH=api/docs

DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_SSL=true
DB_SYNCHRONIZE=false
DB_LOGGING=false

JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN_SECONDS=604800

CLOUDINARY_URL=
CLOUDINARY_MAX_IMAGE_SIZE_BYTES=5242880
```

## Notas

- `JWT_SECRET` y `JWT_REFRESH_SECRET` deben tener al menos 32 caracteres.
- En producción `DB_SYNCHRONIZE` debe mantenerse en `false`.
- En producción `DB_SSL` debe configurarse según el proveedor de base de datos.
- Cloudinary puede configurarse con `CLOUDINARY_URL` o con `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

## Deploy

1. Configurar variables de entorno en el proveedor de hosting.
2. Instalar dependencias con `npm install`.
3. Ejecutar migraciones con `npm run migration:run`.
4. Compilar con `npm run build`.
5. Iniciar producción con `npm run start:prod`.
6. Verificar `GET /api/v1/health`.

## Debugging

- Si la aplicación no inicia, revisar validación de variables en `src/config/configuration.ts`.
- Si falla la base de datos, verificar `DB_HOST`, `DB_PORT`, credenciales, `DB_NAME` y `DB_SSL`.
- Si falla carga de imágenes, verificar configuración de Cloudinary.
- Si hay errores HTTP, revisar logs estructurados por `timestamp`, `method`, `path`, `statusCode` y `responseTimeMs`.
- Para más detalle temporal en producción, subir `LOG_LEVEL` a `log` o `debug` y luego volver a `warn`.

## Logs

El backend registra requests HTTP en formato JSON. El nivel se controla con `LOG_LEVEL`.
Niveles disponibles:

- `error`
- `warn`
- `log`
- `debug`
- `verbose`

Recomendación:

- Desarrollo: `LOG_LEVEL=log`.
- Producción: `LOG_LEVEL=warn`.

## Credenciales y Contactos

Las credenciales reales no deben guardarse en el repositorio. Deben mantenerse en el proveedor de despliegue y en el gestor seguro definido por el equipo.

Contactos operativos:

- Backend: Equipo Backend.
- Frontend: Equipo Frontend.
- DevOps/Deploy: Responsable de infraestructura/despliegue.
- Producto: Product Owner / Scrum Master.

## Checklist de Handover

- [ ] Variables de entorno productivas configuradas.
- [ ] Migraciones ejecutadas.
- [ ] Build verificado.
- [ ] Health check respondiendo.
- [ ] Swagger actualizado.
- [ ] Logs configurados por entorno.
- [ ] Documento compartido con el equipo.
