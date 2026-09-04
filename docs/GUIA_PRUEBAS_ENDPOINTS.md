# Guía de pruebas de API - Aisla Frío Pro

> Manual práctico para ejecutar pruebas manuales desde Swagger sobre el código actual del backend. La URL base de la API es `http://localhost:3000/api/v1` y la documentación interactiva está en `http://localhost:3000/api/docs`.
>
> Los ejemplos de esta guía usan únicamente campos definidos por los DTO del proyecto. Los UUID de las respuestas son ilustrativos: **no los copies**; reemplázalos por los valores reales devueltos por tu instancia.

## 1. Requisitos previos

### 1.1 Instalar y levantar el backend

1. Tener Node.js, npm y PostgreSQL instalados.
2. Desde la raíz del proyecto ejecutar `npm install`.
3. Crear/configurar el archivo `.env` con la conexión a PostgreSQL, JWT y, si se probarán cargas de imágenes, Cloudinary.
4. Crear la base de datos indicada por `DB_NAME`.
5. Ejecutar las migraciones con `npm run migration:run`.
6. Si se necesitan usuarios/roles iniciales, ejecutar `npm run seed`. Verifica primero los valores de seed y sus contraseñas en el entorno local; no asumas credenciales en otro ambiente.
7. Levantar el modo desarrollo con `npm run start:dev`.

El proyecto usa PostgreSQL y TypeORM. Si la base no está disponible, el proceso puede no iniciar o el health check puede informar que la base está caída. El backend usa el puerto configurado por `APP_PORT` (normalmente `3000`).

### 1.2 Variables de entorno

La configuración se lee desde `src/config/configuration.ts`. Confirma allí los nombres y valores por defecto de tu checkout. Como mínimo deben estar disponibles:

- Configuración de aplicación/HTTP: puerto, entorno y orígenes CORS.
- PostgreSQL: host, puerto, usuario, contraseña, nombre de base, SSL, sincronización y logging.
- JWT: secreto de acceso, duración del access token, secreto de refresh y duración del refresh token.
- Swagger: habilitado y ruta (`api/docs`).
- Cloudinary: cloud name, API key, API secret y tamaño máximo de imagen, si se prueban endpoints multipart.

No publiques secretos reales ni los pegues en tickets. Si Swagger está deshabilitado, la URL de documentación no estará disponible aunque el servidor esté funcionando.

### 1.3 Comprobaciones iniciales

1. Abrir `http://localhost:3000/api/docs`.
2. Ejecutar `GET /api/v1/health` desde Swagger. Debe devolver `200` cuando la aplicación puede consultar PostgreSQL; el cuerpo informa el estado y el tiempo de respuesta de la base. Si la base no está disponible, puede devolver `503`.
3. Ejecutar `GET /api/v1/`. Debe devolver la respuesta textual del controlador raíz (en el estado actual suele ser `Hello World!`).
4. Una respuesta `200 OK` significa que la operación terminó correctamente; no significa necesariamente que exista información en la colección: una lista puede devolver `data: []`.

### 1.4 Autorización en Swagger

1. Ejecutar `POST /api/v1/auth/login` con un usuario válido.
2. Copiar solamente el valor `accessToken`.
3. Presionar **Authorize** en Swagger.
4. Pegar el token según el formato que solicite el cuadro (normalmente `Bearer <token>`; no lo dupliques si Swagger ya agrega `Bearer`).
5. Presionar **Authorize** y luego **Close**.

El access token tiene una duración limitada. Cuando expire, usar `POST /api/v1/auth/refresh` con el `refreshToken`, volver a autorizar Swagger con el nuevo access token y continuar. Para probar `GET /work-orders/my` se necesita un token de un usuario cuyo rol sea `TECHNICIAN`; para las operaciones administrativas, uno con rol `ADMIN`.

## 2. Conceptos básicos para realizar las pruebas

