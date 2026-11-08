import crypto from 'node:crypto';
import { AppError } from '../../common/errors';
import type { UserSessionEntity } from '../entities/auth.entities';
import { AuthDatabaseStore, defaultAuthStore } from './base.repository';

export interface CreateSessionInput {
  userId: string;
  rawRefreshToken?: string;
  refreshTokenHash?: string;
  ipAddress: string;
  userAgent?: string | null;
  ttlSeconds?: number;
}

export class UserSessionsRepository {
  private readonly store: AuthDatabaseStore;

  constructor(store: AuthDatabaseStore = defaultAuthStore) {
    this.store = store;
  }

  public static hashRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  public createSession(input: CreateSessionInput, now = new Date()): UserSessionEntity {
    const state = this.store.getState();

    // Foreign Key check: user_id -> users.id
    if (!state.users.has(input.userId)) {
      throw AppError.badRequest('شناسه کاربر (user_id) در جدول users یافت نشد.', [
        { field: 'userId', issue: 'کلید خارجی user_id نامعتبر است.' },
      ]);
    }

    const tokenHash =
      input.refreshTokenHash ??
      UserSessionsRepository.hashRefreshToken(
        input.rawRefreshToken || crypto.randomBytes(32).toString('hex')
      );

    // Unique constraint on refresh_token_hash
    for (const existing of state.userSessions.values()) {
      if (existing.refreshTokenHash === tokenHash) {
        throw new AppError({
          statusCode: 409,
          code: 'CONFLICT',
          messageFa: 'نشستی با این هش توکن قبلاً ثبت شده است (قید UNIQUE refresh_token_hash).',
        });
      }
    }

    const ttlMs = (input.ttlSeconds ?? 7 * 24 * 3600) * 1000;
    const session: UserSessionEntity = {
      id: crypto.randomUUID(),
      userId: input.userId,
      refreshTokenHash: tokenHash,
      ipAddress: input.ipAddress.trim() || '127.0.0.1',
      userAgent: input.userAgent ?? null,
      isRevoked: false,
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
      createdAt: now.toISOString(),
    };

    state.userSessions.set(session.id, session);
    return { ...session };
  }

  public findActiveByHash(tokenHash: string, now = new Date()): UserSessionEntity | null {
    for (const session of this.store.getState().userSessions.values()) {
      if (
        session.refreshTokenHash === tokenHash &&
        !session.isRevoked &&
        new Date(session.expiresAt).getTime() > now.getTime()
      ) {
        return { ...session };
      }
    }
    return null;
  }

  public listSessionsByUser(userId: string): UserSessionEntity[] {
    return Array.from(this.store.getState().userSessions.values())
      .filter((s) => s.userId === userId)
      .map((s) => ({ ...s }));
  }

  public listAllSessions(): UserSessionEntity[] {
    return Array.from(this.store.getState().userSessions.values()).map((s) => ({ ...s }));
  }

  public revokeSessionById(sessionId: string): UserSessionEntity {
    const state = this.store.getState();
    const session = state.userSessions.get(sessionId);
    if (!session) {
      throw AppError.notFound('نشست موردنظر یافت نشد.');
    }

    const updated: UserSessionEntity = {
      ...session,
      isRevoked: true,
    };
    state.userSessions.set(sessionId, updated);
    return { ...updated };
  }

  public revokeAllUserSessions(userId: string): number {
    const state = this.store.getState();
    let count = 0;
    for (const [id, session] of state.userSessions.entries()) {
      if (session.userId === userId && !session.isRevoked) {
        state.userSessions.set(id, { ...session, isRevoked: true });
        count += 1;
      }
    }
    return count;
  }
}
