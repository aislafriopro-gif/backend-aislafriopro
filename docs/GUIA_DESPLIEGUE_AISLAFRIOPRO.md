# Guía de Despliegue — AislaFrioPro Backend

## 1. Arquitectura de despliegue actual

```
Frontend (Next.js)  →  Backend (NestJS)  →  Base de datos (PostgreSQL)
      Vercel                Render              Supabase
                               ↓
                          Cloudinary (media)
```

| Componente     | Plataforma           | URL / Referencia |
|----------------|-----------------------|-------------------|
| Frontend       | Vercel                | https://aislafriopro-frontend-gl2m7djwx-aislafriopro.vercel.app/ |
| Backend        | Render                | https://backend-aislafriopro.onrender.com |
| API base       | —                      | https://backend-aislafriopro.onrender.com/api/v1 |
| Swagger        | Render                | https://backend-aislafriopro.onrender.com/api/docs |
| Base de datos  | Supabase (Postgres)   | https://supabase.com/dashboard/project/eoitxsgvpaeafxfplrzq |
| Media/imágenes | Cloudinary             | https://console.cloudinary.com/app/c-6cde41fd160f61a5f944f0781b4a43/home/dashboard |

---

## 2. Backend — Render

- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`
- Root directory: raíz del repo
- Rama con auto-deploy:  `main` 
- Health check path: `/api/v1/health` 

---

## 3. Base de datos — Supabase

En el grupo de WhatsApp está el archivo con los valores necesarios para las variables de entornos

```env
DB_HOST=<host-de-supabase>
DB_PORT=5432          # o 6543 si se usa el pooler de PgBouncer
DB_USERNAME=postgres
DB_PASSWORD=<password-de-supabase>
DB_NAME=postgres      # o el nombre que asigne el proyecto Supabase
DB_SSL=true
DB_SYNCHRONIZE=false  # nunca true en producción
```

Notas:

- Supabase expone conexión **directa** y **pooler (PgBouncer)**. Para un backend en Render (reinicios, conexiones cortas), conviene usar el connection string del **pooler**.
- Se configuró el deploy para que las migraciones se ejecuten automáticamente una vez subidas a `main` 

---

## 4. Variables de entorno (backend)

Compiladas desde `LOCAL_SETUP.md`, `MEDIA_SERVICE.md` y la arquitectura oficial (JWT + Refresh Token). 

```env
# App
NODE_ENV=production
PORT=                 # Render lo inyecta vía process.env.PORT

# Base de datos (Supabase)
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_SSL=true
DB_SYNCHRONIZE=false

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_MAX_IMAGE_SIZE_BYTES=5242880

# CORS / Frontend
CORS_ORIGIN=https://aislafriopro-frontend-gl2m7djwx-aislafriopro.vercel.app
```

**⚠️ Importante para Frontend:** si Vercel genera una URL de preview distinta en cada deploy (comportamiento por defecto), `CORS_ORIGIN` en el backend debe contemplar el dominio de producción fijo de Vercel, no solo esta URL de preview puntual — si no, van a aparecer errores de CORS al integrar.

---

## 5. Cloudinary

- Variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- Formatos permitidos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Tamaño máximo configurable vía `CLOUDINARY_MAX_IMAGE_SIZE_BYTES` (default 5MB).

---

## 6. Frontend — Vercel

- URL actual: https://aislafriopro-frontend-gl2m7djwx-aislafriopro.vercel.app/
- Commit base establecido: `6cff1de`
- Variable de entorno necesaria en el Frontend para apuntar al backend de Render:

```env
NEXT_PUBLIC_API_URL=https://backend-aislafriopro.onrender.com/api/v1
```

---

## 7. Dominio y SSL

**Estado actual:** el proyecto **no tiene dominio propio todavía**. Se opera sobre los subdominios que asignan las plataformas:

- Backend: `*.onrender.com` — SSL automático (Let's Encrypt) gestionado por Render.
- Frontend: `*.vercel.app` — SSL automático gestionado por Vercel.

No hay ninguna acción manual de SSL pendiente mientras se use esta configuración.

---

## 8. Checklist de verificación post-deploy

- [ ] `GET https://backend-aislafriopro.onrender.com/api/v1/health` responde 200
- [ ] Swagger accesible en `/api/docs`
- [ ] Login (`POST /api/v1/auth/login`) funciona y devuelve access + refresh token
- [ ] El Frontend en Vercel puede llamar al backend sin error de CORS
- [ ] Subida de imagen de prueba llega a Cloudinary y queda registrada en la tabla `media`
- [ ] Migraciones corridas contra la BD de Supabase productiva (no la de desarrollo)