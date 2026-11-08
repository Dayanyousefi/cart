import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { loadEnvConfig } from './config/env';
import { logger } from './common/logger';
import { AppError } from './common/errors';
import { healthService } from './modules/health/health.service';
import { createApiApp } from './app';

test('Phase 1 Environment Config loader parses defaults and custom values safely', () => {
  const defaultConfig = loadEnvConfig({});
  assert.equal(defaultConfig.nodeEnv, 'development');
  assert.equal(defaultConfig.port, 3000);
  assert.equal(defaultConfig.defaultTimezone, 'Asia/Tehran');
  assert.equal(defaultConfig.baseInvitationPriceToman, 50000);
  assert.equal(defaultConfig.queueDriver, 'in-memory');
  assert.equal(defaultConfig.paymentGatewayProvider, 'mock');

  const prodConfig = loadEnvConfig({
    NODE_ENV: 'production',
    PORT: '4000',
    BASE_INVITATION_PRICE_TOMAN: '65000',
    QUEUE_DRIVER: 'bullmq',
    REDIS_ENABLED: 'true',
    PAYMENT_GATEWAY_PROVIDER: 'zarinpal',
    PAYMENT_SANDBOX_MODE: 'false',
  });
  assert.equal(prodConfig.nodeEnv, 'production');
  assert.equal(prodConfig.port, 4000);
  assert.equal(prodConfig.baseInvitationPriceToman, 65000);
  assert.equal(prodConfig.queueDriver, 'bullmq');
  assert.equal(prodConfig.redisEnabled, true);
  assert.equal(prodConfig.paymentGatewayProvider, 'zarinpal');
  assert.equal(prodConfig.paymentSandboxMode, false);
});

test('Phase 1 Structured Logger records entries with requestId and module metadata', () => {
  const entry = logger.info('Test log message for Phase 1', {
    requestId: 'req_test_123',
    module: 'foundation-test',
    meta: { step: 1 },
  });

  assert.equal(entry.level, 'info');
  assert.equal(entry.requestId, 'req_test_123');
  assert.equal(entry.module, 'foundation-test');

  const recent = logger.getRecentLogs(5);
  assert.equal(recent.length >= 1, true);
  assert.equal(recent[0].requestId, 'req_test_123');
});

test('Phase 1 & 2 Directory & Tooling Verification confirms all 29 modular paths and configs exist on disk', () => {
  const diagnostics = healthService.getFoundationDiagnostics();
  assert.equal(diagnostics.directoryVerification.totalChecked, 29);
  assert.equal(
    diagnostics.directoryVerification.allVerified,
    true,
    `Some required paths are missing: ${diagnostics.directoryVerification.items
      .filter((i) => !i.existsOnDisk)
      .map((i) => i.relativePath)
      .join(', ')}`
  );
});

test('Phase 1 Express API Server responds to /api/v1/health and formats centralized errors accurately', async () => {
  const app = createApiApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.equal(typeof address === 'object' && address !== null, true);
  const port = (address as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify GET /api/v1/health
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
    const requestIdHeader = healthRes.headers.get('x-request-id');
    assert.equal(Boolean(requestIdHeader && requestIdHeader.startsWith('req_')), true);

    const healthJson = (await healthRes.json()) as {
      success: boolean;
      data: { status: string; phase: string; baseInvitationPriceToman: number };
    };
    assert.equal(healthJson.success, true);
    assert.equal(healthJson.data.status, 'ok');
    assert.equal(healthJson.data.baseInvitationPriceToman, 50000);

    // 2. Verify Centralized Error Handler for 409 SLUG_ALREADY_TAKEN
    const conflictRes = await fetch(`${baseUrl}/api/v1/health/simulate-error?type=slug_conflict`);
    assert.equal(conflictRes.status, 409);
    const conflictJson = (await conflictRes.json()) as {
      success: boolean;
      error: { code: string; suggestions: string[] };
    };
    assert.equal(conflictJson.success, false);
    assert.equal(conflictJson.error.code, 'SLUG_ALREADY_TAKEN');
    assert.equal(conflictJson.error.suggestions.includes('ali-sara-1405'), true);

    // 3. Verify 404 Not Found handler on unknown /api route
    const notFoundRes = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`);
    assert.equal(notFoundRes.status, 404);
    const notFoundJson = (await notFoundRes.json()) as {
      success: boolean;
      error: { code: string };
    };
    assert.equal(notFoundJson.success, false);
    assert.equal(notFoundJson.error.code, 'NOT_FOUND');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('AppError factory methods construct proper status codes and operational flags', () => {
  const unauth = AppError.unauthorized();
  assert.equal(unauth.statusCode, 401);
  assert.equal(unauth.code, 'UNAUTHORIZED');
  assert.equal(unauth.isOperational, true);
});
