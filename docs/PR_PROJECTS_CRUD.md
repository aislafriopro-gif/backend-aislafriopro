SCRUM-XX — CRUD completo del modulo Projects con paginacion, filtros, validaciones y soft-delete

## Informacion de la entrega

- **Proyecto:** Aisla Frio Pro Backend
- **Rama origen:** joaquin
- **Rama destino:** develop
- **Commit:** fb6c794, a8b6a18
- **Jira:** SCRUM-XX

## Resumen

Se implemento el CRUD completo del modulo `projects` respetando la arquitectura oficial del proyecto. Se agregaron endpoints de creacion, listado con paginacion y filtros, consulta por ID, actualizacion, soft-delete y restore. El modulo incluye validaciones de integridad para servicios y clientes asociados, asegurando que solo se puedan asociar entidades activas y no eliminadas.

Los endpoints de administracion (crear, editar, eliminar, restaurar) requieren rol `ADMIN`. El listado publico retorna solo proyectos activos, mientras que el endpoint admin incluye proyectos eliminados.

## Diagnostico

El modulo `projects` existia solo con entidades, DTOs y migracion. Faltaban el modulo, servicio, controlador y tests. El frontend necesita estos endpoints para la gestion de proyectos desde el panel administrativo y la visualizacion publica de proyectos destacados.

## Cambios realizados

### Endpoints nuevos

| Metodo | Ruta | Auth | Descripcion |
|--------|------|------|-------------|
| `POST` | `/api/v1/projects` | ADMIN | Crear proyecto con `title`, `slug`, `description`, `location?`, `completionDate?`, `clientId?`, `clientDisplayName?`, `serviceIds?` |
| `GET` | `/api/v1/projects` | Ninguna | Listar proyectos activos con paginacion + filtros `search`, `location`, `clientId` |
| `GET` | `/api/v1/projects/all` | ADMIN | Listar todos los proyectos incluyendo eliminados |
| `GET` | `/api/v1/projects/:id` | Ninguna | Obtener proyecto por UUID con relaciones (`images`, `services`, `client`) |
| `PATCH` | `/api/v1/projects/:id` | ADMIN | Actualizar proyecto (campos opcionales) |
| `DELETE` | `/api/v1/projects/:id` | ADMIN | Soft delete |
| `POST` | `/api/v1/projects/:id/restore` | ADMIN | Restaurar proyecto eliminado |

### Service: metodos implementados

- `create(dto)` — valida slug unico, asocia servicios validados, crea proyecto.
- `findAll(pagination, filters)` — query paginada con filtros `search` (title/description), `location`, `clientId`. Solo activos.
- `findAllAdmin(pagination, filters)` — query paginada con `withDeleted: true`.
- `findOne(id)` — consulta con relaciones `images`, `services`, `client`.
- `update(id, dto)` — valida slug unico si cambia, valida servicios y cliente si se actualizan.
- `remove(id)` — soft delete con `softDelete()`.
- `restore(id)` — recupera proyecto eliminado, valida slug disponible.

### Validaciones implementadas

**Servicios asociados (`serviceIds`):**
- Verifica que todos los IDs existan en la base de datos.
- Rechaza servicios con `isActive: false` → `400 Bad Request`.
- Rechaza servicios con `deletedAt` no nulo → `400 Bad Request`.
- Mensaje descriptivo con IDs y razones del rechazo.

**Cliente asociado (`clientId`):**
- Verifica que el usuario exista en la base de datos.
- Rechaza usuarios con `deletedAt` no nulo → `400 Bad Request`.
- Rechaza usuarios con `status` distinto de `ACTIVE` → `400 Bad Request`.
- Mensaje descriptivo con el ID y estado del cliente.

### DTOs creados

- `src/projects/dto/find-projects-query.dto.ts` — extiende `PaginationParamsDto`, agrega `search?: string`, `location?: string`, `clientId?: string`.

### Entidades modificadas

- `src/projects/entities/project.entity.ts` — corregida la relacion `@ManyToMany` con `@JoinTable` para especificar nombres de columnas (`projectId`, `serviceId`) y compatibilidad con la migracion existente.

## Archivos creados

- `src/projects/projects.module.ts`
- `src/projects/projects.controller.ts`
- `src/projects/projects.service.ts`
- `src/projects/projects.controller.spec.ts`
- `src/projects/projects.service.spec.ts`
- `src/projects/dto/find-projects-query.dto.ts`

## Archivos modificados

- `src/app.module.ts` — importa `ProjectsModule`.
- `src/projects/entities/project.entity.ts` — corrige `@JoinTable` con nombres de columnas explicitos.

## Decisiones tecnicas

1. **Relacion ManyToMany**: se especificaron los nombres de columnas en `@JoinTable` (`projectId`, `serviceId`) para alinear con la migracion existente y evitar el error `Project_Project__Project_services.projectsId`.
2. **Validacion de servicios y clientes**: se implementaron metodos privados `validateServices()` y `validateClient()` que buscan con `withDeleted: true` para detectar entidades eliminadas o inactivas.
3. **Soft delete**: se usa `softDelete()` de TypeORM y `@DeleteDateColumn()` en la entidad, consistente con el patron de `services` y `faqs`.
4. **Paginacion**: se reutilizo `PaginationParamsDto` y `PaginatedResponse` del modulo `common`.
5. **Filtros**: `search` busca en `title` y `description` usando `ILike` con array de condiciones OR.
6. **Orden de rutas**: `GET /projects/all` se define antes que `GET /projects/:id` para evitar que NestJS interprete `"all"` como UUID.

## Validaciones realizadas

- `npm run lint`: OK, sin errores en archivos del modulo projects.
- `npm run test -- --testPathPattern=projects`: OK, 37 tests pasando (22 service + 7 controller + 8 validaciones).

## Prueba manual

### 1. Crear proyecto (ADMIN)

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Aislacion termica camara frigorifica",
    "slug": "aislacion-termica-camara-frigorifica",
    "description": "Instalacion de paneles aislantes en camara frigorifica de 200m2.",
    "location": "Buenos Aires, Argentina",
    "clientId": "uuid-cliente-valido",
    "serviceIds": ["uuid-servicio-valido"]
  }'
```

### 2. Listar proyectos activos (publico)

```bash
curl -X GET "http://localhost:3000/api/v1/projects?page=1&limit=10&search=camara&location=Buenos"
```

### 3. Listar todos los proyectos (ADMIN)

```bash
curl -X GET "http://localhost:3000/api/v1/projects/all?page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 4. Obtener proyecto por ID (publico)

```bash
curl -X GET http://localhost:3000/api/v1/projects/<UUID>
```

### 5. Actualizar proyecto (ADMIN)

```bash
curl -X PATCH http://localhost:3000/api/v1/projects/<UUID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Titulo actualizado", "serviceIds": ["uuid-servicio-valido"] }'
```

### 6. Soft delete (ADMIN)

```bash
curl -X DELETE http://localhost:3000/api/v1/projects/<UUID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Respuesta esperada: 204 No Content.

### 7. Restaurar (ADMIN)

```bash
curl -X POST http://localhost:3000/api/v1/projects/<UUID>/restore \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Respuesta esperada (200) o (409) si no estaba eliminado.

## Jira

SCRUM-XX: CRUD completo del modulo Projects con paginacion, filtros, validaciones y soft-delete.