import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { MigrationRunner } from './migrations/migration-runner';
import {
  AuthDatabaseStore,
  RolesRepository,
  PermissionsRepository,
  UsersRepository,
  UserSessionsRepository,
} from './repositories';
import { seedAuthAndUsersDatabase } from './seed/auth.seed';
import { toSafeUserView } from './entities/auth.entities';
import { createApiApp } from '../app';

test('Phase 2 MigrationRunner loads 001_auth_and_users.sql and verifies SHA-256 checksum idempotently', () => {
  const runner = new MigrationRunner();
  const appliedFirst = runner.runPendingMigrations();
  assert.equal(appliedFirst.length >= 1, true);

  const authMigration = appliedFirst.find((m) => m.version === '001');
  assert.equal(Boolean(authMigration), true);
  assert.deepEqual(authMigration?.tablesCreated, [
    'roles',
    'permissions',
    'users',
    'user_sessions',
  ]);
  assert.equal(authMigration?.checksumSha256.length, 64);

  // Running a second time is idempotent (0 newly applied)
  const appliedSecond = runner.runPendingMigrations();
  assert.equal(appliedSecond.length, 0);
});

test('Phase 2 Roles & Permissions Repositories enforce UNIQUE and ON DELETE RESTRICT constraints', () => {
  const store = new AuthDatabaseStore();
  const rolesRepo = new RolesRepository(store);
  const permsRepo = new PermissionsRepository(store);
  const usersRepo = new UsersRepository(store);

  const userRole = rolesRepo.createRole({
    code: 'USER',
    titleFa: 'کاربر عادی',
  });
  const adminRole = rolesRepo.createRole({
    code: 'ADMIN',
    titleFa: 'مدیر سیستم',
  });

  // Duplicate role code is blocked with 409 CONFLICT
  assert.throws(
    () => rolesRepo.createRole({ code: 'USER', titleFa: 'تکراری' }),
    (err: unknown) =>
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 409
  );

  // Create a user referencing userRole
  usersRepo.createUser({
    roleId: userRole.id,
    fullName: 'علی رضایی',
    phoneNumber: '09121112233',
    passwordHash: 'hashed_pw',
  });

  // Attempting to delete userRole fails due to ON DELETE RESTRICT
  assert.throws(
    () => rolesRepo.deleteRoleById(userRole.id),
    (err: unknown) =>
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 409
  );

  // Deleting adminRole (which has no users attached) succeeds
  rolesRepo.deleteRoleById(adminRole.id);
  assert.equal(rolesRepo.findById(adminRole.id), null);

  // Upserting permissions works and filters by role code
  permsRepo.upsertPermission({
    code: 'invitations:manage_own',
    module: 'invitations',
    titleFa: 'مدیریت دعوتنامه شخصی',
    roleCodes: ['USER', 'ADMIN'],
  });
  assert.equal(permsRepo.listPermissionsForRole('USER').length, 1);
});

