import crypto from 'node:crypto';
import { AppError } from '../../common/errors';
import {
  type UserEntity,
  type UserStatus,
  normalizeIranPhoneNumber,
} from '../entities/auth.entities';
import { AuthDatabaseStore, defaultAuthStore } from './base.repository';

export interface CreateUserInput {
  roleId: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  passwordHash: string;
  status?: UserStatus;
}

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export class UsersRepository {
  private readonly store: AuthDatabaseStore;

  constructor(store: AuthDatabaseStore = defaultAuthStore) {
    this.store = store;
  }

  public createUser(input: CreateUserInput): UserEntity {
    const state = this.store.getState();

    // 1. Foreign Key check: role_id -> roles.id
    if (!state.roles.has(input.roleId)) {
      throw AppError.badRequest('شناسه نقش کاربری (role_id) در جدول roles یافت نشد.', [
        { field: 'roleId', issue: 'کلید خارجی role_id نامعتبر است.' },
      ]);
    }

    const fullName = input.fullName.trim();
    if (fullName.length < 3) {
      throw AppError.badRequest('نام و نام خانوادگی کاربر باید حداقل ۳ کاراکتر باشد.', [
        { field: 'fullName', issue: 'نام کامل کوتاهتر از حد مجاز است.' },
      ]);
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIranPhoneNumber(input.phoneNumber);
    } catch (err) {
      throw AppError.badRequest(err instanceof Error ? err.message : 'شماره موبایل نامعتبر است.', [
        { field: 'phoneNumber', issue: 'فرمت شماره موبایل ایران رعایت نشده است.' },
      ]);
    }

    const normalizedEmail = input.email ? input.email.trim().toLowerCase() : null;

    // 2. Unique Constraints: phone_number & email
    for (const existing of state.users.values()) {
      if (existing.phoneNumber === normalizedPhone) {
        throw new AppError({
          statusCode: 409,
          code: 'CONFLICT',
          messageFa: `کاربری با شماره موبایل ${normalizedPhone} قبلاً ثبتنام کرده است (قید UNIQUE idx_users_phone).`,
          details: [{ field: 'phoneNumber', issue: 'شماره موبایل تکراری است.' }],
        });
      }
      if (normalizedEmail && existing.email === normalizedEmail) {
        throw new AppError({
          statusCode: 409,
          code: 'CONFLICT',
          messageFa: `کاربری با ایمیل ${normalizedEmail} قبلاً ثبتنام کرده است (قید UNIQUE idx_users_email).`,
          details: [{ field: 'email', issue: 'آدرس ایمیل تکراری است.' }],
        });
      }
    }

    const nowIso = new Date().toISOString();
    const user: UserEntity = {
      id: crypto.randomUUID(),
      roleId: input.roleId,
      fullName,
      phoneNumber: normalizedPhone,
      email: normalizedEmail,
      passwordHash: input.passwordHash,
      status: input.status ?? 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    state.users.set(user.id, user);
    return { ...user };
  }

  public findById(id: string): UserEntity | null {
    const user = this.store.getState().users.get(id);
    return user ? { ...user } : null;
  }

  public findByPhone(rawPhone: string): UserEntity | null {
    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIranPhoneNumber(rawPhone);
    } catch {
      return null;
    }

    for (const user of this.store.getState().users.values()) {
      if (user.phoneNumber === normalizedPhone) {
        return { ...user };
      }
    }
    return null;
  }

  public findByEmail(email: string): UserEntity | null {
    const normalized = email.trim().toLowerCase();
    for (const user of this.store.getState().users.values()) {
      if (user.email === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  public listUsers(): UserEntity[] {
    return Array.from(this.store.getState().users.values())
      .map((u) => ({ ...u }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /**
   * ثبت تلاش ناموفق ورود و اعمال قفل موقت ۱۵ دقیقهای پس از ۵ خطا
   */
  public recordFailedLoginAttempt(userId: string, now = new Date()): UserEntity {
    const state = this.store.getState();
    const user = state.users.get(userId);
    if (!user) {
      throw AppError.notFound('کاربر موردنظر یافت نشد.');
    }

    const nextAttempts = user.failedLoginAttempts + 1;
    const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString()
      : user.lockedUntil;

    const updated: UserEntity = {
      ...user,
      failedLoginAttempts: nextAttempts,
      lockedUntil,
      updatedAt: now.toISOString(),
    };

    state.users.set(userId, updated);
    return { ...updated };
  }

  /**
   * ثبت ورود موفق و بازنشانی شمارنده خطاهای ورود
   */
  public recordSuccessfulLogin(userId: string, now = new Date()): UserEntity {
    const state = this.store.getState();
    const user = state.users.get(userId);
    if (!user) {
      throw AppError.notFound('کاربر موردنظر یافت نشد.');
    }

    const updated: UserEntity = {
      ...user,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    state.users.set(userId, updated);
    return { ...updated };
  }

  public updateUserStatus(userId: string, status: UserStatus): UserEntity {
    const state = this.store.getState();
    const user = state.users.get(userId);
    if (!user) {
      throw AppError.notFound('کاربر موردنظر یافت نشد.');
    }

    const updated: UserEntity = {
      ...user,
      status,
      updatedAt: new Date().toISOString(),
    };
    state.users.set(userId, updated);
    return { ...updated };
  }

  /**
   * حذف کاربر بههمراه حذف آبشاری نشستهای فعال (ON DELETE CASCADE در user_sessions)
   */
  public deleteUserById(userId: string): void {
    const state = this.store.getState();
    if (!state.users.has(userId)) {
      throw AppError.notFound('کاربر موردنظر یافت نشد.');
    }

    // ON DELETE CASCADE for user_sessions
    for (const [sessionId, session] of state.userSessions.entries()) {
      if (session.userId === userId) {
        state.userSessions.delete(sessionId);
      }
    }

    state.users.delete(userId);
  }
}
