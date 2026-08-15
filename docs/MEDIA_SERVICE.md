# Media Service

El módulo `media` centraliza la integración con Cloudinary y el manejo seguro de imágenes.

## Responsabilidades

- Configurar Cloudinary desde variables de entorno.
- Validar archivos antes de subirlos.
- Subir imágenes a Cloudinary.
- Guardar metadata en la tabla `media`.
- Eliminar imágenes de forma segura usando `publicId`.
- Mantener sincronizados Cloudinary y la base de datos.

## Subida de imágenes

El método `uploadImage` recibe un archivo en memoria con:

- `buffer`
- `mimetype`
- `size`
- `originalname`

Antes de subir valida:

- que exista archivo;
- que sea una imagen permitida;
- que no supere el tamaño máximo configurado.

Formatos permitidos:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Luego sube la imagen a Cloudinary y guarda metadata como:

- `publicId`
- `url`
- `secureUrl`
- `format`
- `resourceType`
- `width`
- `height`
- `bytes`
- `originalName`
- `uploadedById`

Si Cloudinary sube correctamente pero falla el guardado en base de datos, se elimina el asset recién subido para evitar archivos huérfanos.

## Eliminación segura

El método `deleteImage` elimina imágenes usando `publicId`.

El flujo es:

1. Validar que el `publicId` exista.
2. Buscar la metadata en base de datos.
3. Eliminar el asset en Cloudinary.
4. Si Cloudinary confirma la eliminación, aplicar `softDelete` al registro `Media`.

La metadata no se elimina físicamente porque `Media` usa `DeleteDateColumn`.

## Variables de entorno

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_MAX_IMAGE_SIZE_BYTES=5242880
```

También se permite configuración local usando:

```
CLOUDINARY_CLOUD_NAME=change-me
CLOUDINARY_API_KEY=change-me
CLOUDINARY_API_SECRET=change-me
```
