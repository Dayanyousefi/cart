import crypto from 'node:crypto';
import { AppError } from '../../common/errors';
import type { RoleCode, RoleEntity, PermissionEntity } from '../entities/auth.entities';
import { AuthDatabaseStore, defaultAuthStore } from './base.repository';

export interface CreateRoleInput {
  code: RoleCode;
  titleFa: string;
  description?: string | null;
}

export interface UpsertPermissionInput {
  code: string;
  module: string;
  titleFa: string;
  roleCodes: RoleCode[];
}

export class RolesRepository {
  private readonly store: AuthDatabaseStore;

  constructor(store: AuthDatabaseStore = defaultAuthStore) {
    this.store = store;
  }

  public createRole(input: CreateRoleInput): RoleEntity {
    const normalizedCode = input.code.trim().toUpperCase() as RoleCode;
    const state = this.store.getState();

    for (const existing of state.roles.values()) {
      if (existing.code === normalizedCode) {
        throw new AppError({
          statusCode: 409,
          code: 'CONFLICT',
          messageFa: `نقش کاربری با کد ${normalizedCode} قبلاً در دیتابیس ثبت شده است (قید UNIQUE).`,
        });
      }
    }

    const role: RoleEntity = {
      id: crypto.randomUUID(),
      code: normalizedCode,
      titleFa: input.titleFa.trim(),
      description: input.description ?? null,
      createdAt: new Date().toISOString(),
    };

    state.roles.set(role.id, role);
    return { ...role };
  }

  public findById(id: string): RoleEntity | null {
    const role = this.store.getState().roles.get(id);
    return role ? { ...role } : null;
  }

  public findByCode(code: RoleCode): RoleEntity | null {
    const normalized = code.trim().toUpperCase();
    for (const role of this.store.getState().roles.values()) {
      if (role.code === normalized) {
        return { ...role };
      }
    }
    return null;
  }

  public listRoles(): RoleEntity[] {
    return Array.from(this.store.getState().roles.values()).map((r) => ({ ...r }));
  }

  /**
   * حذف نقش با رعایت قید کلید خارجی ON DELETE RESTRICT در جدول users
   */
  public deleteRoleById(roleId: string): void {
    const state = this.store.getState();
    const role = state.roles.get(roleId);
    if (!role) {
      throw AppError.notFound('نقش موردنظر یافت نشد.');
    }

    for (const user of state.users.values()) {
      if (user.roleId === roleId) {
        throw new AppError({
          statusCode: 409,
          code: 'CONFLICT',
          messageFa: `امکان حذف نقش «${role.titleFa}» (${role.code}) وجود ندارد زیرا کاربرانی به این نقش متصل هستند (قید کلید خارجی ON DELETE RESTRICT).`,
        });
      }
    }

    state.roles.delete(roleId);
  }
}

export class PermissionsRepository {
  private readonly store: AuthDatabaseStore;

  constructor(store: AuthDatabaseStore = defaultAuthStore) {
    this.store = store;
  }

  public upsertPermission(input: UpsertPermissionInput): PermissionEntity {
    const normalizedCode = input.code.trim().toLowerCase();
    const state = this.store.getState();

    for (const existing of state.permissions.values()) {
      if (existing.code === normalizedCode) {
        const updated: PermissionEntity = {
          ...existing,
          module: input.module.trim(),
          titleFa: input.titleFa.trim(),
          roleCodes: [...input.roleCodes],
        };
        state.permissions.set(updated.id, updated);
        return { ...updated, roleCodes: [...updated.roleCodes] };
      }
    }

    const permission: PermissionEntity = {
      id: crypto.randomUUID(),
      code: normalizedCode,
      module: input.module.trim(),
      titleFa: input.titleFa.trim(),
      roleCodes: [...input.roleCodes],
      createdAt: new Date().toISOString(),
    };

    state.permissions.set(permission.id, permission);
    return { ...permission, roleCodes: [...permission.roleCodes] };
  }

  public listAllPermissions(): PermissionEntity[] {
    return Array.from(this.store.getState().permissions.values()).map((p) => ({
      ...p,
      roleCodes: [...p.roleCodes],
    }));
  }

  public listPermissionsForRole(roleCode: RoleCode): PermissionEntity[] {
    return this.listAllPermissions().filter((p) => p.roleCodes.includes(roleCode));
  }
}
