export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ApplicationConfiguration {
  app: {
    environment: NodeEnvironment;
    port: number;
  };
  http: {
    corsOrigins: string[];
  };
  swagger: {
    enabled: boolean;
    path: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    ssl: boolean;
    synchronize: boolean;
    logging: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

const DEFAULT_PORT = 3000;
const DEFAULT_DB_PORT = 5432;
const DEFAULT_JWT_EXPIRES_IN = '15m';
const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];
const DEFAULT_SWAGGER_PATH = 'api/docs';

function readRequiredString(
  source: Record<string, unknown>,
  key: string,
): string {
  const value = source[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`La variable de entorno ${key} es obligatoria.`);
  }

  return value.trim();
}

function readInteger(
  source: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const rawValue = source[key];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0 ||
    parsedValue > 65535
  ) {
    throw new Error(
      `La variable de entorno ${key} debe ser un entero entre 1 y 65535.`,
    );
  }

  return parsedValue;
}

function readBoolean(
  source: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  const rawValue = source[key];

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  if (typeof rawValue === 'boolean') {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const normalizedValue = rawValue.trim().toLowerCase();

    if (normalizedValue === 'true') {
      return true;
    }

    if (normalizedValue === 'false') {
      return false;
    }
  }

  throw new Error(`La variable de entorno ${key} debe ser true o false.`);
}

function readCorsOrigins(
  source: Record<string, unknown>,
  environment: NodeEnvironment,
): string[] {
  const rawValue = source.CORS_ORIGINS;

  if (
    environment === 'production' &&
    (rawValue === undefined || rawValue === null || rawValue === '')
  ) {
    throw new Error(
      'La variable de entorno CORS_ORIGINS es obligatoria en producción.',
    );
  }

  const value =
    rawValue === undefined || rawValue === null || rawValue === ''
      ? DEFAULT_CORS_ORIGINS.join(',')
      : rawValue;

  if (typeof value !== 'string') {
    throw new Error(
      'La variable de entorno CORS_ORIGINS debe ser una lista separada por comas.',
    );
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error(
      'La variable de entorno CORS_ORIGINS debe contener al menos un origen.',
    );
  }

  if (origins.includes('*')) {
    throw new Error(
      'La variable de entorno CORS_ORIGINS no puede utilizar el origen global "*".',
    );
  }

  const normalizedOrigins = origins.map((origin) => {
    try {
      const parsedOrigin = new URL(origin);

      if (
        parsedOrigin.protocol !== 'http:' &&
        parsedOrigin.protocol !== 'https:'
      ) {
        throw new Error();
      }

      if (
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search.length > 0 ||
        parsedOrigin.hash.length > 0
      ) {
        throw new Error();
      }

      return parsedOrigin.origin;
    } catch {
      throw new Error(
        `El origen CORS "${origin}" debe ser una URL HTTP o HTTPS válida sin rutas adicionales.`,
      );
    }
  });

  return [...new Set(normalizedOrigins)];
}

function readSwaggerPath(source: Record<string, unknown>): string {
  const rawValue = source.SWAGGER_PATH;
  const value =
    rawValue === undefined || rawValue === null || rawValue === ''
      ? DEFAULT_SWAGGER_PATH
      : rawValue;

  if (typeof value !== 'string') {
    throw new Error(
      'La variable de entorno SWAGGER_PATH debe ser una ruta válida.',
    );
  }

  const normalizedPath = value.trim().replace(/^\/+|\/+$/g, '');

  if (
    normalizedPath.length === 0 ||
    normalizedPath.includes('//') ||
    !/^[a-zA-Z0-9/_-]+$/.test(normalizedPath)
  ) {
    throw new Error(
      'La variable de entorno SWAGGER_PATH debe contener únicamente letras, números, guiones, guiones bajos y barras.',
    );
  }

  return normalizedPath;
}

function readEnvironment(source: Record<string, unknown>): NodeEnvironment {
  const value = source.NODE_ENV ?? 'development';

  if (value !== 'development' && value !== 'test' && value !== 'production') {
    throw new Error(
      'La variable de entorno NODE_ENV debe ser development, test o production.',
    );
  }

  return value;
}

export function validateEnvironment(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const environment = readEnvironment(source);

  readInteger(source, 'PORT', DEFAULT_PORT);
  readCorsOrigins(source, environment);
  readBoolean(source, 'SWAGGER_ENABLED', environment !== 'production');
  readSwaggerPath(source);
  readRequiredString(source, 'DB_HOST');
  readInteger(source, 'DB_PORT', DEFAULT_DB_PORT);
  readRequiredString(source, 'DB_USERNAME');
  readRequiredString(source, 'DB_PASSWORD');
  readRequiredString(source, 'DB_NAME');
  readBoolean(source, 'DB_SSL', false);
  readBoolean(source, 'DB_SYNCHRONIZE', false);
  readBoolean(source, 'DB_LOGGING', false);

  const jwtSecret = readRequiredString(source, 'JWT_SECRET');

  if (jwtSecret.length < 32) {
    throw new Error(
      'La variable de entorno JWT_SECRET debe contener al menos 32 caracteres.',
    );
  }

  const jwtExpiresIn = source.JWT_EXPIRES_IN;

  if (
    jwtExpiresIn !== undefined &&
    (typeof jwtExpiresIn !== 'string' || jwtExpiresIn.trim().length === 0)
  ) {
    throw new Error(
      'La variable de entorno JWT_EXPIRES_IN no puede estar vacía.',
    );
  }

  return source;
}

export default (): ApplicationConfiguration => {
  const environment = readEnvironment(process.env);

  return {
    app: {
      environment,
      port: readInteger(process.env, 'PORT', DEFAULT_PORT),
    },
    http: {
      corsOrigins: readCorsOrigins(process.env, environment),
    },
    swagger: {
      enabled: readBoolean(
        process.env,
        'SWAGGER_ENABLED',
        environment !== 'production',
      ),
      path: readSwaggerPath(process.env),
    },
    database: {
      host: readRequiredString(process.env, 'DB_HOST'),
      port: readInteger(process.env, 'DB_PORT', DEFAULT_DB_PORT),
      username: readRequiredString(process.env, 'DB_USERNAME'),
      password: readRequiredString(process.env, 'DB_PASSWORD'),
      name: readRequiredString(process.env, 'DB_NAME'),
      ssl: readBoolean(process.env, 'DB_SSL', false),
      synchronize: readBoolean(process.env, 'DB_SYNCHRONIZE', false),
      logging: readBoolean(process.env, 'DB_LOGGING', false),
    },
    jwt: {
      secret: readRequiredString(process.env, 'JWT_SECRET'),
      expiresIn:
        typeof process.env.JWT_EXPIRES_IN === 'string' &&
        process.env.JWT_EXPIRES_IN.trim().length > 0
          ? process.env.JWT_EXPIRES_IN.trim()
          : DEFAULT_JWT_EXPIRES_IN,
    },
  };
};