- **GET:** consulta datos; normalmente no lleva body.
- **POST:** crea un recurso o ejecuta una acción.
- **PUT/PATCH:** este backend usa `PATCH` para modificar parcialmente un recurso.
- **DELETE:** elimina; en varias entidades es una eliminación lógica. Los endpoints documentados como `204` no devuelven body.
- **Headers:** metadatos de la petición. El más importante aquí es `Authorization`.
- **Body:** datos enviados en JSON o, para proyectos/productos, `multipart/form-data`.
- **Path parameter:** valor dentro de la ruta, por ejemplo `:id`; debe ser un UUID real obtenido previamente.
- **Query parameter:** filtros/paginación después de `?`, como `page=1&limit=10`.
- **Status codes:** `201` creación exitosa, `200` consulta/actualización exitosa, `204` operación exitosa sin contenido, `400` validación o datos incorrectos, `401` falta de autenticación/token inválido, `403` rol insuficiente, `404` recurso inexistente, `409` conflicto de unicidad/estado y `5xx` fallo del servidor o dependencia.
- **2xx:** éxito; **4xx:** error atribuible a la petición/autorización; **5xx:** error del servidor o de infraestructura.
- **Bearer token:** JWT enviado en `Authorization` para demostrar la identidad.
- **ID:** cada registro tiene un UUID. Guarda cada UUID que devuelva un `POST` o un listado.
- **ValidationPipe:** el backend transforma tipos y rechaza propiedades no declaradas (`whitelist` y `forbidNonWhitelisted`). Si Swagger envía un campo extra, espera `400`.

## 3. Orden recomendado de pruebas punta a punta

Realiza primero las pruebas públicas y después las protegidas. Mantén una hoja con estas variables: `adminAccessToken`, `adminRefreshToken`, `clientUserId`, `clientId`, `technicianUserId`, `serviceId`, `productId`, `projectId`, `quoteRequestId`, `faqId`, `settingId` y `workOrderId`.

1. Verificar `GET /health` y `GET /`.
2. Registrar un usuario CLIENT con `POST /auth/register` o utilizar un CLIENT creado por el seed.
3. Iniciar sesión con `POST /auth/login`; guardar ambos tokens.
4. Probar `GET /users/me` y `POST /auth/refresh`. Si se prueba logout, hacerlo al final de un escenario porque revoca el refresh token utilizado.
5. Iniciar sesión con el usuario ADMIN del seed (o con el mecanismo administrativo disponible). Autorizar Swagger con su `accessToken`.
6. Ejecutar `GET /roles` y guardar los UUID de roles ADMIN, CLIENT y TECHNICIAN. No inventes `roleId`.
7. Crear un usuario TECHNICIAN mediante `POST /users` y asignarle el rol con `PATCH /users/:id/role`; guardar `technicianUserId`. Si se necesita un cliente nuevo y el proyecto crea automáticamente su perfil CLIENT, registrar/crear ese usuario y confirmar el perfil con `GET /clients`.
8. Probar servicios: `POST /services`, guardar `serviceId`, y verificar `GET /services` y `GET /services/:id`.
9. Probar FAQs y configuraciones del sitio; guardar `faqId` y `settingId`.
10. Crear un producto con `POST /products` (multipart/form-data), guardar `productId`, y comprobarlo con los GET públicos. Para que aparezca en el listado público debe quedar publicado según el estado inicial/configuración real; el controlador no ofrece en este inventario un endpoint específico para cambiar `isPublished`.
11. Crear un proyecto con `POST /projects` (multipart/form-data), usando el `clientId` válido y, si corresponde, `serviceIds` con un string JSON como `["UUID_REAL"]`; guardar `projectId`. Probar sus tres consultas públicas.
12. Crear una cotización con `POST /quote-requests`, opcionalmente usando `serviceId`; guardar `quoteRequestId`. Después, como ADMIN, listar, consultar detalle, añadir nota y cambiar estado.
13. Crear una consulta de producto con `POST /product-inquiries` usando `productId` real.
14. Crear una orden con `POST /work-orders`, usando `clientId` real, `technicianId` real y opcionalmente `quoteRequestId`; guardar `workOrderId`.
15. Como ADMIN, listar/consultar/editar la orden y probar sus transiciones de estado. Como TECHNICIAN, iniciar sesión con el técnico y ejecutar `GET /work-orders/my`.
16. Ejecutar `GET /dashboard/stats` con un token autenticado.
17. Probar al final las operaciones destructivas: soft delete, listados `all`, restauraciones y logout. Repite los GET para comprobar si el registro deja de aparecer en el listado público.

**Regla de continuidad:** cada vez que una respuesta contenga un UUID, guárdalo con su nombre. El siguiente endpoint debe usar el UUID real, no un ejemplo.

## 4. Preparación de datos

Usa valores únicos para evitar conflictos entre ejecuciones:

