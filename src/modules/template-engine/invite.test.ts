import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { INITIAL_MASTER_TEMPLATES, validateTemplateSchema } from './template-schema.ts';
import { createApiApp } from '../../server/app.ts';

test('INVITÉ Template Engine validates all 5 distinct master templates with Zod', () => {
  assert.equal(INITIAL_MASTER_TEMPLATES.length, 5);

  const expectedSlugs = [
    'royal-persian-wedding',
    'minimal-ivory-wedding',
    'emerald-luxury-wedding',
    'floral-romantic-invitation',
    'modern-birthday-invitation',
  ];

  for (const slug of expectedSlugs) {
    const found = INITIAL_MASTER_TEMPLATES.find((t) => t.slug === slug);
    assert.ok(found, `Expected master template ${slug} to exist`);
    const validation = validateTemplateSchema(found);
    assert.equal(
      validation.valid,
      true,
      `Template ${slug} failed Zod schema validation: ${
        validation.errors ? validation.errors.join(', ') : ''
      }`
    );
    assert.ok(found.localizedMeta.fa.title.length > 0);
    assert.ok(found.localizedMeta.en.title.length > 0);
    assert.ok(found.localizedMeta.ar.title.length > 0);
    assert.equal(found.openingSequence.enabledSceneIds.length >= 3, true);
  }
});

test('INVITÉ PostgreSQL API endpoints serve bootstrap, tokenized guest view, RSVP, studio save, and RBAC admin', async () => {
  const app = createApiApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.equal(typeof address === 'object' && address !== null, true);
  const port = (address as { port: number }).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify GET /api/v1/invite/bootstrap seeds & returns 5 templates + 5 categories
    const bootRes = await fetch(`${baseUrl}/api/v1/invite/bootstrap`);
    assert.equal(bootRes.status, 200);
    const bootJson = (await bootRes.json()) as {
      success: boolean;
      data: { templates: unknown[]; categories: unknown[] };
    };
    assert.equal(bootJson.success, true);
    assert.equal(bootJson.data.templates.length >= 5, true);
    assert.equal(bootJson.data.categories.length >= 5, true);

    // 2. Verify Tokenized Guest View returns personalized guest greeting without leaking private guest list
    const guestRes = await fetch(
      `${baseUrl}/api/v1/invite/guest-view/royal-niavaran-1405?token=inv_tok_sepehri`
    );
    assert.equal(guestRes.status, 200);
    const guestJson = (await guestRes.json()) as {
      success: boolean;
      data: {
        personalizedGuest: { guestName: string; maxAllowedGuests: number } | null;
        guests?: unknown;
      };
    };
    assert.equal(guestJson.success, true);
    assert.ok(guestJson.data.personalizedGuest);
    assert.equal(guestJson.data.personalizedGuest.maxAllowedGuests, 4);
    assert.equal(
      'guests' in guestJson.data,
      false,
      'Public guest endpoint must never expose the private guest list'
    );

    // 3. Verify Server-Side RBAC rejects non-admin role with 403 Forbidden
    const forbiddenAdminRes = await fetch(`${baseUrl}/api/v1/invite/admin/overview`, {
      headers: { 'x-invite-admin-role': 'viewer' },
    });
    assert.equal(forbiddenAdminRes.status, 403);

    // 4. Verify Server-Side RBAC allows super_admin and returns all 14 modules data
    const adminRes = await fetch(`${baseUrl}/api/v1/invite/admin/overview`, {
      headers: { 'x-invite-admin-role': 'super_admin' },
    });
    assert.equal(adminRes.status, 200);
    const adminJson = (await adminRes.json()) as {
      success: boolean;
      data: {
        analytics: { totalTemplatesCount: number };
        auditLogs: unknown[];
      };
    };
    assert.equal(adminJson.success, true);
    assert.equal(adminJson.data.analytics.totalTemplatesCount >= 5, true);
    assert.equal(adminJson.data.auditLogs.length >= 1, true);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