test('Phase 2 UsersRepository normalizes Iranian phone numbers, blocks duplicates, and locks account after 5 failed attempts', () => {
  const store = new AuthDatabaseStore();
  const rolesRepo = new RolesRepository(store);
  const usersRepo = new UsersRepository(store);

  const role = rolesRepo.createRole({ code: 'USER', titleFa: 'کاربر' });

  // Persian digits and +98 prefix normalize to 09xxxxxxxxx
  const created = usersRepo.createUser({
    roleId: role.id,
    fullName: 'دیان یوسفی',
    phoneNumber: '+98912۳۴۵۶۷۸۹',
    email: 'Dayan@Example.ir',
    passwordHash: 'secret_hash_value',
  });

  assert.equal(created.phoneNumber, '09123456789');
  assert.equal(created.email, 'dayan@example.ir');

  // Safe DTO never exposes passwordHash
  const safeView = toSafeUserView(created, role);
  assert.equal('passwordHash' in safeView, false);

  // Duplicate phone is rejected with 409 CONFLICT
  assert.throws(
    () =>
      usersRepo.createUser({
        roleId: role.id,
        fullName: 'کاربر تکراری',
        phoneNumber: '09123456789',
        passwordHash: 'hash',
      }),
    (err: unknown) =>
      typeof err === 'object' &&
      err !== null &&
      'statusCode' in err &&
      (err as { statusCode: number }).statusCode === 409
  );

  // Brute-force lockout after 5 failed login attempts
  for (let i = 1; i <= 4; i++) {
    const attempt = usersRepo.recordFailedLoginAttempt(created.id);
    assert.equal(attempt.failedLoginAttempts, i);
    assert.equal(attempt.lockedUntil, null);
  }
  const fifthAttempt = usersRepo.recordFailedLoginAttempt(created.id);
  assert.equal(fifthAttempt.failedLoginAttempts, 5);
  assert.equal(Boolean(fifthAttempt.lockedUntil), true);
  assert.equal(toSafeUserView(fifthAttempt, role).isCurrentlyLocked, true);

  // Successful login resets failed attempts and unlocks
  const unlocked = usersRepo.recordSuccessfulLogin(created.id);
  assert.equal(unlocked.failedLoginAttempts, 0);
  assert.equal(unlocked.lockedUntil, null);
});

test('Phase 2 UserSessionsRepository & Transactional Rollback enforce session integrity and ON DELETE CASCADE', () => {
  const store = new AuthDatabaseStore();
  const rolesRepo = new RolesRepository(store);
  const usersRepo = new UsersRepository(store);
  const sessionsRepo = new UserSessionsRepository(store);

  const role = rolesRepo.createRole({ code: 'USER', titleFa: 'کاربر' });
  const user = usersRepo.createUser({
    roleId: role.id,
    fullName: 'سارا محمدی',
    phoneNumber: '09129998877',
    passwordHash: 'hash',
  });

  const session = sessionsRepo.createSession({
    userId: user.id,
    rawRefreshToken: 'my_raw_secret_token_123',
    ipAddress: '185.143.233.10',
  });

  // Raw token is never stored; SHA-256 hash is stored
  assert.notEqual(session.refreshTokenHash, 'my_raw_secret_token_123');
  assert.equal(session.refreshTokenHash.length, 64);

  // Test atomic transaction rollback on failure
  assert.throws(() => {
    store.withTransaction(() => {
      usersRepo.createUser({
        roleId: role.id,
        fullName: 'کاربر موقت تراکنش',
        phoneNumber: '09127776655',
        passwordHash: 'hash',
      });
      throw new Error('Simulated transaction error');
    });
  });

  // Rolled back user should not exist
  assert.equal(usersRepo.findByPhone('09127776655'), null);

  // Deleting user cascades and deletes their sessions (ON DELETE CASCADE)
  usersRepo.deleteUserById(user.id);
  assert.equal(sessionsRepo.listSessionsByUser(user.id).length, 0);
});

test('Phase 2 Live Database API (/api/v1/db/status & /api/v1/db/test-repository) returns seeded auth entities and enforces constraints', async () => {
  seedAuthAndUsersDatabase();
  const app = createApiApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const statusRes = await fetch(`${baseUrl}/api/v1/db/status`);
    assert.equal(statusRes.status, 200);
    const statusJson = (await statusRes.json()) as {
      success: boolean;
      data: {
        summary: {
          migrationsCount: number;
          rolesCount: number;
          permissionsCount: number;
          usersCount: number;
        };
      };
    };
    assert.equal(statusJson.success, true);
    assert.equal(statusJson.data.summary.migrationsCount >= 1, true);
    assert.equal(statusJson.data.summary.rolesCount, 4);
    assert.equal(statusJson.data.summary.permissionsCount, 10);
    assert.equal(statusJson.data.summary.usersCount >= 3, true);

    // Test ON DELETE RESTRICT via HTTP API
    const fkRes = await fetch(`${baseUrl}/api/v1/db/test-repository`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test_fk_restrict_role_delete' }),
    });
    assert.equal(fkRes.status, 409);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
