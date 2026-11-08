/**
 * Pure RTL, Persian Typography, Ceremonial Themes & Multi-Envelope Specifications
 * for DashboardLayout and PublicInvitationLayout.
 * Decoupled from React DOM so it can be unit-tested directly with node:test.
 */

export type UserRoleCode = 'USER' | 'SUPPORT' | 'ADMIN' | 'SUPER_ADMIN';

export type CeremonyThemeId = 'LUXURY_GOLD' | 'PERSIAN_EMERALD' | 'VELVET_ROSE' | 'MINIMAL_IVORY';

export type EnvelopeStyleId =
  | 'ROYAL_WAX_SEAL'
  | 'PERSIAN_TERMEH_ARCH'
  | 'SILK_RIBBON_TIE'
  | 'BOTANICAL_VELLUM_GATE'
  | 'MODERN_ARCH_POCKET';

export type DataViewState = 'POPULATED' | 'LOADING' | 'EMPTY' | 'ERROR';

export interface DashboardNavItem {
  id: string;
  labelFa: string;
  group: 'HOST' | 'ADMIN';
  href: string;
  badgeText?: string;
  badgeTone?: 'amber' | 'emerald' | 'slate';
  isActive: boolean;
}

export interface CeremonyThemePalette {
  id: CeremonyThemeId;
  titleFa: string;
  subtitleFa: string;
  outerBgClass: string;
  cardBgClass: string;
  headerAccentClass: string;
  primaryTextClass: string;
  secondaryTextClass: string;
  accentTextClass: string;
  borderClass: string;
  buttonPrimaryClass: string;
  badgeClass: string;
  sealBgClass: string;
}

export interface EnvelopeStyleSpec {
  id: EnvelopeStyleId;
  titleFa: string;
  shortLabelFa: string;
  subtitleFa: string;
  flapGeometry:
    'TRIANGLE_FLAP' | 'MEHRAB_ARCH' | 'CROSS_RIBBON' | 'GATEFOLD_DOORS' | 'ANGLED_POCKET';
  claspTitleFa: string;
  actionPromptFa: string;
  recommendedForFa: string;
  accentBadgeClass: string;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

/**
 * Converts English (0-9) or Arabic-Indic (٠-٩) digits to standard Persian digits (۰-۹).
 */
export function toPersianDigits(value: string | number): string {
  const str = String(value);
  return str
    .replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d)
    .replace(/[٠-٩]/g, (d) => PERSIAN_DIGITS[d.charCodeAt(0) - 0x0660] ?? d);
}

/**
 * Formats an integer Toman amount using Persian thousands separators (٬) and Persian numerals.
 * Example: 50000 -> "۵۰٬۰۰۰ تومان"
 */
export function formatToman(amountToman: number, includeCurrency = true): string {
  const safeAmount = Math.max(0, Math.round(amountToman));
  const withCommas = safeAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
  const persianNumber = toPersianDigits(withCommas);
  return includeCurrency ? `${persianNumber} تومان` : persianNumber;
}

/**
 * Builds the canonical path-based URL for a public invitation (/i/:slug).
 * Enforces explicit LTR metadata for safe display inside RTL containers.
 */
export function buildPublicInvitationUrl(
  slug: string,
  baseOrigin = 'https://example.ir'
): {
  cleanSlug: string;
  path: string;
  fullUrl: string;
  direction: 'ltr';
} {
  const cleanSlug =
    slug
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, '')
      .replace(/^i\//, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'dayan123';

  const normalizedOrigin = baseOrigin.replace(/\/+$/, '');
  const path = `/i/${cleanSlug}`;
  return {
    cleanSlug,
    path,
    fullUrl: `${normalizedOrigin}${path}`,
    direction: 'ltr',
  };
}

/**
 * Resolves the RTL Sidebar & Mobile Drawer navigation items for DashboardLayout
 * based on the user's RBAC role and currently active section.
 */
