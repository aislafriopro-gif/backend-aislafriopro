# Verificación de roles base

## Roles verificados

Se verificó la existencia de los siguientes roles:

- `ADMIN`
- `CLIENT`
- `TECHNICIAN`

También se confirmó la existencia de `USER`, utilizado actualmente como rol por defecto del sistema.

## Archivos revisados

- `src/roles/entities/roles.entity.ts`
- `src/database/seeds/seed.ts`
- `src/roles/roles.service.ts`
- `src/users/users.controller.ts`
- `src/users/users.service.ts`

## Verificaciones realizadas

Se ejecutó el seed para asegurar la existencia de los roles base en la tabla `roles`.

También se verificó desde Swagger:

- `GET /roles`
- `PATCH /users/{id}/role`

La asignación de rol a usuario respondió correctamente usando el `roleId` de un rol existente.

## Resultado

Los roles `ADMIN`, `CLIENT` y `TECHNICIAN` existen en base de datos y pueden asignarse a usuarios.

Swagger muestra los roles disponibles a través de los endpoints existentes y permite validar la asignación de roles sin crear endpoints nuevos.