| Dato | Valor sugerido |
|---|---|
| Nombre admin seed | El definido en el `.env`/seed |
| Email CLIENT | `qa.client+20260902@example.com` |
| Email TECHNICIAN | `qa.technician+20260902@example.com` |
| Email solicitud | `qa.request+20260902@example.com` |
| Teléfono | `+5491123456789` |
| Contraseña | Una de al menos 8 caracteres, por ejemplo `QaPass2026!` |
| Servicio | `Mantenimiento preventivo QA` |
| Slug servicio | Se genera/normaliza según el servicio; usa la respuesta real |
| Producto | `Filtro QA 2026` |
| Slug producto | `filtro-qa-2026` |
| Proyecto | `Instalación QA 2026` |
| Slug proyecto | `instalacion-qa-2026` |
| Mensaje | `Necesito una cotización para revisar el equipo del local.` |
| Material | `{ "name": "Caño de cobre", "quantity": "10 m" }` |

Los valores de email, slug y key deben ser nuevos en cada corrida o debes borrar/restaurar los datos de prueba según corresponda. **Si un endpoint devuelve un ID UUID, guardá este ID porque lo vamos a necesitar en los siguientes endpoints.**

## 5. Pruebas por módulo

En cada caso: abrir Swagger, localizar la etiqueta, abrir el método, presionar **Try it out**, completar parámetros/body, presionar **Execute** y registrar status, body y tiempo de respuesta.

### 5.1 Health y raíz

#### Test H1 - Health

- `GET /api/v1/health` — público.
- Esperado: `200` si PostgreSQL está operativo; `503` si una dependencia está caída. Comprueba `status`, `timestamp` y el servicio `database`.
- Si falla, no continúes con pruebas que escriban datos: revisa PostgreSQL, credenciales y migraciones.

#### Test H2 - Raíz

- `GET /api/v1/` — público.
- Esperado: `200` y una respuesta textual del controlador raíz.

### 5.2 Auth y sesiones

#### Test A1 - Registrar usuario

`POST /api/v1/auth/register` — público, `201`.

```json
{
  "name": "QA Cliente",
  "email": "qa.client+20260902@example.com",
  "phone": "+5491123456789",
  "password": "QaPass2026!"
}
```

Guarda `id`. Espera email, nombre, rol, fecha y mensaje de registro; la contraseña no debe aparecer. Repite con el mismo email para comprobar `409`; usa un email inválido o una contraseña corta para comprobar `400`.

#### Test A2 - Login

`POST /api/v1/auth/login` — público, `200`.

```json
{
  "email": "qa.client+20260902@example.com",
  "password": "QaPass2026!"
}
```

Guarda `accessToken` y `refreshToken`. Autoriza Swagger con el access token. Prueba también contraseña incorrecta: debe devolver `401`.

#### Test A3 - Refresh

`POST /api/v1/auth/refresh` — público, `200`.

```json
{ "refreshToken": "PEGAR_REFRESH_TOKEN_REAL" }
```

Guarda el nuevo par de tokens y vuelve a autorizar Swagger. Un token vencido, alterado o inexistente debe fallar con `401`.

#### Test A4 - Logout

`POST /api/v1/auth/logout` — público, `204`.

```json
{ "refreshToken": "REFRESH_TOKEN_REAL" }
```

No esperes contenido. Después intenta refrescar ese token y registra el resultado real de revocación.

### 5.3 Users

#### Test U1 - Crear usuario

`POST /api/v1/users` — el controlador lo expone públicamente, `201`.

```json
{
  "name": "QA Técnico",
  "email": "qa.technician+20260902@example.com",
  "password": "QaPass2026!"
}
```

Guarda el `id` como `technicianUserId`. El DTO de creación no incluye teléfono ni rol; el rol/status iniciales dependen de la implementación/seed. Usa el endpoint administrativo de rol con un `roleId` real para dejarlo como TECHNICIAN.

#### Test U2 - Mi perfil

`GET /api/v1/users/me` — autenticado, `200`. Comprueba que corresponde al token usado.

#### Test U3 - Listar usuarios

`GET /api/v1/users` — ADMIN, `200`. Prueba `page=1`, `limit=10`, y filtros `role`, `status`, `search` e `includeDeleted`. Espera `{data,total,page,limit,hasMore}`.

#### Test U4 - Obtener usuario

`GET /api/v1/users/:id` — ADMIN, `200`. Usa `technicianUserId`; un UUID inexistente devuelve `404`.

#### Test U5 - Actualizar usuario

`PATCH /api/v1/users/:id` — propietario o ADMIN, `200`.

```json
{
  "name": "QA Técnico Actualizado",
  "phone": "+5491123456789"
}
```

