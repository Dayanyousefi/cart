import crypto from 'node:crypto';
import type { RoleCode } from '../entities/auth.entities';
import {
  AuthDatabaseStore,
  defaultAuthStore,
  RolesRepository,
  PermissionsRepository,
  UsersRepository,
  UserSessionsRepository,
} from '../repositories';
import { MigrationRunner } from '../migrations/migration-runner';

export interface AuthDatabaseSeedSummary {
  migrationsApplied: number;
  rolesCount: number;
  permissionsCount: number;
  usersCount: number;
  sessionsCount: number;
}

const INITIAL_ROLES: Array<{
  code: RoleCode;
  titleFa: string;
  description: string;
}> = [
  {
    code: 'USER',
    titleFa: 'کاربر میزبان (مشتری)',
    description: 'ساخت دعوتنامه، پرداخت، دریافت لینک اختصاصی و مدیریت مهمانان (RSVP)',
  },
  {
    code: 'SUPPORT',
    titleFa: 'کارشناس پشتیبانی',
    description: 'بررسی سفارشها، راهنمایی کاربران و مشاهده وضعیت دعوتنامهها',
  },
  {
    code: 'ADMIN',
    titleFa: 'مدیر سامانه',
    description: 'مدیریت قالبها، دستهبندیها، قیمت پایه، کدهای تخفیف و سفارشها',
  },
  {
    code: 'SUPER_ADMIN',
    titleFa: 'مدیر ارشد سیستم',
    description: 'دسترسی کامل به تنظیمات زیرساخت، مدیریت نقشها و لاگهای ممیزی (Audit Logs)',
  },
];

const INITIAL_PERMISSIONS: Array<{
  code: string;
  module: string;
  titleFa: string;
  roleCodes: RoleCode[];
}> = [
  {
    code: 'invitations:manage_own',
    module: 'invitations',
    titleFa: 'ساخت، ویرایش و مدیریت دعوتنامههای شخصی',
    roleCodes: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'rsvp:read_own',
    module: 'rsvp',
    titleFa: 'مشاهده فهرست مهمانان و پاسخهای حضور دعوتنامه خود',
    roleCodes: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'orders:manage_own',
    module: 'orders',
    titleFa: 'ثبت سفارش و پرداخت هزینه دعوتنامه',
    roleCodes: ['USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'templates:write',
    module: 'templates',
    titleFa: 'ایجاد قالب جدید و انتشار نسخه جدید در موتور قالب',
    roleCodes: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'pricing:manage',
    module: 'admin',
    titleFa: 'تغییر قیمت پایه دعوتنامه (پیشفرض ۵۰٬۰۰۰ تومان) و قیمت قالبها',
    roleCodes: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'coupons:manage',
    module: 'orders',
    titleFa: 'تعریف و ویرایش کدهای تخفیف و کمپینهای فروش',
    roleCodes: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'orders:read_all',
    module: 'orders',
    titleFa: 'مشاهده کلیه سفارشها و تراکنشهای مالی کاربران',
    roleCodes: ['SUPPORT', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'users:manage',
    module: 'users',
    titleFa: 'مدیریت وضعیت کاربران و رفع مسدودیت حسابها',
    roleCodes: ['ADMIN', 'SUPER_ADMIN'],
  },
  {
    code: 'audit:read',
    module: 'admin',
    titleFa: 'مشاهده لاگهای ممیزی مدیران (admin_logs)',
    roleCodes: ['SUPER_ADMIN'],
  },
  {
    code: 'settings:manage',
    module: 'admin',
    titleFa: 'مدیریت تنظیمات کلان سیستم و درگاههای پرداخت',
    roleCodes: ['SUPER_ADMIN'],
  },
];

function hashDemoPassword(plainPassword: string): string {
  const salt = 'eyvan_phase2_seed_salt';
  const digest = crypto.pbkdf2Sync(plainPassword, salt, 10000, 32, 'sha256').toString('hex');
  return `$pbkdf2-sha256$10000$${salt}$${digest}`;
}

export const defaultMigrationRunner = new MigrationRunner();

export function seedAuthAndUsersDatabase(
  store: AuthDatabaseStore = defaultAuthStore,
  migrationRunner: MigrationRunner = defaultMigrationRunner
): AuthDatabaseSeedSummary {
  migrationRunner.runPendingMigrations();

  const rolesRepo = new RolesRepository(store);
  const permsRepo = new PermissionsRepository(store);
  const usersRepo = new UsersRepository(store);
  const sessionsRepo = new UserSessionsRepository(store);

  return store.withTransaction(() => {
    // 1. Seed Roles idempotently
    for (const r of INITIAL_ROLES) {
      if (!rolesRepo.findByCode(r.code)) {
        rolesRepo.createRole(r);
      }
    }

    // 2. Seed Permissions idempotently
    for (const p of INITIAL_PERMISSIONS) {
      permsRepo.upsertPermission(p);
    }

    const superAdminRole = rolesRepo.findByCode('SUPER_ADMIN')!;
    const adminRole = rolesRepo.findByCode('ADMIN')!;
    const userRole = rolesRepo.findByCode('USER')!;

    // 3. Seed Initial Users idempotently
    const seedUsers = [
      {
        roleId: superAdminRole.id,
        fullName: 'مدیر ارشد سامانه ایوان',
        phoneNumber: '09120000001',
        email: 'admin@example.ir',
        passwordHash: hashDemoPassword('Admin@Eyvan1405!'),
      },
      {
        roleId: adminRole.id,
        fullName: 'سارا محمدی (مدیر قالبها و فروش)',
        phoneNumber: '09120000002',
        email: 'sara.admin@example.ir',
        passwordHash: hashDemoPassword('Catalog@Eyvan1405!'),
      },
      {
        roleId: userRole.id,
        fullName: 'دیان یوسفی (کاربر میزبان)',
        phoneNumber: '09123456789',
        email: 'dayan@example.ir',
        passwordHash: hashDemoPassword('Dayan@Wedding1405!'),
      },
    ];

    for (const u of seedUsers) {
      if (!usersRepo.findByPhone(u.phoneNumber)) {
        const created = usersRepo.createUser(u);
        sessionsRepo.createSession({
          userId: created.id,
          rawRefreshToken: `seed_refresh_token_for_${created.phoneNumber}`,
          ipAddress: '185.143.233.10',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari',
        });
      }
    }

    return {
      migrationsApplied: migrationRunner.getAppliedMigrations().length,
      rolesCount: rolesRepo.listRoles().length,
      permissionsCount: permsRepo.listAllPermissions().length,
      usersCount: usersRepo.listUsers().length,
      sessionsCount: sessionsRepo.listAllSessions().length,
    };
  });
}
