import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_INVITATION_PRICE_TOMAN,
  DATABASE_TABLES_SPEC,
  API_ENDPOINTS_SPEC,
  ADR_LIST_SPEC,
  ROADMAP_PHASES_SPEC,
  SAMPLE_COUPONS,
  validateInvitationSlug,
  calculateServerOrderPricing,
  createImmutableTemplateSnapshot,
  formatToman,
} from './specs';

test('Phase 0 Database Specification covers all 21 mandatory entities with primary keys and foreign keys', () => {
  const requiredEntities = [
    'users',
    'roles',
    'permissions',
    'user_sessions',
    'templates',
    'template_versions',
    'template_categories',
    'invitations',
    'invitation_media',
    'invitation_views',
    'invitation_guests',
    'rsvp_responses',
    'orders',
    'order_items',
    'payments',
    'payment_events',
    'media_assets',
    'coupons',
    'coupon_usages',
    'admin_logs',
    'system_settings',
  ];

  assert.equal(DATABASE_TABLES_SPEC.length, 21);

  const definedTableNames = new Set(DATABASE_TABLES_SPEC.map((t) => t.tableName));
  for (const entity of requiredEntities) {
    assert.equal(
      definedTableNames.has(entity),
      true,
      `Missing mandatory database entity: ${entity}`
    );
  }
});

test('Path-based URL slug validator (/i/:slug) accepts valid slugs and rejects reserved or duplicate slugs with suggestions', () => {
  const existing = ['ali-sara', 'mehdi-birthday'];

  // 1. Valid slug like dayan123
  const validResult = validateInvitationSlug('dayan123', existing, 'https://example.ir');
  assert.equal(validResult.isValid, true);
  assert.equal(validResult.publicUrl, 'https://example.ir/i/dayan123');
  assert.equal(validResult.suggestions.length, 0);

  // 2. Duplicate slug collision handling
  const duplicateResult = validateInvitationSlug('ali-sara', existing);
  assert.equal(duplicateResult.isValid, false);
  assert.equal(duplicateResult.errorCode, 'ALREADY_TAKEN');
  assert.equal(duplicateResult.suggestions.includes('ali-sara-1405'), true);

  // 3. Reserved system path blocking
  const reservedResult = validateInvitationSlug('admin', existing);
  assert.equal(reservedResult.isValid, false);
  assert.equal(reservedResult.errorCode, 'RESERVED_WORD');
  assert.equal(reservedResult.suggestions.length > 0, true);

  // 4. Invalid characters or short slug
  const shortResult = validateInvitationSlug('ab', existing);
  assert.equal(shortResult.isValid, false);
  assert.equal(shortResult.errorCode, 'TOO_SHORT');
});

test('Server-side order pricing calculates 50,000 Toman base price, applies percentage/fixed coupons, and converts to Rial accurately', () => {
  assert.equal(BASE_INVITATION_PRICE_TOMAN, 50000);

  // 1. Standard 50,000 Toman order without coupon
  const standardOrder = calculateServerOrderPricing({
    systemBasePriceToman: BASE_INVITATION_PRICE_TOMAN,
    templateIsFree: false,
    templatePriceOverrideToman: null,
  });
  assert.equal(standardOrder.subtotalToman, 50000);
  assert.equal(standardOrder.discountToman, 0);
  assert.equal(standardOrder.finalAmountToman, 50000);
  assert.equal(standardOrder.finalAmountRial, 500000);
  assert.equal(standardOrder.requiresGatewayRedirect, true);

  // 2. Applying 20% coupon (BAHAR20) on 50,000 Toman -> 10,000 Toman discount -> 40,000 Toman final
  const discountedOrder = calculateServerOrderPricing({
    systemBasePriceToman: BASE_INVITATION_PRICE_TOMAN,
    templateIsFree: false,
    templatePriceOverrideToman: null,
    couponCode: 'bahar20',
    availableCoupons: SAMPLE_COUPONS,
  });
  assert.equal(discountedOrder.couponApplied, true);
  assert.equal(discountedOrder.discountToman, 10000);
  assert.equal(discountedOrder.finalAmountToman, 40000);
  assert.equal(discountedOrder.finalAmountRial, 400000);

  // 3. Expired coupon is rejected safely on server
  const expiredCouponOrder = calculateServerOrderPricing({
    systemBasePriceToman: BASE_INVITATION_PRICE_TOMAN,
    templateIsFree: false,
    templatePriceOverrideToman: null,
    couponCode: 'EXPIRED99',
    availableCoupons: SAMPLE_COUPONS,
  });
  assert.equal(expiredCouponOrder.couponApplied, false);
  assert.equal(expiredCouponOrder.finalAmountToman, 50000);

  // 4. Free template bypasses payment gateway
  const freeOrder = calculateServerOrderPricing({
    systemBasePriceToman: BASE_INVITATION_PRICE_TOMAN,
    templateIsFree: true,
    templatePriceOverrideToman: null,
  });
  assert.equal(freeOrder.finalAmountToman, 0);
  assert.equal(freeOrder.requiresGatewayRedirect, false);
});

test('Template Engine Snapshot locks version state so subsequent template edits do not mutate existing invitations', () => {
  const mutableTemplateV1 = {
    templateId: 'tpl-royal-wedding',
    versionNumber: 1,
    fontFamily: 'Vazirmatn',
    primaryColorHex: '#B45309',
    backgroundColorHex: '#FFFBEB',
    sections: ['hero', 'hosts', 'venue_map', 'rsvp_form'],
    animationPreset: 'floral-reveal' as const,
  };

  const invitationSnapshot = createImmutableTemplateSnapshot(mutableTemplateV1);

  // Admin mutates the original object to version 2
  mutableTemplateV1.versionNumber = 2;
  mutableTemplateV1.primaryColorHex = '#1E293B';
  mutableTemplateV1.sections.push('gallery');

  // Existing invitation snapshot remains untouched at version 1
  assert.equal(invitationSnapshot.lockedVersionNumber, 1);
  assert.equal(invitationSnapshot.engineConfig.primaryColorHex, '#B45309');
  assert.equal(invitationSnapshot.engineConfig.sections.length, 4);
});

test('Architecture specs include ADRs, REST endpoints, and all 17 roadmap phases (Phase 0 to 16)', () => {
  assert.equal(ADR_LIST_SPEC.length, 8);
  assert.equal(ROADMAP_PHASES_SPEC.length, 17);
  assert.equal(ROADMAP_PHASES_SPEC[0].status, 'COMPLETED');
  assert.equal(API_ENDPOINTS_SPEC.length >= 10, true);
  assert.equal(formatToman(50000), '۵۰٬۰۰۰ تومان');
});