Todos los campos son opcionales. Prueba email duplicado (`409`) y acceso con otro usuario (`403`).

#### Test U6 - Rol y estado

- `PATCH /users/:id/role` — ADMIN, `200`: `{ "roleId": "ROLE_UUID_REAL" }`.
- `PATCH /users/:id/status` — ADMIN, `200`: `{ "status": "ACTIVE" }` (también `INACTIVE` o `SUSPENDED`).

Después inicia sesión nuevamente con el técnico y comprueba `GET /work-orders/my`.

#### Test U7 - Eliminar, listar eliminados y restaurar

- `DELETE /users/:id` — ADMIN, `204`; es soft delete.
- `GET /users?includeDeleted=true` — comprueba el registro eliminado.
- `PATCH /users/:id/restore` — ADMIN, `200`; espera `deletedAt: null`.

### 5.4 Roles

`GET /roles`, `GET /roles/:id`, `GET /roles/deleted?page=1&limit=10`, `DELETE /roles/:id` y `PATCH /roles/:id/restore` son solo ADMIN. Todos los GET exitosos devuelven roles o una respuesta paginada. Para las operaciones destructivas usa únicamente un rol creado para QA: los roles base pueden ser necesarios para el resto de pruebas. Guarda los UUID que devuelve `GET /roles`; son necesarios para asignar roles.

### 5.5 Services

#### Test S1 - Crear y consultar

`POST /api/v1/services` — ADMIN, `201`.

```json
{
  "name": "Mantenimiento preventivo QA",
  "description": "Revisión preventiva de equipos de climatización.",
  "shortDescription": "Revisión preventiva",
  "imageUrl": "https://example.com/servicio-qa.jpg",
  "isActive": true,
  "displayOrder": 1
}
```

Guarda `serviceId` y el `slug` devuelto. Luego prueba `GET /services?page=1&limit=10&search=Mantenimiento` y `GET /services/:id` como público. Espera solo servicios activos/no eliminados.

#### Test S2 - Actualizar, reordenar y borrar

- `PATCH /services/:id` — ADMIN; envía, por ejemplo, `{ "shortDescription": "Revisión QA actualizada" }`.
- `PATCH /services/reorder` — ADMIN, `204`: `{ "orderedIds": ["SERVICE_UUID_REAL"] }`.
- `GET /services/all` — ADMIN; incluye registros no públicos/eliminados.
- `DELETE /services/:id` — ADMIN, `204`; comprueba que el GET público ya no lo devuelve.

### 5.6 FAQs

`POST /api/v1/faqs` — ADMIN, `201`.

```json
{
  "question": "¿La revisión preventiva requiere visita?",
  "answer": "El equipo técnico confirma el alcance antes de realizarla.",
  "displayOrder": 1,
  "isActive": true
}
```

Guarda `faqId`. Prueba `GET /faqs?page=1&limit=10&search=preventiva` y `GET /faqs/:id` como público; `GET /faqs/all` como ADMIN; `PATCH /faqs/:id` con `{ "isActive": false }`; y finalmente `DELETE /faqs/:id` (`204`). Verifica en la respuesta real si la eliminación es lógica y cómo se refleja en `all`.

### 5.7 Products

Los endpoints de alta/edición usan `multipart/form-data`, no JSON. En Swagger pulsa **Try it out**, completa los campos de texto y selecciona `imageFiles` si vas a probar Cloudinary. No subas más de 10 imágenes ni excedas el tamaño configurado.

- `POST /api/v1/products` — ADMIN, `201`.
  - `name`: `Filtro QA 2026`
  - `slug`: `filtro-qa-2026`
  - `description`: `Filtro para prueba de catálogo.`
  - `price`: `12500.50`
  - `imageFiles`: opcional.

Guarda `productId`. El producto se crea con `status` e `isPublished` según sus valores iniciales del backend; consulta la respuesta. Comprueba:

- `GET /products?page=1&limit=10&search=Filtro` — público, lista publicados/activos.
- `GET /products/:id` — público.
- `GET /products/by-slug/:slug` — público, usa el slug de respuesta.
- `GET /products/all?page=1&limit=10&status=ACTIVE&isPublished=false` — ADMIN.
- `PATCH /products/:id` — ADMIN multipart; envía al menos un campo real, por ejemplo `description`, o una imagen nueva.
- `DELETE /products/:id` — ADMIN, `204`; verifica el efecto con `all` y con el listado público.

