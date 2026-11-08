import dotenv from 'dotenv';

dotenv.config();

export type NodeEnv = 'development' | 'staging' | 'production' | 'test';
export type QueueDriver = 'in-memory' | 'bullmq';
export type StorageDriver = 'local' | 's3';
export type PaymentGatewayProvider = 'mock' | 'zarinpal' | 'zibal' | 'idpay' | 'nextpay';

export interface AppEnvConfig {
  nodeEnv: NodeEnv;
  port: number;
  appName: string;
  appUrl: string;
  publicInvitationBasePath: string;
  defaultTimezone: string;
  defaultLocale: string;
  baseInvitationPriceToman: number;
  databaseUrl: string;
  redisEnabled: boolean;
  redisUrl: string;
  queueDriver: QueueDriver;
  storageDriver: StorageDriver;
  maxUploadSizeBytes: number;
  paymentGatewayProvider: PaymentGatewayProvider;
  paymentSandboxMode: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) return fallback;
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseBoolean(rawValue: string | undefined, fallback: boolean): boolean {
  if (rawValue === undefined || rawValue === '') return fallback;
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

export function loadEnvConfig(
  rawEnv: Record<string, string | undefined> = process.env
): AppEnvConfig {
  const rawNodeEnv = (rawEnv.NODE_ENV || 'development').trim().toLowerCase();
  const nodeEnv: NodeEnv =
    rawNodeEnv === 'production' || rawNodeEnv === 'staging' || rawNodeEnv === 'test'
      ? rawNodeEnv
      : 'development';

  const rawQueueDriver = (rawEnv.QUEUE_DRIVER || 'in-memory').trim().toLowerCase();
  const queueDriver: QueueDriver = rawQueueDriver === 'bullmq' ? 'bullmq' : 'in-memory';

  const rawStorageDriver = (rawEnv.STORAGE_DRIVER || 'local').trim().toLowerCase();
  const storageDriver: StorageDriver = rawStorageDriver === 's3' ? 's3' : 'local';

  const rawGateway = (rawEnv.PAYMENT_GATEWAY_PROVIDER || 'mock').trim().toLowerCase();
  const paymentGatewayProvider: PaymentGatewayProvider =
    rawGateway === 'zarinpal' ||
    rawGateway === 'zibal' ||
    rawGateway === 'idpay' ||
    rawGateway === 'nextpay'
      ? rawGateway
      : 'mock';

  return {
    nodeEnv,
    port: parsePositiveInt(rawEnv.PORT, 3000),
    appName: (rawEnv.APP_NAME || 'Eyvan Digital Invitation Platform').trim(),
    appUrl: (rawEnv.APP_URL || 'http://localhost:3000').trim(),
    publicInvitationBasePath: (rawEnv.PUBLIC_INVITATION_BASE_PATH || '/i').trim(),
    defaultTimezone: (rawEnv.DEFAULT_TIMEZONE || 'Asia/Tehran').trim(),
    defaultLocale: (rawEnv.DEFAULT_LOCALE || 'fa-IR').trim(),
    baseInvitationPriceToman: parsePositiveInt(rawEnv.BASE_INVITATION_PRICE_TOMAN, 50000),
    databaseUrl: (
      rawEnv.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/invitation_saas?schema=public'
    ).trim(),
    redisEnabled: parseBoolean(rawEnv.REDIS_ENABLED, false),
    redisUrl: (rawEnv.REDIS_URL || 'redis://localhost:6379/0').trim(),
    queueDriver,
    storageDriver,
    maxUploadSizeBytes: parsePositiveInt(rawEnv.MAX_UPLOAD_SIZE_BYTES, 5 * 1024 * 1024),
    paymentGatewayProvider,
    paymentSandboxMode: parseBoolean(rawEnv.PAYMENT_SANDBOX_MODE, true),
    rateLimitWindowMs: parsePositiveInt(rawEnv.RATE_LIMIT_WINDOW_MS, 60000),
    rateLimitMaxRequests: parsePositiveInt(rawEnv.RATE_LIMIT_MAX_REQUESTS, 100),
  };
}

export const envConfig: AppEnvConfig = loadEnvConfig(process.env);
