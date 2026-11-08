import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  toPersianDigits,
  formatToman,
  buildPublicInvitationUrl,
  resolveDashboardNavItems,
  getCeremonyThemePalette,
  ENVELOPE_STYLES_SPEC,
  getEnvelopeStyleSpec,
} from './rtl-utils';

test('Phase 4 RTL Utilities: toPersianDigits and formatToman format 50,000 Toman with Persian numerals', () => {
  assert.equal(toPersianDigits(1405), '۱۴۰۵');
  assert.equal(toPersianDigits('09123456789'), '۰۹۱۲۳۴۵۶۷۸۹');
  assert.equal(formatToman(50000), '۵۰٬۰۰۰ تومان');
  assert.equal(formatToman(50000, false), '۵۰٬۰۰۰');
});

test('Phase 4 PublicInvitationLayout URL Helper: buildPublicInvitationUrl builds path-based /i/:slug URLs with LTR metadata', () => {
  const result = buildPublicInvitationUrl('Dayan123', 'https://example.ir/');
  assert.equal(result.cleanSlug, 'dayan123');
  assert.equal(result.path, '/i/dayan123');
  assert.equal(result.fullUrl, 'https://example.ir/i/dayan123');
  assert.equal(result.direction, 'ltr');

  const sanitized = buildPublicInvitationUrl('/i/ali & sara 1405/', 'https://eyvan.ir');
  assert.equal(sanitized.path, '/i/ali-sara-1405');
  assert.equal(sanitized.fullUrl, 'https://eyvan.ir/i/ali-sara-1405');
});

test('Phase 4 DashboardLayout Navigation: resolveDashboardNavItems respects RBAC roles (USER vs ADMIN)', () => {
  const userNav = resolveDashboardNavItems('USER', 'my-invitations');
  assert.equal(userNav.length, 6);
  assert.equal(
    userNav.every((i) => i.group === 'HOST'),
    true
  );
  assert.equal(userNav.find((i) => i.id === 'my-invitations')?.isActive, true);

  const adminNav = resolveDashboardNavItems('ADMIN', 'admin-pricing');
  assert.equal(adminNav.length, 9);
  assert.equal(adminNav.filter((i) => i.group === 'ADMIN').length, 3);
  assert.equal(adminNav.find((i) => i.id === 'admin-pricing')?.isActive, true);
});

test('Phase 4 PublicInvitationLayout Ceremonial Themes & 5 Envelope Styles: returns all 4 themes and 5 distinct envelope geometries', () => {
  const gold = getCeremonyThemePalette('LUXURY_GOLD');
  const emerald = getCeremonyThemePalette('PERSIAN_EMERALD');
  const rose = getCeremonyThemePalette('VELVET_ROSE');
  const ivory = getCeremonyThemePalette('MINIMAL_IVORY');

  assert.ok(gold.titleFa.includes('طلایی'));
  assert.ok(emerald.titleFa.includes('زمرد'));
  assert.ok(rose.titleFa.includes('رز'));
  assert.ok(ivory.titleFa.includes('عاجی'));

  assert.equal(ENVELOPE_STYLES_SPEC.length, 5);
  const geometries = new Set(ENVELOPE_STYLES_SPEC.map((s) => s.flapGeometry));
  assert.equal(geometries.size, 5, 'Each of the 5 envelope styles must have a distinct geometry');

  assert.equal(getEnvelopeStyleSpec('ROYAL_WAX_SEAL').flapGeometry, 'TRIANGLE_FLAP');
  assert.equal(getEnvelopeStyleSpec('PERSIAN_TERMEH_ARCH').flapGeometry, 'MEHRAB_ARCH');
  assert.equal(getEnvelopeStyleSpec('SILK_RIBBON_TIE').flapGeometry, 'CROSS_RIBBON');
  assert.equal(getEnvelopeStyleSpec('BOTANICAL_VELLUM_GATE').flapGeometry, 'GATEFOLD_DOORS');
  assert.equal(getEnvelopeStyleSpec('MODERN_ARCH_POCKET').flapGeometry, 'ANGLED_POCKET');
});

test('Phase 4 Layout Files Verification: DashboardLayout.tsx, PublicInvitationLayout.tsx and Vazirmatn RTL config exist', () => {
  const rootDir = process.cwd();
  const dashboardLayoutPath = path.join(rootDir, 'src/layouts/DashboardLayout.tsx');
  const publicLayoutPath = path.join(rootDir, 'src/layouts/PublicInvitationLayout.tsx');
  const cssPath = path.join(rootDir, 'src/index.css');
  const htmlPath = path.join(rootDir, 'index.html');

  assert.equal(fs.existsSync(dashboardLayoutPath), true, 'DashboardLayout.tsx must exist');
  assert.equal(fs.existsSync(publicLayoutPath), true, 'PublicInvitationLayout.tsx must exist');

  const dashboardCode = fs.readFileSync(dashboardLayoutPath, 'utf8');
  const publicCode = fs.readFileSync(publicLayoutPath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');
  const htmlCode = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(dashboardCode.includes('dir="rtl"'), 'DashboardLayout must enforce dir="rtl"');
  assert.ok(
    dashboardCode.includes('font-vazirmatn'),
    'DashboardLayout must use Vazirmatn font class'
  );
  assert.ok(publicCode.includes('dir="rtl"'), 'PublicInvitationLayout must enforce dir="rtl"');
  assert.ok(
    publicCode.includes('font-vazirmatn'),
    'PublicInvitationLayout must use Vazirmatn font class'
  );
  assert.ok(cssCode.includes('Vazirmatn'), 'src/index.css must configure Vazirmatn font');
  assert.ok(
    htmlCode.includes('Vazirmatn') && htmlCode.includes('dir="rtl"'),
    'index.html must load Vazirmatn and set dir="rtl"'
  );
});