Un precio no positivo, con demasiados decimales, un slug repetido o más imágenes que el máximo debe producir un error de validación/conflicto.

### 5.8 Projects

También usa `multipart/form-data`. Requiere un `clientId` válido y permite relacionar servicios existentes.

`POST /api/v1/projects` — ADMIN, `201`:

- `title`: `Instalación QA 2026`
- `slug`: `instalacion-qa-2026`
- `description`: `Proyecto de instalación para pruebas.`
- `location`: `Buenos Aires`
- `completionDate`: `2026-09-02`
- `clientId`: `CLIENT_PROFILE_UUID_REAL`
- `clientDisplayName`: `QA Cliente`
- `serviceIds`: `["SERVICE_UUID_REAL"]` como **texto** JSON
- `coverFile`, `beforeFile`, `afterFile`: opcionales, un archivo por campo.

Guarda `projectId` y el slug. Espera imágenes, servicios y cliente en la respuesta. Luego prueba:

- `GET /projects?page=1&limit=10&search=Instalación` — público.
- `GET /projects/:id` — público.
- `GET /projects/by-slug/:slug` — público.
- `GET /projects/all?page=1&limit=10` — ADMIN.
- `PATCH /projects/:id` — ADMIN multipart; campos opcionales y archivos nuevos. El código indica que las imágenes anteriores no se borran automáticamente.
- `POST /projects/:id/restore` — ADMIN, `200`.
- `DELETE /projects/:id` — ADMIN, `204`.

Para probar errores, usa un `clientId`, `serviceId` o slug inexistente; no sustituyas un UUID real por texto inventado en la prueba positiva.

### 5.9 Quote requests

#### Test Q1 - Crear solicitud pública

`POST /api/v1/quote-requests` — público, `201`.

```json
{
  "name": "QA Solicitante",
  "email": "qa.request+20260902@example.com",
  "phone": "+5491123456789",
  "message": "Necesito una cotización para revisar el equipo del local.",
  "serviceId": "SERVICE_UUID_REAL",
  "materials": "Revisar aislación y conexiones"
}
```

`serviceId` es opcional; si lo envías, debe ser el UUID real de un servicio. Guarda `quoteRequestId` y el status inicial (normalmente `NEW`).

#### Test Q2 - Gestionar solicitud como ADMIN

- `GET /quote-requests?page=1&limit=10&status=NEW` — lista paginada, ordenada por creación descendente.
- `GET /quote-requests/:id` — detalle con notas.
- `POST /quote-requests/:id/notes` — `201`: `{ "content": "Contactar al solicitante para coordinar visita." }`.
- `PATCH /quote-requests/:id/status` — `200`: `{ "status": "IN_PROGRESS" }`, luego `RESOLVED` o `REJECTED` según el escenario.

Guarda el ID de la nota si aparece. Un ID de solicitud inexistente debe devolver `404` y un status fuera del enum debe devolver `400`.

### 5.10 Product inquiries

`POST /api/v1/product-inquiries` — público, `201`.

```json
{
  "productId": "PRODUCT_UUID_REAL",
  "name": "QA Interesado",
  "email": "qa.inquiry+20260902@example.com",
  "phone": "+5491123456789",
  "message": "¿Cuál es el plazo de entrega de este producto?"
}
```

Usa el `productId` guardado en Products. Espera `id`, `productId`, `createdAt` y mensaje de confirmación. Un producto inexistente debe fallar.

### 5.11 Clients

No hay un POST de clientes en el controlador: el perfil CLIENT se vincula al flujo de usuarios/seed según la implementación. Por eso no inventes `POST /clients`.

- `GET /api/v1/clients?page=1&limit=10` — ADMIN, devuelve clientes con datos resumidos del usuario. Guarda un `clientId` de la respuesta; este es el ID que necesita Projects y Work Orders, no necesariamente el `userId`.
- `GET /api/v1/clients/me` — autenticado. Pruébalo con el token del usuario CLIENT y espera su perfil; con un usuario sin perfil CLIENT puede devolver `404`.
- `GET /api/v1/clients/:id` — ADMIN; usa el `clientId` guardado y espera el detalle.

### 5.12 Work orders

Requiere `clientId` de perfil CLIENT. El `technicianId` es el ID del usuario con rol TECHNICIAN; ambos son IDs distintos y deben obtenerse de sus respectivos GET.

#### Test W1 - Crear orden

`POST /api/v1/work-orders` — ADMIN, `201`.

