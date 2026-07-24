# Guía de Configuración Local - AislaFrioPro Backend

Esta guía detalla los pasos necesarios para levantar el entorno de desarrollo y la base de datos de manera nativa en tu máquina.

## Prerrequisitos

- **Node.js**: Instalado en tu sistema (v18+ recomendado).
- **PostgreSQL**: Instalado de forma nativa en tu sistema (puedes descargarlo desde [postgresql.org/download](https://www.postgresql.org/download/)). Asegúrate de que herramientas como **pgAdmin** se instalen también (sólo dale a todo "Siguiente" en el instalador normal).

## 1. Configuración de la Base de Datos Local (Vía psql / SQL Shell)

1. Abre el programa **SQL Shell (psql)** desde el menú de inicio de Windows.
2. La consola te pedirá varios parámetros (Server, Database, Port, Username). **Presiona la tecla Enter** en todos para aceptar los valores por defecto que salen entre corchetes `[]`.
3. Al llegar a `Contraseña para usuario postgres:`, escribe la contraseña que le asignaste al instalar PostgreSQL y luego presiona Enter (nota: no se verá que escribes nada, pero sí lo está tomando).
4. Verás que la consola cambia a algo como `postgres=#`. Escribe el siguiente comando y dale Enter:
   ```sql
   CREATE DATABASE aislafriopro;
   ```
5. Si ves el mensaje `CREATE DATABASE`, ¡fue exitoso! Escribe `\q` y presiona Enter para salir.

## 2. Variables de Entorno del Proyecto (.env)

1. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
2. Tienes un archivo llamado `.env.example` en el código. Cópialo y pégalo cambiándole el nombre a solamente `.env`.
3. Ábrelo y ubica la sección de `## DATABASE`. Modifícalo de la siguiente forma reemplazando únicamente el password por la contraseña con la que entraste hace un momento a PostgreSQL:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=LA_CONTRASEÑA_QUE_PUSISTE_EN_LA_CONSOLA_PSQL
   DB_NAME=aislafriopro
   DB_SSL=false
   DB_SYNCHRONIZE=false
   ```

## 3. Ejecutar Migraciones (Crear las Tablas)

Para que tu base de datos vacía se llene con las tablas del sistema Aisla Frío Pro, ejecuta el siguiente comando en la terminal de tu proyecto:

```bash
npm run migration:run
```

## 4. Levantar la API y Verla en Swagger

Con la base lista, levanta tu servidor local con el modo de autorecarga:

```bash
npm run start:dev
```

**Para probar tus Endpoints en Swagger:**
Una vez la consola verde te advierta que inició en el puerto 3000, simplemente abre tu navegador de preferencia (Chrome/Edge/etc.) e ingresa a esta URL:

**http://localhost:3000/api/docs**

Allí encontrarás la documentación interactiva de la API con Swagger, donde podrás revisar todos los endpoints, qué datos reciben, probarlos enviando el Token, y verificar la salida del sistema.

---
## Notas: Producción a Supabase (Más Adelante)

Cuanto el sistema vaya a Internet, no habrá que re-escribir lógica del backend. Dado que Supabase aporta un motor Postgres, el cambio radicará en que modificarás las variables del archivo `.env` (el Host, Usuario y Password de allí), y asignarás `DB_SSL=true`.
