export type RoleCode = 'USER' | 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface BaseEntity {
  id: string;
  createdAt: string;
}

/**
 * ۱. موجودیت نقش کاربری (جدول roles)
 */
export interface RoleEntity extends BaseEntity {
  code: RoleCode;
  titleFa: string;
  description: string | null;
}

/**
 * ۲. موجودیت مجوزهای سیستم (جدول permissions)
 */
export interface PermissionEntity extends BaseEntity {
  code: string;
  module: string;
  titleFa: string;
  roleCodes: RoleCode[];
}

/**
 * ۳. موجودیت کاربر سامانه (جدول users)
 */
export interface UserEntity extends BaseEntity {
  roleId: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  passwordHash: string;
  status: UserStatus;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  updatedAt: string;
}

/**
 * نمای امن کاربر برای لایههای بالاتر و API (حذف کامل passwordHash)
 */
export interface SafeUserView {
  id: string;
  roleId: string;
  roleCode?: RoleCode;
  roleTitleFa?: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  status: UserStatus;
  failedLoginAttempts: number;
  isCurrentlyLocked: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * ۴. موجودیت نشست فعال کاربر (جدول user_sessions)
 */
export interface UserSessionEntity extends BaseEntity {
  userId: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent: string | null;
  isRevoked: boolean;
  expiresAt: string;
}

/**
 * نمای امن نشست کاربر (بدون افشای refreshTokenHash)
 */
export interface SafeUserSessionView {
  id: string;
  userId: string;
  userFullName?: string;
  tokenHashPreview: string;
  ipAddress: string;
  userAgent: string | null;
  isRevoked: boolean;
  isExpired: boolean;
  expiresAt: string;
  createdAt: string;
}

const IRAN_MOBILE_REGEX = /^09\d{9}$/;

export function normalizeIranPhoneNumber(rawPhone: string): string {
  const digitsOnly = rawPhone
    .trim()
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/\s|-/g, '')
    .replace(/^\+98/, '0')
    .replace(/^98/, '0');

  if (!IRAN_MOBILE_REGEX.test(digitsOnly)) {
    throw new Error('شماره موبایل باید با فرمت ۱۱ رقمی ایران (09xxxxxxxxx) باشد.');
  }
  return digitsOnly;
}

export function isUserLocked(user: Pick<UserEntity, 'lockedUntil'>, now = new Date()): boolean {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil).getTime() > now.getTime();
}

export function toSafeUserView(
  user: UserEntity,
  role?: RoleEntity,
  now = new Date()
): SafeUserView {
  return {
    id: user.id,
    roleId: user.roleId,
    roleCode: role?.code,
    roleTitleFa: role?.titleFa,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    status: user.status,
    failedLoginAttempts: user.failedLoginAttempts,
    isCurrentlyLocked: isUserLocked(user, now),
    lockedUntil: user.lockedUntil,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toSafeSessionView(
  session: UserSessionEntity,
  user?: UserEntity,
  now = new Date()
): SafeUserSessionView {
  return {
    id: session.id,
    userId: session.userId,
    userFullName: user?.fullName,
    tokenHashPreview: `${session.refreshTokenHash.slice(0, 10)}...${session.refreshTokenHash.slice(-6)}`,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    isRevoked: session.isRevoked,
    isExpired: new Date(session.expiresAt).getTime() <= now.getTime(),
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
}
