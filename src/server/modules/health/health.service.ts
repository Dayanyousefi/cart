import fs from 'node:fs';
import path from 'node:path';
import { envConfig } from '../../config/env';
import { logger } from '../../common/logger';

export interface HealthStatusReport {
  status: 'ok' | 'degraded';
  serviceName: string;
  version: string;
  phase: string;
  environment: string;
  timezone: string;
  locale: string;
  uptimeSeconds: number;
  baseInvitationPriceToman: number;
  adapters: {
    database: {
      engine: 'postgresql';
      status: 'configured';
      migrationsPhase: 'Phase 2';
    };
    cacheAndQueue: {
      driver: string;
      redisEnabled: boolean;
    };
    paymentGateway: {
      provider: string;
      sandboxMode: boolean;
    };
    storage: {
      driver: string;
      maxUploadBytes: number;
    };
  };
}

export interface DirectoryNodeStatus {
  relativePath: string;
  category: 'backend' | 'frontend' | 'infrastructure' | 'docs';
  descriptionFa: string;
  existsOnDisk: boolean;
}

const REQUIRED_PROJECT_PATHS: Array<{
  relativePath: string;
  category: 'backend' | 'frontend' | 'infrastructure' | 'docs';
  descriptionFa: string;
}> = [
  {
    relativePath: 'server.ts',
    category: 'backend',
    descriptionFa: 'نقطه ورود اصلی سرور Modular Monolith (Express + Vite Middleware)',
  },
  {
    relativePath: 'src/server/config/env.ts',
    category: 'backend',
    descriptionFa: 'مدیریت و اعتبارسنجی متغیرهای محیطی با تایپ امن',
  },
  {
    relativePath: 'src/server/common/logger.ts',
    category: 'backend',
    descriptionFa: 'لاگر ساختاریافته همراه با Request ID و بافر تشخیصی',
  },
  {
    relativePath: 'src/server/common/errors.ts',
    category: 'backend',
    descriptionFa: 'کلاس مرکزی خطاهای عملیاتی (AppError)',
  },
  {
    relativePath: 'src/server/middleware/error-handler.ts',
    category: 'backend',
    descriptionFa: 'میانافزار مدیریت خطای متمرکز و پاسخ استاندارد JSON',
  },
  {
    relativePath: 'src/server/db/entities/auth.entities.ts',
    category: 'backend',
    descriptionFa: 'لایه Entity برای جداول roles, permissions, users, user_sessions (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/migrations/001_auth_and_users.sql',
    category: 'backend',
    descriptionFa: 'مایگریشن نسخهبندیشده PostgreSQL برای جداول احراز هویت و کاربران (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/migrations/migration-runner.ts',
    category: 'backend',
    descriptionFa: 'موتور اجرای Migration با بررسی هش SHA-256 (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/repositories/roles.repository.ts',
    category: 'backend',
    descriptionFa: 'ریپازیتوری نقشها و مجوزها با کنترل کلید خارجی ON DELETE RESTRICT (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/repositories/users.repository.ts',
    category: 'backend',
    descriptionFa: 'ریپازیتوری کاربران با بررسی قید UNIQUE موبایل/ایمیل و قفل تلاش ناموفق (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/repositories/sessions.repository.ts',
    category: 'backend',
    descriptionFa: 'ریپازیتوری نشستهای فعال (user_sessions) با هش SHA-256 توکن (فاز ۲)',
  },
  {
    relativePath: 'src/server/db/seed/auth.seed.ts',
    category: 'backend',
    descriptionFa: 'اسکریپت Seed اولیه نقشها، ۱۰ مجوز و کاربران پایه (فاز ۲)',
  },
  {
    relativePath: 'src/server/modules/health',
    category: 'backend',
    descriptionFa: 'ماژول بررسی سلامت سیستم و زیرساخت (/api/v1/health)',
  },
  {
    relativePath: 'src/server/modules/auth',
    category: 'backend',
    descriptionFa: 'ماژول احراز هویت، نشستها و نقشها (آماده فاز ۳)',
  },
  {
    relativePath: 'src/server/modules/templates',
    category: 'backend',
    descriptionFa: 'ماژول مدیریت قالبها و دستهبندیها (آماده فاز ۵)',
  },
  {
    relativePath: 'src/server/modules/template-engine',
    category: 'backend',
    descriptionFa: 'ماژول موتور رندر امن و اسنپشات قالب (آماده فاز ۶)',
  },
  {
    relativePath: 'src/server/modules/invitations',
    category: 'backend',
    descriptionFa: 'ماژول ساخت و مدیریت دعوتنامه و اسلاگ /i/:slug (آماده فاز ۷ و ۸)',
  },
  {
    relativePath: 'src/server/modules/orders',
    category: 'backend',
    descriptionFa: 'ماژول سفارش و قیمتگذاری سمت سرور (آماده فاز ۹)',
  },
  {
    relativePath: 'src/server/modules/payments',
    category: 'backend',
    descriptionFa: 'ماژول تراکنشهای بانکی و آداپتور درگاه ایرانی (آماده فاز ۹)',
  },
  {
    relativePath: 'src/server/modules/rsvp',
    category: 'backend',
    descriptionFa: 'ماژول مدیریت مهمانها و ثبت پاسخ حضور (آماده فاز ۱۰)',
  },
  {
    relativePath: 'src/server/modules/admin',
    category: 'backend',
    descriptionFa: 'ماژول پنل مدیریت و ثبت لاگ ممیزی (آماده فاز ۱۲)',
  },
  {
    relativePath: 'src/server/adapters',
    category: 'backend',
    descriptionFa: 'آداپتورهای درگاه پرداخت، ذخیرهسازی S3/Local و کش Redis/InMemory',
  },
  {
    relativePath: 'src/features',
    category: 'frontend',
    descriptionFa: 'ماژولهای رابط کاربری فرانتاند (Auth, Builder, Dashboard, Admin)',
  },
  {
    relativePath: 'src/components/ui',
    category: 'frontend',
    descriptionFa: 'کامپوننتهای پایه سیستم طراحی فارسی (RTL Design System)',
  },
  {
    relativePath: 'Dockerfile',
    category: 'infrastructure',
    descriptionFa: 'فایل ساخت ایمیج داکر چندمرحلهای (Development & Production)',
  },
  {
    relativePath: 'docker-compose.yml',
    category: 'infrastructure',
    descriptionFa: 'ارکستراسیون سرویسهای App، PostgreSQL 16، Redis 7 و Nginx',
  },
  {
    relativePath: 'infrastructure/nginx/nginx.conf',
    category: 'infrastructure',
    descriptionFa: 'تنظیمات Nginx Reverse Proxy برای مسیرهای /i/:slug و /api/v1/*',
  },
  {
    relativePath: 'eslint.config.js',
    category: 'infrastructure',
    descriptionFa: 'پیکربندی ESLint 10 با قوانین سختگیرانه TypeScript',
  },
  {
    relativePath: '.prettierrc',
    category: 'infrastructure',
    descriptionFa: 'پیکربندی فرمتساز کد Prettier',
  },
];

