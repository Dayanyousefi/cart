import type {
  RoleEntity,
  PermissionEntity,
  UserEntity,
  UserSessionEntity,
} from '../entities/auth.entities';

export interface AuthDatabaseState {
  roles: Map<string, RoleEntity>;
  permissions: Map<string, PermissionEntity>;
  users: Map<string, UserEntity>;
  userSessions: Map<string, UserSessionEntity>;
}

/**
 * موتور ذخیرهسازی تراکنشی (Transactional Store / Unit of Work)
 * پشتیبانیکنده از Rollback اتمیک در صورت بروز خطا در میانه تراکنش
 */
export class AuthDatabaseStore {
  private state: AuthDatabaseState = {
    roles: new Map(),
    permissions: new Map(),
    users: new Map(),
    userSessions: new Map(),
  };

  public getState(): AuthDatabaseState {
    return this.state;
  }

  private cloneState(source: AuthDatabaseState): AuthDatabaseState {
    return {
      roles: new Map(Array.from(source.roles.entries(), ([k, v]) => [k, { ...v }])),
      permissions: new Map(
        Array.from(source.permissions.entries(), ([k, v]) => [
          k,
          { ...v, roleCodes: [...v.roleCodes] },
        ])
      ),
      users: new Map(Array.from(source.users.entries(), ([k, v]) => [k, { ...v }])),
      userSessions: new Map(Array.from(source.userSessions.entries(), ([k, v]) => [k, { ...v }])),
    };
  }

  public withTransaction<T>(work: (txState: AuthDatabaseState) => T): T {
    const snapshot = this.cloneState(this.state);
    try {
      const result = work(this.state);
      return result;
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }

  public async withTransactionAsync<T>(
    work: (txState: AuthDatabaseState) => Promise<T>
  ): Promise<T> {
    const snapshot = this.cloneState(this.state);
    try {
      const result = await work(this.state);
      return result;
    } catch (error) {
      this.state = snapshot;
      throw error;
    }
  }
}

export const defaultAuthStore = new AuthDatabaseStore();