export function resolveDashboardNavItems(
  role: UserRoleCode,
  activeSectionId: string
): DashboardNavItem[] {
  const hostItems: Omit<DashboardNavItem, 'isActive'>[] = [
    {
      id: 'overview',
      labelFa: 'میز کار میزبان',
      group: 'HOST',
      href: '/dashboard',
    },
    {
      id: 'my-invitations',
      labelFa: 'دعوت‌نامه‌های من',
      group: 'HOST',
      href: '/dashboard/invitations',
      badgeText: toPersianDigits(2),
      badgeTone: 'amber',
    },
    {
      id: 'builder',
      labelFa: 'ساخت دعوت‌نامه جدید',
      group: 'HOST',
      href: '/dashboard/builder',
      badgeText: '۵۰٬۰۰۰ ت',
      badgeTone: 'emerald',
    },
    {
      id: 'templates',
      labelFa: 'گالری قالب‌های مراسم',
      group: 'HOST',
      href: '/dashboard/templates',
      badgeText: toPersianDigits(6),
      badgeTone: 'slate',
    },
    {
      id: 'guests-rsvp',
      labelFa: 'مهمانان و پاسخ حضور (RSVP)',
      group: 'HOST',
      href: '/dashboard/guests',
      badgeText: toPersianDigits(48),
      badgeTone: 'emerald',
    },
    {
      id: 'orders',
      labelFa: 'سفارش‌ها و پرداخت‌ها',
      group: 'HOST',
      href: '/dashboard/orders',
    },
  ];

  const adminItems: Omit<DashboardNavItem, 'isActive'>[] = [
    {
      id: 'admin-templates',
      labelFa: 'مدیریت قالب‌ها و نسخه‌ها',
      group: 'ADMIN',
      href: '/admin/templates',
    },
    {
      id: 'admin-pricing',
      labelFa: 'تعرفه پایه و کدهای تخفیف',
      group: 'ADMIN',
      href: '/admin/pricing',
      badgeText: '۵۰٬۰۰۰ ت',
      badgeTone: 'amber',
    },
    {
      id: 'admin-users',
      labelFa: 'مدیریت کاربران و نشست‌ها',
      group: 'ADMIN',
      href: '/admin/users',
    },
  ];

  const includeAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPPORT';
  const combined = includeAdmin ? [...hostItems, ...adminItems] : hostItems;

  return combined.map((item) => ({
    ...item,
    isActive: item.id === activeSectionId,
  }));
}

/**
 * Returns the ceremonial color & typography tokens for PublicInvitationLayout.
 */
export function getCeremonyThemePalette(themeId: CeremonyThemeId): CeremonyThemePalette {
  const palettes: Record<CeremonyThemeId, CeremonyThemePalette> = {
    LUXURY_GOLD: {
      id: 'LUXURY_GOLD',
      titleFa: 'طلایی سلطنتی (عروسی کلاسیک)',
      subtitleFa: 'ترکیب عاجی گرم، طلایی شامپاینی و حاشیه‌های ظریف ایرانی',
      outerBgClass: 'bg-[#F7F3EB] text-slate-900',
      cardBgClass: 'bg-[#FFFDF9]',
      headerAccentClass: 'from-amber-900 via-amber-800 to-amber-950 text-amber-50',
      primaryTextClass: 'text-slate-900',
      secondaryTextClass: 'text-slate-600',
      accentTextClass: 'text-amber-800',
      borderClass: 'border-amber-700/25',
      buttonPrimaryClass: 'bg-amber-800 hover:bg-amber-900 text-amber-50 shadow-sm',
      badgeClass: 'bg-amber-100/90 text-amber-900 border border-amber-300/70',
      sealBgClass: 'bg-amber-800 text-amber-50 ring-4 ring-amber-200/80',
    },
    PERSIAN_EMERALD: {
      id: 'PERSIAN_EMERALD',
      titleFa: 'زمرد ایرانی (نامزدی و عقد)',
      subtitleFa: 'سبز زمردی اصیل با جزئیات طلایی و پس‌زمینه کاغذ کتان روشن',
      outerBgClass: 'bg-[#EFF5F2] text-slate-900',
      cardBgClass: 'bg-[#FAFCFB]',
      headerAccentClass: 'from-emerald-950 via-emerald-900 to-teal-950 text-emerald-50',
      primaryTextClass: 'text-slate-900',
      secondaryTextClass: 'text-slate-600',
      accentTextClass: 'text-emerald-800',
      borderClass: 'border-emerald-800/20',
      buttonPrimaryClass: 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm',
      badgeClass: 'bg-emerald-100/90 text-emerald-900 border border-emerald-300/70',
      sealBgClass: 'bg-emerald-800 text-emerald-50 ring-4 ring-emerald-200/80',
    },
    VELVET_ROSE: {
      id: 'VELVET_ROSE',
      titleFa: 'رز مخملی (جشن تولد و سالگرد)',
      subtitleFa: 'تناژ گرم یاقوتی و رزگلد مناسب جشن‌های صمیمی و خانوادگی',
      outerBgClass: 'bg-[#F9F1F2] text-slate-900',
      cardBgClass: 'bg-[#FFFBFB]',
      headerAccentClass: 'from-rose-950 via-rose-900 to-amber-950 text-rose-50',
      primaryTextClass: 'text-slate-900',
      secondaryTextClass: 'text-slate-600',
      accentTextClass: 'text-rose-800',
      borderClass: 'border-rose-800/20',
      buttonPrimaryClass: 'bg-rose-800 hover:bg-rose-900 text-white shadow-sm',
      badgeClass: 'bg-rose-100/90 text-rose-900 border border-rose-300/70',
      sealBgClass: 'bg-rose-800 text-rose-50 ring-4 ring-rose-200/80',
    },
    MINIMAL_IVORY: {
      id: 'MINIMAL_IVORY',
      titleFa: 'عاجی مینیمال (همایش و افتتاحیه رسمی)',
      subtitleFa: 'تایپوگرافی مدرن با کنتراست ذغالی و خطوط معماری دقیق',
      outerBgClass: 'bg-slate-100 text-slate-900',
      cardBgClass: 'bg-white',
      headerAccentClass: 'from-slate-900 via-slate-800 to-slate-950 text-white',
      primaryTextClass: 'text-slate-900',
      secondaryTextClass: 'text-slate-600',
      accentTextClass: 'text-slate-800',
      borderClass: 'border-slate-300',
      buttonPrimaryClass: 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm',
      badgeClass: 'bg-slate-100 text-slate-800 border border-slate-300',
      sealBgClass: 'bg-slate-900 text-white ring-4 ring-slate-200',
    },
  };

  return palettes[themeId];
}

