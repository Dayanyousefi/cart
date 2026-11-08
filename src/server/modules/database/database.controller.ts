import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../common/response';
import { AppError } from '../../common/errors';
import {
  defaultAuthStore,
  RolesRepository,
  PermissionsRepository,
  UsersRepository,
  UserSessionsRepository,
} from '../../db/repositories';
import { toSafeUserView, toSafeSessionView, type RoleCode } from '../../db/entities/auth.entities';
import { seedAuthAndUsersDatabase, defaultMigrationRunner } from '../../db/seed/auth.seed';

const rolesRepo = new RolesRepository(defaultAuthStore);
const permsRepo = new PermissionsRepository(defaultAuthStore);
const usersRepo = new UsersRepository(defaultAuthStore);
const sessionsRepo = new UserSessionsRepository(defaultAuthStore);

// Ensure initial migration and seed are loaded at startup
seedAuthAndUsersDatabase(defaultAuthStore, defaultMigrationRunner);

export const databaseController = {
  getDatabaseFoundationStatus(_req: Request, res: Response): void {
    const roles = rolesRepo.listRoles();
    const roleMap = new Map(roles.map((r) => [r.id, r]));
    const users = usersRepo.listUsers();
    const userMap = new Map(users.map((u) => [u.id, u]));
    const sessions = sessionsRepo.listAllSessions();
    const permissions = permsRepo.listAllPermissions();
    const migrations = defaultMigrationRunner.getAppliedMigrations();

    sendSuccess(res, {
      migrations,
      roles,
      permissions,
      users: users.map((u) => toSafeUserView(u, roleMap.get(u.roleId))),
      sessions: sessions.map((s) => toSafeSessionView(s, userMap.get(s.userId))),
      summary: {
        migrationsCount: migrations.length,
        rolesCount: roles.length,
        permissionsCount: permissions.length,
        usersCount: users.length,
        activeSessionsCount: sessions.filter((s) => !s.isRevoked).length,
      },
    });
  },

  executeRepositoryAction(req: Request, res: Response, next: NextFunction): void {
    try {
      const action = String(req.body?.action || '').trim();

      if (action === 'create_user') {
        const roleCode = String(req.body?.roleCode || 'USER').toUpperCase() as RoleCode;
        const role = rolesRepo.findByCode(roleCode) || rolesRepo.findByCode('USER')!;
        const created = usersRepo.createUser({
          roleId: role.id,
          fullName: String(req.body?.fullName || ''),
          phoneNumber: String(req.body?.phoneNumber || ''),
          email: req.body?.email ? String(req.body.email) : null,
          passwordHash: '$pbkdf2-sha256$10000$interactive$9f8e7d6c5b4a',
        });

        sessionsRepo.createSession({
          userId: created.id,
          ipAddress: req.ip || '127.0.0.1',
          userAgent: req.header('user-agent') || 'Browser Interactive Check',
        });

        sendSuccess(
          res,
          {
            action,
            messageFa: `کاربر جدید «${created.fullName}» با شماره ${created.phoneNumber} و یک نشست فعال در Repository ثبت شد.`,
            user: toSafeUserView(created, role),
          },
          201
        );
        return;
      }

      if (action === 'simulate_failed_login') {
        const phone = String(req.body?.phoneNumber || '09123456789');
        const user = usersRepo.findByPhone(phone);
        if (!user) {
          throw AppError.notFound(`کاربری با شماره ${phone} یافت نشد.`);
        }
        const updated = usersRepo.recordFailedLoginAttempt(user.id);
        const role = rolesRepo.findById(updated.roleId) ?? undefined;
        const safeView = toSafeUserView(updated, role);

        sendSuccess(res, {
          action,
          messageFa: safeView.isCurrentlyLocked
            ? `هشدار امنیتی: حساب کاربری ${updated.phoneNumber} پس از ${updated.failedLoginAttempts} تلاش ناموفق به مدت ۱۵ دقیقه قفل شد (locked_until فعال گردید).`
            : `تلاش ناموفق ورود برای ${updated.phoneNumber} ثبت شد (تعداد خطا: ${updated.failedLoginAttempts} از ۵).`,
          user: safeView,
        });
        return;
      }

      if (action === 'reset_login_lock') {
        const phone = String(req.body?.phoneNumber || '09123456789');
        const user = usersRepo.findByPhone(phone);
        if (!user) {
          throw AppError.notFound(`کاربری با شماره ${phone} یافت نشد.`);
        }
        const updated = usersRepo.recordSuccessfulLogin(user.id);
        const role = rolesRepo.findById(updated.roleId) ?? undefined;

        sendSuccess(res, {
          action,
          messageFa: `ورود موفق ثبت شد و قفل امنیتی حساب ${updated.phoneNumber} بازنشانی گردید.`,
          user: toSafeUserView(updated, role),
        });
        return;
      }

      if (action === 'test_fk_restrict_role_delete') {
        const userRole = rolesRepo.findByCode('USER');
        if (!userRole) {
          throw AppError.notFound('نقش USER یافت نشد.');
        }
        // This will throw 409 CONFLICT due to ON DELETE RESTRICT foreign key check!
        rolesRepo.deleteRoleById(userRole.id);
        return;
      }

      if (action === 'revoke_session') {
        const sessionId = String(req.body?.sessionId || '');
        const revoked = sessionsRepo.revokeSessionById(sessionId);
        sendSuccess(res, {
          action,
          messageFa: `نشست انتخابی (${revoked.id.slice(0, 8)}...) با موفقیت باطل شد (is_revoked = true).`,
        });
        return;
      }

      throw AppError.badRequest('عملیات درخواستی برای تست Repository معتبر نیست.');
    } catch (err) {
      next(err);
    }
  },
};