export const healthService = {
  getHealthReport(): HealthStatusReport {
    return {
      status: 'ok',
      serviceName: envConfig.appName,
      version: '0.3.0',
      phase: 'Phase 2 — Database Foundation (Auth & Users)',
      environment: envConfig.nodeEnv,
      timezone: envConfig.defaultTimezone,
      locale: envConfig.defaultLocale,
      uptimeSeconds: Math.floor(process.uptime()),
      baseInvitationPriceToman: envConfig.baseInvitationPriceToman,
      adapters: {
        database: {
          engine: 'postgresql',
          status: 'configured',
          migrationsPhase: 'Phase 2',
        },
        cacheAndQueue: {
          driver: envConfig.queueDriver,
          redisEnabled: envConfig.redisEnabled,
        },
        paymentGateway: {
          provider: envConfig.paymentGatewayProvider,
          sandboxMode: envConfig.paymentSandboxMode,
        },
        storage: {
          driver: envConfig.storageDriver,
          maxUploadBytes: envConfig.maxUploadSizeBytes,
        },
      },
    };
  },

  getFoundationDiagnostics(rootDir = process.cwd()) {
    const directories: DirectoryNodeStatus[] = REQUIRED_PROJECT_PATHS.map((item) => {
      const fullPath = path.resolve(rootDir, item.relativePath);
      const existsOnDisk = fs.existsSync(fullPath);
      return {
        ...item,
        existsOnDisk,
      };
    });

    const verifiedCount = directories.filter((d) => d.existsOnDisk).length;

    return {
      health: this.getHealthReport(),
      directoryVerification: {
        totalChecked: directories.length,
        verifiedCount,
        allVerified: verifiedCount === directories.length,
        items: directories,
      },
      recentLogs: logger.getRecentLogs(12),
    };
  },
};