/**
 * Complete catalog of the 5 ceremonial envelope designs supported by PublicInvitationLayout.
 */
export const ENVELOPE_STYLES_SPEC: readonly EnvelopeStyleSpec[] = [
  {
    id: 'ROYAL_WAX_SEAL',
    titleFa: 'پاکت سلطنتی با مُهر موم طلایی',
    shortLabelFa: '۱. مُهر موم سلطنتی',
    subtitleFa: 'درب مثلثی کلاسیک با کاغذ کتان عاجی و مُهر موم برجسته حروف اول عروس و داماد',
    flapGeometry: 'TRIANGLE_FLAP',
    claspTitleFa: 'مُهر موم برجسته طلایی',
    actionPromptFa: 'لمس مُهر موم و گشودن پاکت سلطنتی',
    recommendedForFa: 'جشن عروسی کلاسیک و تشریفاتی',
    accentBadgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'PERSIAN_TERMEH_ARCH',
    titleFa: 'پاکت محرابی ترمه و کاشی ایرانی',
    shortLabelFa: '۲. محرابی ترمه ایرانی',
    subtitleFa: 'تاج گنبدی و محرابی الهام‌گرفته از معماری ایرانی با نگین هشت‌ضلعی فیروزه‌نشان',
    flapGeometry: 'MEHRAB_ARCH',
    claspTitleFa: 'نگین هشت‌ضلعی شمسه ایرانی',
    actionPromptFa: 'لمس نگین شمسه و گشودن پاکت محرابی',
    recommendedForFa: 'مراسم عقد، نامزدی و جشن‌های اصیل ایرانی',
    accentBadgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'SILK_RIBBON_TIE',
    titleFa: 'پاکت مخملی با روبان ابریشمی و پاپیون',
    shortLabelFa: '۳. روبان ابریشمی',
    subtitleFa: 'نوارهای متقاطع ساتن ابریشمی با گره پاپیون مرکزی و تگ آویز اختصاصی نام مهمان',
    flapGeometry: 'CROSS_RIBBON',
    claspTitleFa: 'گره پاپیون ابریشمی و تگ مهمان',
    actionPromptFa: 'باز کردن گره روبان و مشاهده کارت دعوت',
    recommendedForFa: 'جشن تولد، سالگرد ازدواج و مهمانی‌های ویژه',
    accentBadgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'BOTANICAL_VELLUM_GATE',
    titleFa: 'پاکت دولنگه کالک گل‌دار (Gatefold)',
    shortLabelFa: '۴. دولنگه کالک گل‌دار',
    subtitleFa: 'درب‌های دولنگه بازشونده از مرکز با کاغذ نیمه‌شفاف کالک و سگک طلایی برگ زیتون',
    flapGeometry: 'GATEFOLD_DOORS',
    claspTitleFa: 'سگک طلایی برگ زیتون و رز',
    actionPromptFa: 'گشودن درب‌های دولنگه کالک',
    recommendedForFa: 'فرمالیته، عروسی باغ و مراسم‌های فضای باز',
    accentBadgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  {
    id: 'MODERN_ARCH_POCKET',
    titleFa: 'پاکت جیبی مدرن قوسی (Pocket Fold)',
    shortLabelFa: '۵. جیبی مدرن (Pocket)',
    subtitleFa: 'جیب مورب معماری در پایین پاکت که کارت دعوت قوسی‌شکل از بالای آن نمایان است',
    flapGeometry: 'ANGLED_POCKET',
    claspTitleFa: 'مونوگرام هندسی مدرن',
    actionPromptFa: 'بیرون کشیدن کارت از جیب پاکت',
    recommendedForFa: 'همایش‌های رسمی، افتتاحیه، گالری و مراسم مدرن',
    accentBadgeClass: 'bg-slate-200 text-slate-900 border-slate-300',
  },
] as const;

/**
 * Retrieves the metadata and geometry specification for a given EnvelopeStyleId.
 */
export function getEnvelopeStyleSpec(styleId: EnvelopeStyleId): EnvelopeStyleSpec {
  const found = ENVELOPE_STYLES_SPEC.find((item) => item.id === styleId);
  return found ?? ENVELOPE_STYLES_SPEC[0];
}