```json
{
  "clientId": "CLIENT_PROFILE_UUID_REAL",
  "technicianId": "TECHNICIAN_USER_UUID_REAL",
  "quoteRequestId": "QUOTE_REQUEST_UUID_REAL"
}
```

`technicianId` y `quoteRequestId` son opcionales. Guarda `workOrderId`.

#### Test W2 - Consultar y filtrar

- `GET /work-orders?page=1&limit=10` — ADMIN.
- Repetir con `clientId`, `technicianId`, `quoteRequestId` y `status=PENDING`.
- `GET /work-orders/:id` — ADMIN, detalle con relaciones.
- Iniciar sesión como técnico y ejecutar `GET /work-orders/my` — solo TECHNICIAN; espera las órdenes asignadas a ese usuario.

#### Test W3 - Editar y cambiar estados

`PATCH /work-orders/:id` — ADMIN:

```json
{
  "workDone": "Se realizó la revisión inicial.",
  "observations": "Continuar con medición en la próxima visita.",
  "materials": [
    { "name": "Caño de cobre", "quantity": "10 m" }
  ]
}
```

`PATCH /work-orders/:id/status` — ADMIN:

```json
{ "status": "IN_PROGRESS" }
```

Continúa con `COMPLETED` y registra qué transiciones acepta la instancia (`PENDING`, `IN_PROGRESS`, `COMPLETED`). Si el servicio rechaza una transición, documenta `400`; no fuerces estados directamente en la base.

### 5.13 Site settings

- `GET /api/v1/site-settings/public` — público; devuelve la configuración pública disponible o un objeto vacío si no hay registros. No asumas nombres de claves: usa los que estén presentes en la respuesta/Swagger.
- `GET /site-settings?page=1&limit=10` — ADMIN; guarda `settingId` de una configuración.
- `POST /site-settings` — ADMIN, `201`:

```json
{
  "key": "qa_contact_phone",
  "value": "+5491123456789",
  "type": "STRING",
  "description": "Teléfono usado en pruebas QA"
}
```

- `GET /site-settings/:id` — ADMIN; usa `settingId` real.
- `PATCH /site-settings/:id` — ADMIN, por ejemplo `{ "value": "+5491199999999" }`.
- `DELETE /site-settings/:id` — ADMIN, `204`.

Prueba los tipos `STRING`, `NUMBER`, `BOOLEAN` y `JSON` según las opciones que Swagger muestre. Una `key` repetida debe producir `409`.

### 5.14 Dashboard

`GET /api/v1/dashboard/stats` — autenticado, `200`.

Ejecuta con ADMIN después de crear algunos registros. Compara los totales y agrupaciones por estado con lo que devolvieron los listados de usuarios, cotizaciones y órdenes. Luego prueba sin token (`401`). No inventes campos: registra exactamente la estructura que devuelva Swagger/tu instancia.

## 6. Pruebas transversales y negativas

Para cada endpoint protegido repite, cuando sea seguro:

1. Sin `Authorization`: espera `401`.
2. Con token válido pero rol incorrecto: espera `403` si el endpoint restringe rol.
3. Con UUID inexistente: espera `404` o el error de relación indicado por el servicio.
4. Con body incompleto, email inválido, enum inválido o formato de teléfono inválido: espera `400`.
5. Con una propiedad adicional: espera `400` por `forbidNonWhitelisted`.
6. En endpoints paginados, prueba `page=1`, `limit=1`, una página fuera del rango y filtros que no coincidan; valida `total`, `data` y `hasMore`.
7. En endpoints públicos después de un soft delete, comprueba que el registro deja de mostrarse; en endpoints `all`/`includeDeleted`, comprueba el comportamiento administrativo real.

## 7. Registro de resultados QA

Para cada prueba anota: fecha, endpoint, método, token/rol usado, datos enviados, UUIDs utilizados, status HTTP, body recibido, tiempo de respuesta, resultado esperado/obtenido y evidencia (captura o exportación de Swagger). Un `204` correcto se valida por el status y por una consulta posterior; no esperes JSON en su response body.

## 8. Criterio de finalización

La corrida se considera completa cuando se ejecutaron todos los métodos listados en este documento, se validaron al menos un caso positivo y uno negativo por grupo, se comprobaron las relaciones con IDs reales (cliente–proyecto–orden, servicio–cotización, producto–consulta), se probaron los roles ADMIN/CLIENT/TECHNICIAN donde corresponda y se dejaron documentados los errores de infraestructura separados de los errores funcionales.
