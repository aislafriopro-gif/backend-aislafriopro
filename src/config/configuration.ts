export type NodeEnvironment = 'development' | 'test' | 'production';

export interface ApplicationConfiguration {
  app: {
    environment: NodeEnvironment;
    port: number;
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
  readEnvironment(source);
  readInteger(source, 'PORT', DEFAULT_PORT);
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

export default (): ApplicationConfiguration => ({
  app: {
    environment: readEnvironment(process.env),
    port: readInteger(process.env, 'PORT', DEFAULT_PORT),
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
});
