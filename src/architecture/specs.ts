export type EntityGroup =
  'auth_rbac' | 'templates_engine' | 'invitations_rsvp' | 'orders_payments' | 'admin_system';

export interface ColumnSpec {
  name: string;
  type: string;
  constraints: string;
  descriptionFa: string;
}

export interface DatabaseTableSpec {
  tableName: string;
  titleFa: string;
  group: EntityGroup;
  groupLabelFa: string;
  deletionPolicy: string;
  descriptionFa: string;
  columns: ColumnSpec[];
  indexes: string[];
  foreignKeys: string[];
}

export interface ApiEndpointSpec {
  id: string;
  module: string;
  moduleLabelFa: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  accessLevel: 'PUBLIC' | 'USER' | 'OWNER' | 'ADMIN' | 'GATEWAY_CALLBACK';
  accessLabelFa: string;
  rateLimit: string;
  summaryFa: string;
  securityNotesFa: string;
  sampleRequest?: string;
  sampleResponse: string;
}

export interface AdrSpec {
  id: string;
  titleFa: string;
  status: 'Accepted';
  dateJalali: string;
  contextFa: string;
  decisionFa: string;
  consequencesFa: string[];
}

export interface PhaseRoadmapSpec {
  phaseNumber: number;
  code: string;
  titleEn: string;
  titleFa: string;
  status: 'COMPLETED' | 'NEXT_READY' | 'PLANNED';
  deliverablesFa: string[];
  verificationGateFa: string;
}

export const BASE_INVITATION_PRICE_TOMAN = 50000;

export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'logout',
  'dashboard',
  'settings',
  'templates',
  'orders',
  'payments',
  'callback',
  'health',
  'assets',
  'static',
  'public',
  'support',
  'help',
  'terms',
  'privacy',
  'i',
  'root',
  'system',
]);

export interface SlugValidationResult {
  isValid: boolean;
  normalizedSlug: string;
  publicUrl: string;
  errorCode?:
    'EMPTY' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT' | 'RESERVED_WORD' | 'ALREADY_TAKEN';
  messageFa: string;
  suggestions: string[];
}

/**
 * اعتبارسنجی آدرس اختصاصی دعوتنامه (/i/:slug) و پیشنهاد خودکار در صورت برخورد با اسلاگ تکراری یا رزروشده
 */
export function validateInvitationSlug(
  rawInput: string,
  existingSlugs: Iterable<string> = [],
  baseDomain = 'https://example.ir'
): SlugValidationResult {
  const normalized = rawInput.trim().toLowerCase();

  if (!normalized) {
    return {
      isValid: false,
      normalizedSlug: '',
      publicUrl: `${baseDomain}/i/`,
      errorCode: 'EMPTY',
      messageFa: 'لطفاً شناسه لینک اختصاصی دعوتنامه را وارد کنید.',
      suggestions: ['dayan123', 'ali-sara-1405'],
    };
  }

  if (normalized.length < 4) {
    return {
      isValid: false,
      normalizedSlug: normalized,
      publicUrl: `${baseDomain}/i/${normalized}`,
      errorCode: 'TOO_SHORT',
      messageFa: 'آدرس اختصاصی باید حداقل ۴ کاراکتر باشد.',
      suggestions: [`${normalized}-1405`, `${normalized}-wedding`],
    };
  }

  if (normalized.length > 50) {
    const trimmed = normalized.slice(0, 45).replace(/-+$/, '');
    return {
      isValid: false,
      normalizedSlug: normalized,
      publicUrl: `${baseDomain}/i/${normalized}`,
      errorCode: 'TOO_LONG',
      messageFa: 'آدرس اختصاصی نمیتواند بیشتر از ۵۰ کاراکتر باشد.',
      suggestions: [trimmed],
    };
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(normalized)) {
    const cleaned = normalized
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    const fallback = cleaned.length >= 4 ? cleaned : 'eyvan-event-1405';
    return {
      isValid: false,
      normalizedSlug: normalized,
      publicUrl: `${baseDomain}/i/${normalized}`,
      errorCode: 'INVALID_FORMAT',
      messageFa:
        'فقط حروف انگلیسی کوچک (a-z)، اعداد (0-9) و خط تیره (-) مجاز هستند (بدون خط تیره در ابتدا یا انتها).',
      suggestions: [fallback, `${fallback}-1405`],
    };
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return {
      isValid: false,
      normalizedSlug: normalized,
      publicUrl: `${baseDomain}/i/${normalized}`,
      errorCode: 'RESERVED_WORD',
      messageFa:
        'این عبارت جزو مسیرهای رزروشده سیستم است و نمیتواند بهعنوان لینک دعوتنامه استفاده شود.',
      suggestions: [`${normalized}-invitation`, `my-${normalized}-1405`],
    };
  }

  const takenSet = new Set(Array.from(existingSlugs, (s) => s.toLowerCase()));
  if (takenSet.has(normalized)) {
    const candidates = [
      `${normalized}-1405`,
      `${normalized}-wedding`,
      `${normalized}-jashn`,
      `${normalized}-vip`,
    ].filter((c) => !takenSet.has(c));

    return {
      isValid: false,
      normalizedSlug: normalized,
      publicUrl: `${baseDomain}/i/${normalized}`,
      errorCode: 'ALREADY_TAKEN',
      messageFa: 'این آدرس اختصاصی قبلاً توسط کاربر دیگری ثبت شده است.',
      suggestions: candidates,
    };
  }

  return {
    isValid: true,
    normalizedSlug: normalized,
    publicUrl: `${baseDomain}/i/${normalized}`,
    messageFa: 'آدرس اختصاصی معتبر و آزاد است.',
    suggestions: [],
  };
}

export interface CouponRule {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_TOMAN';
  discountValue: number;
  maxDiscountToman: number | null;
  minOrderToman: number;
  isActive: boolean;
  isExpired: boolean;
  usageLimitTotal: number | null;
  usedCount: number;
}

export interface ServerOrderPricingInput {
  systemBasePriceToman: number;
  templateIsFree: boolean;
  templatePriceOverrideToman: number | null;
  couponCode?: string;
  availableCoupons?: CouponRule[];
}

export interface ServerOrderPricingResult {
  subtotalToman: number;
  discountToman: number;
  finalAmountToman: number;
  finalAmountRial: number;
  requiresGatewayRedirect: boolean;
  couponApplied: boolean;
  couponStatusMessageFa: string;
}

/**
 * محاسبه امن قیمت سفارش در سمت سرور (عدم اعتماد به قیمت ارسالی مرورگر)
 */
export function calculateServerOrderPricing(
  input: ServerOrderPricingInput
): ServerOrderPricingResult {
  const safeSystemBase = Math.max(0, Math.trunc(input.systemBasePriceToman));

  let subtotalToman = safeSystemBase;
  if (input.templateIsFree) {
    subtotalToman = 0;
  } else if (
    typeof input.templatePriceOverrideToman === 'number' &&
    input.templatePriceOverrideToman >= 0
  ) {
    subtotalToman = Math.trunc(input.templatePriceOverrideToman);
  }

  if (subtotalToman === 0) {
    return {
      subtotalToman: 0,
      discountToman: 0,
      finalAmountToman: 0,
      finalAmountRial: 0,
      requiresGatewayRedirect: false,
      couponApplied: false,
      couponStatusMessageFa: 'این قالب رایگان است و نیازی به پرداخت ندارد.',
    };
  }

  const normalizedCode = (input.couponCode || '').trim().toUpperCase();
  if (!normalizedCode) {
    return {
      subtotalToman,
      discountToman: 0,
      finalAmountToman: subtotalToman,
      finalAmountRial: subtotalToman * 10,
      requiresGatewayRedirect: true,
      couponApplied: false,
      couponStatusMessageFa: 'بدون کد تخفیف',
    };
  }

  const matchedCoupon = (input.availableCoupons || []).find(
    (c) => c.code.toUpperCase() === normalizedCode
  );

  if (!matchedCoupon) {
    return {
      subtotalToman,
      discountToman: 0,
      finalAmountToman: subtotalToman,
      finalAmountRial: subtotalToman * 10,
      requiresGatewayRedirect: true,
      couponApplied: false,
      couponStatusMessageFa: 'کد تخفیف واردشده یافت نشد.',
    };
  }

  if (!matchedCoupon.isActive || matchedCoupon.isExpired) {
    return {
      subtotalToman,
      discountToman: 0,
      finalAmountToman: subtotalToman,
      finalAmountRial: subtotalToman * 10,
      requiresGatewayRedirect: true,
      couponApplied: false,
      couponStatusMessageFa: 'مهلت استفاده از این کد تخفیف به پایان رسیده یا غیرفعال است.',
    };
  }

  if (
    matchedCoupon.usageLimitTotal !== null &&
    matchedCoupon.usedCount >= matchedCoupon.usageLimitTotal
  ) {
    return {
      subtotalToman,
      discountToman: 0,
      finalAmountToman: subtotalToman,
      finalAmountRial: subtotalToman * 10,
      requiresGatewayRedirect: true,
      couponApplied: false,
      couponStatusMessageFa: 'ظرفیت استفاده از این کد تخفیف تکمیل شده است.',
    };
  }

  if (subtotalToman < matchedCoupon.minOrderToman) {
    return {
      subtotalToman,
      discountToman: 0,
      finalAmountToman: subtotalToman,
      finalAmountRial: subtotalToman * 10,
      requiresGatewayRedirect: true,
      couponApplied: false,
      couponStatusMessageFa: `حداقل مبلغ سفارش برای این کد ${formatPersianNumber(matchedCoupon.minOrderToman)} تومان است.`,
    };
  }

  let rawDiscount: number;
  if (matchedCoupon.discountType === 'PERCENTAGE') {
    const pct = Math.min(100, Math.max(0, matchedCoupon.discountValue));
    rawDiscount = Math.floor((subtotalToman * pct) / 100);
    if (matchedCoupon.maxDiscountToman !== null && rawDiscount > matchedCoupon.maxDiscountToman) {
      rawDiscount = matchedCoupon.maxDiscountToman;
    }
  } else {
    rawDiscount = Math.trunc(matchedCoupon.discountValue);
  }

  const discountToman = Math.min(subtotalToman, Math.max(0, rawDiscount));
  const finalAmountToman = subtotalToman - discountToman;

  return {
    subtotalToman,
    discountToman,
    finalAmountToman,
    finalAmountRial: finalAmountToman * 10,
    requiresGatewayRedirect: finalAmountToman > 0,
    couponApplied: true,
    couponStatusMessageFa: `کد تخفیف ${matchedCoupon.code} با موفقیت اعمال شد (${formatPersianNumber(discountToman)} تومان کسر گردید).`,
  };
}

export interface TemplateEngineDefinition {
  templateId: string;
  versionNumber: number;
  fontFamily: string;
  primaryColorHex: string;
  backgroundColorHex: string;
  sections: string[];
  animationPreset: 'floral-reveal' | 'fade-up' | 'envelope-gold' | 'none';
}

export interface InvitationTemplateSnapshot {
  snapshotCreatedAtIso: string;
  lockedTemplateId: string;
  lockedVersionNumber: number;
  engineConfig: Readonly<TemplateEngineDefinition>;
}

/**
 * ایجاد اسنپشات تغییرناپذیر (Immutable Snapshot) از نسخه قالب هنگام انتشار دعوتنامه
 * تا ویرایشهای بعدی قالب توسط ادمین ظاهر دعوتنامههای قبلی را تغییر ندهد
 */
export function createImmutableTemplateSnapshot(
  definition: TemplateEngineDefinition,
  timestampIso = '2026-11-06T12:00:00.000Z'
): Readonly<InvitationTemplateSnapshot> {
  const clonedConfig: TemplateEngineDefinition = {
    templateId: String(definition.templateId),
    versionNumber: Number(definition.versionNumber),
    fontFamily: String(definition.fontFamily),
    primaryColorHex: String(definition.primaryColorHex),
    backgroundColorHex: String(definition.backgroundColorHex),
    sections: [...definition.sections],
    animationPreset: definition.animationPreset,
  };

  Object.freeze(clonedConfig.sections);
  Object.freeze(clonedConfig);

  const snapshot: InvitationTemplateSnapshot = {
    snapshotCreatedAtIso: timestampIso,
    lockedTemplateId: clonedConfig.templateId,
    lockedVersionNumber: clonedConfig.versionNumber,
    engineConfig: clonedConfig,
  };

  return Object.freeze(snapshot);
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] || d);
}

export function formatPersianNumber(amount: number): string {
  const formatted = Math.trunc(amount).toLocaleString('en-US');
  return toPersianDigits(formatted.replace(/,/g, '٬'));
}

export function formatToman(amount: number): string {
  return `${formatPersianNumber(amount)} تومان`;
}

export const SAMPLE_COUPONS: CouponRule[] = [
  {
    code: 'BAHAR20',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountToman: 25000,
    minOrderToman: 30000,
    isActive: true,
    isExpired: false,
    usageLimitTotal: 100,
    usedCount: 14,
  },
  {
    code: 'EYVAN15',
    discountType: 'FIXED_TOMAN',
    discountValue: 15000,
    maxDiscountToman: null,
    minOrderToman: 40000,
    isActive: true,
    isExpired: false,
    usageLimitTotal: 50,
    usedCount: 8,
  },
  {
    code: 'VIP100',
    discountType: 'PERCENTAGE',
    discountValue: 100,
    maxDiscountToman: null,
    minOrderToman: 0,
    isActive: true,
    isExpired: false,
    usageLimitTotal: 10,
    usedCount: 2,
  },
  {
    code: 'EXPIRED99',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    maxDiscountToman: null,
    minOrderToman: 0,
    isActive: false,
    isExpired: true,
    usageLimitTotal: 10,
    usedCount: 10,
  },
];

export const DATABASE_TABLES_SPEC: DatabaseTableSpec[] = [
  {
    tableName: 'roles',
    titleFa: 'نقشهای کاربری',
    group: 'auth_rbac',
    groupLabelFa: 'احراز هویت و کنترل دسترسی',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'تعریف نقشهای پایه سیستم شامل کاربر عادی (USER)، پشتیبان (SUPPORT)، مدیر (ADMIN) و مدیر ارشد (SUPER_ADMIN).',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه یکتای نقش' },
      {
        name: 'code',
        type: 'VARCHAR(50)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'کد سیستمی نقش (USER, ADMIN, SUPER_ADMIN)',
      },
      {
        name: 'title_fa',
        type: 'VARCHAR(100)',
        constraints: 'NOT NULL',
        descriptionFa: 'عنوان فارسی نقش',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان ایجاد',
      },
    ],
    indexes: ['UNIQUE(code)'],
    foreignKeys: [],
  },
  {
    tableName: 'permissions',
    titleFa: 'مجوزهای دسترسی ریزدانه',
    group: 'auth_rbac',
    groupLabelFa: 'احراز هویت و کنترل دسترسی',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa: 'فهرست مجوزهای عملیاتی برای تفکیک دقیق دسترسی ادمینها از کاربران عادی.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه یکتای مجوز' },
      {
        name: 'code',
        type: 'VARCHAR(100)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'کد مجوز (مانند pricing:manage یا templates:write)',
      },
      {
        name: 'module',
        type: 'VARCHAR(50)',
        constraints: 'NOT NULL',
        descriptionFa: 'ماژول مرتبط',
      },
      {
        name: 'title_fa',
        type: 'VARCHAR(150)',
        constraints: 'NOT NULL',
        descriptionFa: 'عنوان فارسی مجوز',
      },
    ],
    indexes: ['UNIQUE(code)', 'idx_permissions_module(module)'],
    foreignKeys: [],
  },
  {
    tableName: 'users',
    titleFa: 'کاربران سامانه',
    group: 'auth_rbac',
    groupLabelFa: 'احراز هویت و کنترل دسترسی',
    deletionPolicy: 'ON DELETE RESTRICT (حفظ سوابق مالی)',
    descriptionFa:
      'اطلاعات حساب کاربری میزبانان مراسم و مدیران سامانه بههمراه مکانیزم قفل موقت در برابر Brute Force.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه یکتای کاربر' },
      {
        name: 'role_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES roles(id)',
        descriptionFa: 'نقش کاربر',
      },
      {
        name: 'full_name',
        type: 'VARCHAR(120)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام و نام خانوادگی',
      },
      {
        name: 'phone_number',
        type: 'VARCHAR(15)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'شماره موبایل ایران (09xxxxxxxxx)',
      },
      {
        name: 'email',
        type: 'VARCHAR(255)',
        constraints: 'UNIQUE NULL',
        descriptionFa: 'پست الکترونیکی',
      },
      {
        name: 'password_hash',
        type: 'VARCHAR(255)',
        constraints: 'NOT NULL',
        descriptionFa: 'هش رمز عبور (Bcrypt / Argon2id)',
      },
      {
        name: 'status',
        type: 'VARCHAR(20)',
        constraints: "NOT NULL DEFAULT 'ACTIVE'",
        descriptionFa: 'وضعیت (ACTIVE, SUSPENDED)',
      },
      {
        name: 'failed_login_attempts',
        type: 'SMALLINT',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'تعداد تلاش ناموفق ورود',
      },
      {
        name: 'locked_until',
        type: 'TIMESTAMPTZ',
        constraints: 'NULL',
        descriptionFa: 'زمان رفع مسدودی موقت ورود',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان ثبتنام',
      },
    ],
    indexes: ['idx_users_phone(phone_number)', 'idx_users_role_status(role_id, status)'],
    foreignKeys: ['role_id -> roles.id (ON DELETE RESTRICT)'],
  },
  {
    tableName: 'user_sessions',
    titleFa: 'نشستهای فعال کاربران',
    group: 'auth_rbac',
    groupLabelFa: 'احراز هویت و کنترل دسترسی',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa:
      'نگهداری هش توکنهای نوسازی (Refresh Tokens) با قابلیت ابطال آنی نشستها و مشاهده دستگاههای متصل.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه نشست' },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر مالک نشست',
      },
      {
        name: 'refresh_token_hash',
        type: 'VARCHAR(255)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'هش SHA-256 توکن نوسازی',
      },
      {
        name: 'ip_address',
        type: 'VARCHAR(45)',
        constraints: 'NOT NULL',
        descriptionFa: 'آدرس IP کاربر',
      },
      {
        name: 'is_revoked',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT FALSE',
        descriptionFa: 'وضعیت ابطال نشست',
      },
      {
        name: 'expires_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL',
        descriptionFa: 'زمان انقضای نشست',
      },
    ],
    indexes: ['idx_sessions_user_active(user_id, is_revoked, expires_at)'],
    foreignKeys: ['user_id -> users.id (ON DELETE CASCADE)'],
  },
  {
    tableName: 'template_categories',
    titleFa: 'دستهبندیهای قالب دعوتنامه',
    group: 'templates_engine',
    groupLabelFa: 'قالبها و موتور رندر',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'شامل ۶ دستهبندی اصلی اولیه: عروسی، تولد، نامزدی، مهمانی، افتتاحیه و مناسبتهای دیگر.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه دستهبندی' },
      {
        name: 'slug',
        type: 'VARCHAR(60)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'اسلاگ دسته (wedding, birthday, engagement, ...)',
      },
      {
        name: 'name_fa',
        type: 'VARCHAR(100)',
        constraints: 'NOT NULL',
        descriptionFa: 'عنوان فارسی دستهبندی',
      },
      {
        name: 'sort_order',
        type: 'SMALLINT',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'ترتیب نمایش',
      },
      {
        name: 'is_active',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'وضعیت فعال بودن',
      },
    ],
    indexes: ['UNIQUE(slug)', 'idx_template_cat_order(is_active, sort_order)'],
    foreignKeys: [],
  },
  {
    tableName: 'templates',
    titleFa: 'کاتالوگ قالبهای دعوتنامه',
    group: 'templates_engine',
    groupLabelFa: 'قالبها و موتور رندر',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'مشخصات تجاری و کاتالوگ قالبها (مستقل از داده دعوتنامه کاربران) با قابلیت تعریف قیمت اختصاصی برای هر قالب.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه قالب' },
      {
        name: 'category_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES template_categories(id)',
        descriptionFa: 'دستهبندی قالب',
      },
      {
        name: 'slug',
        type: 'VARCHAR(80)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'شناسه متنی قالب',
      },
      {
        name: 'name_fa',
        type: 'VARCHAR(150)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام فارسی قالب',
      },
      {
        name: 'is_free',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT FALSE',
        descriptionFa: 'رایگان یا پولی',
      },
      {
        name: 'price_override_toman',
        type: 'INTEGER',
        constraints: 'NULL CHECK (price_override_toman >= 0)',
        descriptionFa: 'قیمت اختصاصی قالب (در صورت NULL استفاده از قیمت پایه ۵۰٬۰۰۰ تومان)',
      },
      {
        name: 'is_featured',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT FALSE',
        descriptionFa: 'برچسب محبوب',
      },
      {
        name: 'is_new',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'برچسب جدید',
      },
      {
        name: 'status',
        type: 'VARCHAR(20)',
        constraints: "NOT NULL DEFAULT 'PUBLISHED'",
        descriptionFa: 'وضعیت انتشار (DRAFT, PUBLISHED, ARCHIVED)',
      },
      {
        name: 'current_version_id',
        type: 'UUID',
        constraints: 'NULL',
        descriptionFa: 'آخرین نسخه فعال قالب',
      },
    ],
    indexes: [
      'idx_templates_cat_status(category_id, status)',
      'idx_templates_featured(is_featured, status)',
    ],
    foreignKeys: ['category_id -> template_categories.id (ON DELETE RESTRICT)'],
  },
  {
    tableName: 'template_versions',
    titleFa: 'نسخههای ساختار موتور قالب',
    group: 'templates_engine',
    groupLabelFa: 'قالبها و موتور رندر',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'نگهداری نسخهبندیشده Layout، Typography، Colors، Animations و فیلدهای مجاز ویرایش بهصورت JSON امن.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه نسخه قالب' },
      {
        name: 'template_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES templates(id)',
        descriptionFa: 'قالب والد',
      },
      {
        name: 'version_number',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (version_number >= 1)',
        descriptionFa: 'شماره نسخه (1, 2, 3...)',
      },
      {
        name: 'engine_schema_json',
        type: 'JSONB',
        constraints: 'NOT NULL',
        descriptionFa: 'تعریف ساختار بخشها، رنگها، فونتها و انیمیشنها',
      },
      {
        name: 'default_content_json',
        type: 'JSONB',
        constraints: 'NOT NULL',
        descriptionFa: 'محتوای پیشفرض جهت پیشنمایش زنده',
      },
      {
        name: 'supports_music',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'پشتیبانی از موسیقی',
      },
      {
        name: 'supports_animations',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'پشتیبانی از انیمیشن',
      },
    ],
    indexes: ['UNIQUE(template_id, version_number)'],
    foreignKeys: ['template_id -> templates.id (ON DELETE RESTRICT)'],
  },
  {
    tableName: 'invitations',
    titleFa: 'دعوتنامههای کاربران',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'موجودیت اصلی دعوتنامه شامل اطلاعات مراسم، لینک اختصاصی (/i/:slug) و اسنپشات تغییرناپذیر نسخه قالب.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه دعوتنامه' },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر مالک دعوتنامه',
      },
      {
        name: 'template_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES templates(id)',
        descriptionFa: 'قالب انتخابی',
      },
      {
        name: 'template_version_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES template_versions(id)',
        descriptionFa: 'نسخه قفلشده قالب',
      },
      {
        name: 'slug',
        type: 'VARCHAR(60)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'آدرس اختصاصی عمومی (/i/dayan123)',
      },
      {
        name: 'status',
        type: 'VARCHAR(25)',
        constraints: "NOT NULL DEFAULT 'DRAFT'",
        descriptionFa: 'وضعیت (DRAFT, PENDING_PAYMENT, ACTIVE, EXPIRED)',
      },
      {
        name: 'event_title',
        type: 'VARCHAR(200)',
        constraints: 'NOT NULL',
        descriptionFa: 'عنوان مراسم',
      },
      {
        name: 'host_names',
        type: 'VARCHAR(200)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام میزبانها',
      },
      {
        name: 'event_jalali_label',
        type: 'VARCHAR(100)',
        constraints: 'NOT NULL',
        descriptionFa: 'تاریخ شمسی مراسم',
      },
      {
        name: 'venue_address',
        type: 'TEXT',
        constraints: 'NOT NULL',
        descriptionFa: 'آدرس محل برگزاری',
      },
      {
        name: 'music_enabled',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'وضعیت موسیقی پسزمینه',
      },
      {
        name: 'animation_enabled',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'وضعیت انیمیشن قالب',
      },
      {
        name: 'template_snapshot_json',
        type: 'JSONB',
        constraints: 'NOT NULL',
        descriptionFa: 'اسنپشات کامل قالب در زمان انتشار',
      },
    ],
    indexes: ['UNIQUE(slug)', 'idx_invitations_user_status(user_id, status)'],
    foreignKeys: [
      'user_id -> users.id (ON DELETE RESTRICT)',
      'template_id -> templates.id (ON DELETE RESTRICT)',
      'template_version_id -> template_versions.id (ON DELETE RESTRICT)',
    ],
  },
  {
    tableName: 'media_assets',
    titleFa: 'فایلها و رسانههای آپلودشده',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa:
      'مدیریت تصاویر و فایلهای صوتی تاییدشده با بررسی Magic Bytes و سقف حجم ۵ مگابایت.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه فایل' },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر آپلودکننده',
      },
      {
        name: 'storage_key',
        type: 'VARCHAR(400)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'کلید فایل در Object Storage',
      },
      {
        name: 'mime_type',
        type: 'VARCHAR(80)',
        constraints: 'NOT NULL',
        descriptionFa: 'نوع MIME تاییدشده (image/webp, image/jpeg, audio/mpeg)',
      },
      {
        name: 'file_size_bytes',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (file_size_bytes <= 5242880)',
        descriptionFa: 'حجم فایل به بایت',
      },
      {
        name: 'sha256_checksum',
        type: 'CHAR(64)',
        constraints: 'NOT NULL',
        descriptionFa: 'هش فایل جهت بررسی سلامت',
      },
    ],
    indexes: ['UNIQUE(storage_key)', 'idx_media_user(user_id)'],
    foreignKeys: ['user_id -> users.id (ON DELETE CASCADE)'],
  },
  {
    tableName: 'invitation_media',
    titleFa: 'اتصال رسانهها به جایگاههای دعوتنامه',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa:
      'نگاشت تصاویر و موسیقیهای انتخابی کاربر به جایگاههای مجاز قالب (hero_cover, gallery_1, ...).',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه رکورد' },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه مرتبط',
      },
      {
        name: 'media_asset_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES media_assets(id)',
        descriptionFa: 'فایل رسانهای',
      },
      {
        name: 'slot_key',
        type: 'VARCHAR(60)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام جایگاه در قالب',
      },
    ],
    indexes: ['UNIQUE(invitation_id, slot_key)'],
    foreignKeys: [
      'invitation_id -> invitations.id (ON DELETE CASCADE)',
      'media_asset_id -> media_assets.id (ON DELETE RESTRICT)',
    ],
  },
  {
    tableName: 'invitation_views',
    titleFa: 'آمار بازدید صفحات عمومی دعوتنامه',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa: 'ثبت بازدیدهای کل و یکتای روزانه با هش ناشناس بدون ذخیره اطلاعات شخصی غیرضروری.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه بازدید' },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه بازدیدشده',
      },
      {
        name: 'visitor_fingerprint_hash',
        type: 'CHAR(64)',
        constraints: 'NOT NULL',
        descriptionFa: 'هش ناشناس روزانه بازدیدکننده',
      },
      {
        name: 'is_unique_daily',
        type: 'BOOLEAN',
        constraints: 'NOT NULL DEFAULT TRUE',
        descriptionFa: 'آیا بازدید یکتای روزانه است؟',
      },
      {
        name: 'device_type',
        type: 'VARCHAR(20)',
        constraints: 'NOT NULL',
        descriptionFa: 'نوع دستگاه (MOBILE, DESKTOP)',
      },
      {
        name: 'viewed_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان بازدید',
      },
    ],
    indexes: ['idx_views_invitation_date(invitation_id, viewed_at)'],
    foreignKeys: ['invitation_id -> invitations.id (ON DELETE CASCADE)'],
  },
  {
    tableName: 'invitation_guests',
    titleFa: 'فهرست مهمانان تعریفشده توسط میزبان',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa:
      'مدیریت فهرست مهمانان اختصاصی و سقف همراهان مجاز برای هر مهمان (محرمانه و فقط قابلمشاهده توسط میزبان).',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه مهمان' },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه مرتبط',
      },
      {
        name: 'full_name',
        type: 'VARCHAR(120)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام مهمان / خانواده',
      },
      {
        name: 'phone_number',
        type: 'VARCHAR(15)',
        constraints: 'NULL',
        descriptionFa: 'شماره تماس مهمان (محرمانه)',
      },
      {
        name: 'allowed_companions',
        type: 'SMALLINT',
        constraints: 'NOT NULL DEFAULT 2',
        descriptionFa: 'سقف همراه مجاز',
      },
    ],
    indexes: ['idx_guests_invitation(invitation_id)'],
    foreignKeys: ['invitation_id -> invitations.id (ON DELETE CASCADE)'],
  },
  {
    tableName: 'rsvp_responses',
    titleFa: 'پاسخهای حضور مهمانان (RSVP)',
    group: 'invitations_rsvp',
    groupLabelFa: 'دعوتنامه، رسانه و مهمانان',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa:
      'ثبت پاسخ مهمانان (حضور دارم / حضور ندارم، تعداد همراهان و پیام تبریک) با قید جلوگیری از ثبت پاسخ تکراری.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه پاسخ' },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه مرتبط',
      },
      {
        name: 'guest_id',
        type: 'UUID',
        constraints: 'NULL REFERENCES invitation_guests(id)',
        descriptionFa: 'اتصال اختیاری به مهمان',
      },
      {
        name: 'respondent_name',
        type: 'VARCHAR(120)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام ثبتکننده پاسخ',
      },
      {
        name: 'respondent_phone_hash',
        type: 'CHAR(64)',
        constraints: 'NULL',
        descriptionFa: 'هش شماره/نشست جهت منع ثبت تکراری',
      },
      {
        name: 'attendance_status',
        type: 'VARCHAR(20)',
        constraints: 'NOT NULL',
        descriptionFa: 'وضعیت (ATTENDING, NOT_ATTENDING)',
      },
      {
        name: 'companions_count',
        type: 'SMALLINT',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'تعداد همراهان',
      },
      {
        name: 'guest_message',
        type: 'VARCHAR(500)',
        constraints: 'NULL',
        descriptionFa: 'پیام مهمان برای میزبان',
      },
    ],
    indexes: [
      'UNIQUE(invitation_id, respondent_phone_hash)',
      'idx_rsvp_invitation_status(invitation_id, attendance_status)',
    ],
    foreignKeys: [
      'invitation_id -> invitations.id (ON DELETE CASCADE)',
      'guest_id -> invitation_guests.id (ON DELETE SET NULL)',
    ],
  },
  {
    tableName: 'coupons',
    titleFa: 'کدهای تخفیف و کمپینها',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa: 'تعریف کدهای تخفیف درصدی و مبلغ ثابت با سقف تعداد استفاده و بازه زمانی اعتبار.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه کوپن' },
      {
        name: 'code',
        type: 'VARCHAR(40)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'کد تخفیف (مثلاً BAHAR20)',
      },
      {
        name: 'discount_type',
        type: 'VARCHAR(15)',
        constraints: 'NOT NULL',
        descriptionFa: 'نوع (PERCENTAGE, FIXED_TOMAN)',
      },
      {
        name: 'discount_value',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (discount_value > 0)',
        descriptionFa: 'مقدار تخفیف',
      },
      {
        name: 'max_discount_toman',
        type: 'INTEGER',
        constraints: 'NULL',
        descriptionFa: 'سقف تخفیف به تومان',
      },
      {
        name: 'min_order_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'حداقل مبلغ سفارش',
      },
      {
        name: 'usage_limit_total',
        type: 'INTEGER',
        constraints: 'NULL',
        descriptionFa: 'سقف کل دفعات مجاز',
      },
      {
        name: 'used_count',
        type: 'INTEGER',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'تعداد استفادهشده',
      },
      {
        name: 'expires_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL',
        descriptionFa: 'تاریخ انقضا',
      },
    ],
    indexes: ['UNIQUE(code)'],
    foreignKeys: [],
  },
  {
    tableName: 'orders',
    titleFa: 'سفارشهای خرید دعوتنامه',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE RESTRICT (غیرقابل حذف)',
    descriptionFa:
      'ثبت سفارش با قیمت محاسبهشده در سمت سرور و کلید یکتایی (Idempotency Key) جهت جلوگیری از سفارش تکراری.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه سفارش' },
      {
        name: 'order_number',
        type: 'VARCHAR(30)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'شماره فاکتور (INV-1405-xxxxx)',
      },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر خریدار',
      },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه مرتبط',
      },
      {
        name: 'coupon_id',
        type: 'UUID',
        constraints: 'NULL REFERENCES coupons(id)',
        descriptionFa: 'کوپن تخفیف',
      },
      {
        name: 'status',
        type: 'VARCHAR(25)',
        constraints: "NOT NULL DEFAULT 'PENDING'",
        descriptionFa: 'وضعیت (PENDING, PAID, FAILED, CANCELED)',
      },
      {
        name: 'subtotal_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (subtotal_toman >= 0)',
        descriptionFa: 'مبلغ پایه به تومان',
      },
      {
        name: 'discount_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL DEFAULT 0',
        descriptionFa: 'مبلغ تخفیف به تومان',
      },
      {
        name: 'final_amount_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (final_amount_toman >= 0)',
        descriptionFa: 'مبلغ قابل پرداخت نهایی',
      },
      {
        name: 'idempotency_key',
        type: 'VARCHAR(80)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'کلید منع ثبت تکراری',
      },
    ],
    indexes: [
      'UNIQUE(order_number)',
      'UNIQUE(idempotency_key)',
      'idx_orders_user_status(user_id, status)',
    ],
    foreignKeys: [
      'user_id -> users.id (ON DELETE RESTRICT)',
      'invitation_id -> invitations.id (ON DELETE RESTRICT)',
      'coupon_id -> coupons.id (ON DELETE RESTRICT)',
    ],
  },
  {
    tableName: 'order_items',
    titleFa: 'اقلام سفارش',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE CASCADE',
    descriptionFa: 'جزئیات ردیفهای فاکتور برای هر سفارش.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه ردیف سفارش' },
      {
        name: 'order_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES orders(id)',
        descriptionFa: 'سفارش والد',
      },
      {
        name: 'invitation_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES invitations(id)',
        descriptionFa: 'دعوتنامه مرتبط',
      },
      {
        name: 'title_fa',
        type: 'VARCHAR(200)',
        constraints: 'NOT NULL',
        descriptionFa: 'شرح آیتم فاکتور',
      },
      {
        name: 'unit_price_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL',
        descriptionFa: 'قیمت واحد (تومان)',
      },
      {
        name: 'line_total_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL',
        descriptionFa: 'مبلغ کل ردیف (تومان)',
      },
    ],
    indexes: ['idx_order_items_order(order_id)'],
    foreignKeys: [
      'order_id -> orders.id (ON DELETE CASCADE)',
      'invitation_id -> invitations.id (ON DELETE RESTRICT)',
    ],
  },
  {
    tableName: 'coupon_usages',
    titleFa: 'سوابق مصرف کدهای تخفیف',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'ردیابی دقیق استفاده هر کاربر از کدهای تخفیف برای جلوگیری از مصرف بیش از سقف مجاز.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه رکورد مصرف' },
      {
        name: 'coupon_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES coupons(id)',
        descriptionFa: 'کوپن مرتبط',
      },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر استفادهکننده',
      },
      {
        name: 'order_id',
        type: 'UUID',
        constraints: 'UNIQUE NOT NULL REFERENCES orders(id)',
        descriptionFa: 'سفارش مرتبط',
      },
      {
        name: 'discount_applied_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL',
        descriptionFa: 'مبلغ تخفیف اعمالشده',
      },
    ],
    indexes: ['UNIQUE(order_id)', 'idx_coupon_usages_user(coupon_id, user_id)'],
    foreignKeys: [
      'coupon_id -> coupons.id (ON DELETE RESTRICT)',
      'user_id -> users.id (ON DELETE RESTRICT)',
      'order_id -> orders.id (ON DELETE CASCADE)',
    ],
  },
  {
    tableName: 'payments',
    titleFa: 'تراکنشهای درگاه پرداخت',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE RESTRICT (غیرقابل حذف)',
    descriptionFa:
      'نگهداری اطلاعات تراکنش بانکی، شناسه Authority، کد رهگیری RefID و وضعیت تایید سمت سرور.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه تراکنش' },
      {
        name: 'order_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES orders(id)',
        descriptionFa: 'سفارش مرتبط',
      },
      {
        name: 'user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'کاربر پرداختکننده',
      },
      {
        name: 'gateway_provider',
        type: 'VARCHAR(30)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام درگاه (ZARINPAL, ZIBAL, MOCK_SANDBOX)',
      },
      {
        name: 'authority_token',
        type: 'VARCHAR(120)',
        constraints: 'UNIQUE NOT NULL',
        descriptionFa: 'توکن ارجاع درگاه',
      },
      {
        name: 'amount_toman',
        type: 'INTEGER',
        constraints: 'NOT NULL CHECK (amount_toman > 0)',
        descriptionFa: 'مبلغ تراکنش به تومان',
      },
      {
        name: 'amount_rial',
        type: 'BIGINT',
        constraints: 'NOT NULL CHECK (amount_rial = amount_toman * 10)',
        descriptionFa: 'مبلغ ارسالی به درگاه به ریال',
      },
      {
        name: 'status',
        type: 'VARCHAR(25)',
        constraints: "NOT NULL DEFAULT 'INITIATED'",
        descriptionFa: 'وضعیت (INITIATED, VERIFIED, FAILED)',
      },
      {
        name: 'reference_id',
        type: 'VARCHAR(100)',
        constraints: 'NULL',
        descriptionFa: 'کد رهگیری بانکی پس از تایید سرور',
      },
    ],
    indexes: [
      'UNIQUE(authority_token)',
      'idx_payments_order(order_id)',
      'idx_payments_ref(reference_id)',
    ],
    foreignKeys: [
      'order_id -> orders.id (ON DELETE RESTRICT)',
      'user_id -> users.id (ON DELETE RESTRICT)',
    ],
  },
  {
    tableName: 'payment_events',
    titleFa: 'لاگ رویدادها و Callbackهای درگاه',
    group: 'orders_payments',
    groupLabelFa: 'سفارشها، پرداخت و تخفیف',
    deletionPolicy: 'ON DELETE RESTRICT (تغییرناپذیر)',
    descriptionFa:
      'ثبت کامل تمام رویدادهای ارتباط با درگاه پرداخت جهت ممیزی امنیتی و کشف Callbackهای تکراری یا جعلی.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه رویداد' },
      {
        name: 'payment_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES payments(id)',
        descriptionFa: 'تراکنش مرتبط',
      },
      {
        name: 'event_type',
        type: 'VARCHAR(40)',
        constraints: 'NOT NULL',
        descriptionFa:
          'نوع رویداد (TOKEN_REQUESTED, CALLBACK_RECEIVED, VERIFY_SUCCESS, REPLAY_BLOCKED)',
      },
      {
        name: 'raw_payload_json',
        type: 'JSONB',
        constraints: 'NOT NULL',
        descriptionFa: 'جزئیات پاسخ درگاه',
      },
      {
        name: 'source_ip',
        type: 'VARCHAR(45)',
        constraints: 'NULL',
        descriptionFa: 'آدرس IP درخواستدهنده',
      },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان ثبت',
      },
    ],
    indexes: ['idx_payment_events_payment(payment_id, created_at)'],
    foreignKeys: ['payment_id -> payments.id (ON DELETE RESTRICT)'],
  },
  {
    tableName: 'admin_logs',
    titleFa: 'لاگ ممیزی عملیات مدیران (Audit Logs)',
    group: 'admin_system',
    groupLabelFa: 'مدیریت سیستم و ممیزی',
    deletionPolicy: 'ON DELETE RESTRICT (تغییرناپذیر)',
    descriptionFa:
      'ثبت دقیق تمامی تغییرات حساس انجامشده توسط مدیران شامل تغییر قیمت پایه، ویرایش قالب و مسدودسازی کاربر.',
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', descriptionFa: 'شناسه لاگ' },
      {
        name: 'actor_user_id',
        type: 'UUID',
        constraints: 'NOT NULL REFERENCES users(id)',
        descriptionFa: 'مدیر اقدامکننده',
      },
      {
        name: 'action',
        type: 'VARCHAR(80)',
        constraints: 'NOT NULL',
        descriptionFa: 'نام عملیات (PRICE_BASE_UPDATED, ...)',
      },
      {
        name: 'target_entity',
        type: 'VARCHAR(50)',
        constraints: 'NOT NULL',
        descriptionFa: 'جدول هدف',
      },
      {
        name: 'target_id',
        type: 'VARCHAR(80)',
        constraints: 'NOT NULL',
        descriptionFa: 'شناسه رکورد هدف',
      },
      {
        name: 'before_state_json',
        type: 'JSONB',
        constraints: 'NULL',
        descriptionFa: 'مقدار قبلی',
      },
      { name: 'after_state_json', type: 'JSONB', constraints: 'NULL', descriptionFa: 'مقدار جدید' },
      {
        name: 'created_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان ثبت',
      },
    ],
    indexes: [
      'idx_admin_logs_actor(actor_user_id, created_at)',
      'idx_admin_logs_target(target_entity, target_id)',
    ],
    foreignKeys: ['actor_user_id -> users.id (ON DELETE RESTRICT)'],
  },
  {
    tableName: 'system_settings',
    titleFa: 'تنظیمات کلان و قیمت پایه پلتفرم',
    group: 'admin_system',
    groupLabelFa: 'مدیریت سیستم و ممیزی',
    deletionPolicy: 'ON DELETE RESTRICT',
    descriptionFa:
      'نگهداری تنظیمات پویا از جمله قیمت پایه هر دعوتنامه (پیشفرض ۵۰٬۰۰۰ تومان) با قابلیت ویرایش از پنل مدیریت.',
    columns: [
      {
        name: 'key',
        type: 'VARCHAR(80)',
        constraints: 'PRIMARY KEY',
        descriptionFa: 'کلید تنظیم (base_invitation_price_toman)',
      },
      {
        name: 'value_json',
        type: 'JSONB',
        constraints: 'NOT NULL',
        descriptionFa: 'مقدار تنظیم بهصورت JSON',
      },
      {
        name: 'description_fa',
        type: 'VARCHAR(250)',
        constraints: 'NOT NULL',
        descriptionFa: 'توضیح فارسی تنظیم',
      },
      {
        name: 'updated_by',
        type: 'UUID',
        constraints: 'NULL REFERENCES users(id)',
        descriptionFa: 'آخرین مدیر ویرایشگر',
      },
      {
        name: 'updated_at',
        type: 'TIMESTAMPTZ',
        constraints: 'NOT NULL DEFAULT NOW()',
        descriptionFa: 'زمان آخرین ویرایش',
      },
    ],
    indexes: ['PRIMARY KEY(key)'],
    foreignKeys: ['updated_by -> users.id (ON DELETE SET NULL)'],
  },
];

export const API_ENDPOINTS_SPEC: ApiEndpointSpec[] = [
  {
    id: 'ep-health',
    module: 'system',
    moduleLabelFa: 'سلامت و زیرساخت',
    method: 'GET',
    path: '/api/v1/health',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی',
    rateLimit: '۱۲۰ درخواست در دقیقه',
    summaryFa: 'بررسی وضعیت اجرای سرور، اتصال دیتابیس PostgreSQL و درایور کش/صف.',
    securityNotesFa: 'هیچ اطلاعات حساسی از نسخه داخلی یا متغیرهای محیطی افشا نمیشود.',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "status": "ok", "db": "connected", "timezone": "Asia/Tehran" }\n}',
  },
  {
    id: 'ep-auth-register',
    module: 'auth',
    moduleLabelFa: 'احراز هویت و نشستها',
    method: 'POST',
    path: '/api/v1/auth/register',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی',
    rateLimit: '۵ درخواست در دقیقه (هر IP)',
    summaryFa: 'ثبتنام کاربر جدید با شماره موبایل ایران، نام کامل و رمز عبور استاندارد.',
    securityNotesFa:
      'رمز عبور با Bcrypt (Cost 12) هش میشود و نقش کاربر همواره در سرور روی USER تنظیم میگردد.',
    sampleRequest:
      '{\n  "fullName": "دیان یوسفی",\n  "phoneNumber": "09123456789",\n  "password": "StrongPassword!1405"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "user": { "id": "usr_uuid", "fullName": "دیان یوسفی", "role": "USER" } }\n}',
  },
  {
    id: 'ep-auth-login',
    module: 'auth',
    moduleLabelFa: 'احراز هویت و نشستها',
    method: 'POST',
    path: '/api/v1/auth/login',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی',
    rateLimit: '۵ درخواست در دقیقه + قفل موقت پس از ۵ خطا',
    summaryFa: 'ورود به حساب کاربری و دریافت Access Token + کوکی امن Refresh Token.',
    securityNotesFa: 'در صورت ۵ تلاش ناموفق متوالی، فیلد locked_until به مدت ۱۵ دقیقه فعال میشود.',
    sampleRequest: '{\n  "phoneNumber": "09123456789",\n  "password": "StrongPassword!1405"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "accessToken": "eyJhbG...", "expiresIn": 900 }\n}',
  },
  {
    id: 'ep-templates-list',
    module: 'templates',
    moduleLabelFa: 'کاتالوگ و موتور قالبها',
    method: 'GET',
    path: '/api/v1/templates',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی',
    rateLimit: '۶۰ درخواست در دقیقه',
    summaryFa:
      'دریافت فهرست قالبهای منتشرشده با فیلتر دستهبندی (عروسی، تولد، نامزدی...)، رایگان/پولی و محبوبترینها.',
    securityNotesFa: 'فقط قالبهای دارای وضعیت PUBLISHED و آخرین نسخه معتبر آنها بازگردانده میشوند.',
    sampleResponse:
      '{\n  "success": true,\n  "data": {\n    "basePriceToman": 50000,\n    "items": [{ "slug": "royal-gold-wedding", "nameFa": "ققنوس طلایی (عروسی)", "finalPriceToman": 50000 }]\n  }\n}',
  },
  {
    id: 'ep-invitations-slug-check',
    module: 'invitations',
    moduleLabelFa: 'ویرایشگر دعوتنامه',
    method: 'POST',
    path: '/api/v1/invitations/check-slug',
    accessLevel: 'USER',
    accessLabelFa: 'کاربر واردشده',
    rateLimit: '۳۰ درخواست در دقیقه',
    summaryFa:
      'بررسی بلادرنگ آزاد بودن و استاندارد بودن اسلاگ اختصاصی (/i/:slug) بههمراه پیشنهاد جایگزین.',
    securityNotesFa: 'کلمات رزروشده سیستمی (admin, api, login) و اسلاگهای تکراری مسدود میشوند.',
    sampleRequest: '{\n  "slug": "dayan123"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "isValid": true, "publicUrl": "https://example.ir/i/dayan123", "suggestions": [] }\n}',
  },
  {
    id: 'ep-invitations-create',
    module: 'invitations',
    moduleLabelFa: 'ویرایشگر دعوتنامه',
    method: 'POST',
    path: '/api/v1/invitations',
    accessLevel: 'USER',
    accessLabelFa: 'کاربر واردشده',
    rateLimit: '۱۵ درخواست در دقیقه',
    summaryFa: 'ایجاد پیشنویس (DRAFT) دعوتنامه جدید و قفل کردن نسخه فعلی قالب در اسنپشات دعوتنامه.',
    securityNotesFa: 'مالکیت دعوتنامه منحصراً به شناسه کاربر توکن احراز هویت متصل میشود.',
    sampleRequest:
      '{\n  "templateId": "tpl_royal_wedding",\n  "slug": "dayan123",\n  "eventTitle": "جشن پیوند سارا و علی",\n  "hostNames": "خانوادههای محمدی و رضایی",\n  "eventJalaliLabel": "پنجشنبه ۲۴ آبان ۱۴۰۵"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "invitationId": "inv_uuid", "status": "DRAFT", "slug": "dayan123" }\n}',
  },
  {
    id: 'ep-public-invitation-view',
    module: 'public_rsvp',
    moduleLabelFa: 'دعوتنامه عمومی و RSVP',
    method: 'GET',
    path: '/api/v1/public/invitations/:slug',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی (مهمانان)',
    rateLimit: '۶۰ درخواست در دقیقه',
    summaryFa: 'دریافت اطلاعات عمومی دعوتنامه فعال برای نمایش در مسیر /i/:slug و ثبت بازدید یکتا.',
    securityNotesFa:
      'فقط برای دعوتنامههای ACTIVE داده برمیگرداند. فهرست مهمانان یا شماره تماسهای خصوصی هرگز در این خروجی قرار نمیگیرد.',
    sampleResponse:
      '{\n  "success": true,\n  "data": {\n    "slug": "dayan123",\n    "eventTitle": "جشن پیوند سارا و علی",\n    "musicEnabled": true,\n    "autoplayAllowed": false,\n    "templateSnapshot": { "lockedVersionNumber": 1 }\n  }\n}',
  },
  {
    id: 'ep-public-rsvp-submit',
    module: 'public_rsvp',
    moduleLabelFa: 'دعوتنامه عمومی و RSVP',
    method: 'POST',
    path: '/api/v1/public/invitations/:slug/rsvp',
    accessLevel: 'PUBLIC',
    accessLabelFa: 'عمومی (مهمانان)',
    rateLimit: '۵ درخواست در ۱۰ دقیقه (ضد اسپم)',
    summaryFa: 'ثبت پاسخ حضور مهمان (حضور دارم / ندارم، تعداد همراهان و پیام تبریک برای میزبان).',
    securityNotesFa:
      'جلوگیری از ثبت پاسخ تکراری با هش شماره/نشست و بررسی سقف مجاز همراهان (max_companions_per_guest).',
    sampleRequest:
      '{\n  "respondentName": "امیرحسین کریمی",\n  "attendanceStatus": "ATTENDING",\n  "companionsCount": 2,\n  "guestMessage": "با آرزوی خوشبختی ابدی برای شما دو عزیز"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "rsvpId": "rsvp_uuid", "recordedStatus": "ATTENDING" }\n}',
  },
  {
    id: 'ep-orders-create',
    module: 'orders_payments',
    moduleLabelFa: 'پرداخت و سفارش',
    method: 'POST',
    path: '/api/v1/orders',
    accessLevel: 'USER',
    accessLabelFa: 'مالک دعوتنامه',
    rateLimit: '۱۰ درخواست در دقیقه',
    summaryFa:
      'ایجاد سفارش رسمی، محاسبه قیمت و تخفیف در سمت سرور و دریافت لینک هدایت به درگاه پرداخت ایرانی.',
    securityNotesFa:
      'مبلغ از سمت کلاینت دریافت نمیشود. کلید idempotencyKey از ثبت سفارش تکراری جلوگیری میکند.',
    sampleRequest:
      '{\n  "invitationId": "inv_uuid",\n  "couponCode": "BAHAR20",\n  "idempotencyKey": "idem_inv_uuid_1405"\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": {\n    "orderNumber": "INV-1405-89412",\n    "subtotalToman": 50000,\n    "discountToman": 10000,\n    "finalAmountToman": 40000,\n    "paymentRedirectUrl": "https://sandbox.zarinpal.com/pg/StartPay/A000000001"\n  }\n}',
  },
  {
    id: 'ep-payments-callback',
    module: 'orders_payments',
    moduleLabelFa: 'پرداخت و سفارش',
    method: 'POST',
    path: '/api/v1/payments/callback/:gateway',
    accessLevel: 'GATEWAY_CALLBACK',
    accessLabelFa: 'Callback درگاه بانکی',
    rateLimit: '۳۰ درخواست در دقیقه',
    summaryFa:
      'دریافت بازگشت از درگاه پرداخت، فراخوانی سرور-به-سرور VerifyPayment و فعالسازی دعوتنامه.',
    securityNotesFa:
      'صرف بازگشت کاربر با Status=OK باعث تایید نمیشود. قفل تراکنشی SELECT FOR UPDATE از پردازش مجدد Callback تکراری جلوگیری میکند.',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "orderStatus": "PAID", "invitationStatus": "ACTIVE", "referenceId": "1405998877" }\n}',
  },
  {
    id: 'ep-admin-pricing',
    module: 'admin',
    moduleLabelFa: 'پنل مدیریت (Admin)',
    method: 'PATCH',
    path: '/api/v1/admin/settings/pricing',
    accessLevel: 'ADMIN',
    accessLabelFa: 'فقط مدیر ارشد (ADMIN)',
    rateLimit: '۲۰ درخواست در دقیقه',
    summaryFa:
      'تغییر قیمت پایه دعوتنامه در کل پلتفرم بههمراه ثبت خودکار در جدول لاگ ممیزی (admin_logs).',
    securityNotesFa: 'نیازمند توکن معتبر با نقش ADMIN و مجوز pricing:manage.',
    sampleRequest: '{\n  "baseInvitationPriceToman": 50000\n}',
    sampleResponse:
      '{\n  "success": true,\n  "data": { "baseInvitationPriceToman": 50000, "auditLogId": "aud_uuid" }\n}',
  },
];

export const ADR_LIST_SPEC: AdrSpec[] = [
  {
    id: 'ADR-001',
    titleFa: 'انتخاب معماری Modular Monolith بهجای Microservices',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'پلتفرم نیازمند تراکنشهای مالی یکپارچه و هزینه نگهداری بهینه روی یک سرور VPS و همچنین اجرای روان در محیط پیشنمایش است.',
    decisionFa:
      'پیادهسازی معماری Modular Monolith با جداسازی کامل لایههای Controller، Service، Repository و Validation در هر ماژول.',
    consequencesFa: [
      'تضمین کامل تراکنشهای ACID بین سفارش، پرداخت، کد تخفیف و فعالسازی دعوتنامه.',
      'امکان استخراج آسان هر ماژول به سرویس مجزا در آینده بدون بازنویسی منطق دامنه.',
    ],
  },
  {
    id: 'ADR-002',
    titleFa: 'استفاده از Express + Vite + React 19 بهجای تحمیل Next.js',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'محیط اجرایی پروژه بر پایه استارتر Vite + React 19 + Express پیکربندی شده و نیازمند سرو همزمان API و صفحات عمومی با متادیتای سئو است.',
    decisionFa:
      'استفاده از سرور Express در server.ts برای ارائه REST API، تزریق داینامیک متادیتای OpenGraph برای مسیرهای /i/:slug و سرو فرانتاند React.',
    consequencesFa: [
      'سازگاری ۱۰۰٪ با محیط Google AI Studio و استقرار استاندارد Docker روی Ubuntu VPS.',
      'نمایش پیشنمایش دقیق عنوان و تصویر دعوتنامه هنگام ارسال لینک در تلگرام و واتساپ.',
    ],
  },
  {
    id: 'ADR-003',
    titleFa: 'موتور قالب Declarative JSON همراه با Versioning و Snapshot',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'ویرایش یک قالب توسط مدیر نباید دعوتنامههای قبلی کاربران را تغییر دهد و قالبها نباید اجازه اجرای کد جاوااسکریپت دلخواه بدهند.',
    decisionFa:
      'ذخیره نسخهبندیشده قالبها در جدول template_versions و کپی اسنپشات کامل ساختار قالب در فیلد template_snapshot_json دعوتنامه هنگام انتشار.',
    consequencesFa: [
      'مصونیت ۱۰۰٪ دعوتنامههای قبلی کاربران در برابر تغییرات بعدی قالب.',
      'حذف کامل آسیبپذیری XSS و اجرای کد دلخواه در موتور رندر قالبها.',
    ],
  },
  {
    id: 'ADR-004',
    titleFa: 'آدرسدهی مسیرمحور (/i/:slug) بهجای زیردامنه',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'هر دعوتنامه باید یک لینک اختصاصی کوتاه، خوانا و قابلاشتراکگذاری داشته باشد (مانند https://example.ir/i/dayan123).',
    decisionFa:
      'استفاده از مسیر اختصاصی /i/:slug با بررسی کلمات رزروشده و پیشنهاد خودکار اسلاگ جایگزین در صورت تکراری بودن.',
    consequencesFa: [
      'عدم نیاز به Wildcard DNS/SSL پیچیده و سازگاری فوری با هر دامنه و CDN.',
      'مدیریت کش بسیار سریع در Nginx برای مسیرهای /i/*.',
    ],
  },
  {
    id: 'ADR-005',
    titleFa: 'الگوی Adapter برای درگاههای پرداخت ایرانی و تایید سمت سرور',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'پلتفرم باید به درگاههای ایرانی (زرینپال، زیبال و...) متصل شود و در برابر جعل نتیجه پرداخت یا Callback تکراری مقاوم باشد.',
    decisionFa:
      'طراحی رابط IPaymentGatewayAdapter همراه با تایید سرور-به-سرور (Verify) درون تراکنش دیتابیس با قفل ردیف (SELECT FOR UPDATE).',
    consequencesFa: [
      'هیچ پرداختی صرفاً با بازگشت مرورگر کاربر به صفحه موفقیت تایید نمیشود.',
      'قابلیت تست کامل سناریوهای پرداخت موفق، ناموفق و تکراری با آداپتور Sandbox تا زمان دریافت کلید واقعی درگاه.',
    ],
  },
  {
    id: 'ADR-006',
    titleFa: 'آداپتور دوگانه برای Cache و صف پردازش پسزمینه (Redis / In-Memory)',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'در محیط Production VPS از Redis و BullMQ استفاده میشود، اما محیط پیشنمایش باید بدون وابستگی اجباری به سرویس خارجی نیز اجرا شود.',
    decisionFa:
      'طراحی لایه آداپتور کش و صف که بر اساس متغیر محیطی بین Redis/BullMQ و حافظه داخلی سوییچ میکند.',
    consequencesFa: [
      'اجرای بدون خطا در محیط توسعه و مقیاسپذیری بالا برای ۵۰۰ تا ۲۰۰۰ کاربر همزمان در محیط VPS.',
    ],
  },
  {
    id: 'ADR-007',
    titleFa: 'جداسازی سختگیرانه اطلاعات مهمانان (RSVP Privacy) از صفحه عمومی',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'لینک عمومی دعوتنامه در گروه‌های خانوادگی به اشتراک گذاشته میشود، اما لیست مهمانان و پیامهای آنها نباید برای سایر بازدیدکنندگان قابل رویت باشد.',
    decisionFa:
      'عدم بازگرداندن هرگونه اطلاعات مهمانان در API عمومی و الزام به احراز هویت مالک دعوتنامه برای مشاهده لیست RSVP.',
    consequencesFa: ['حفظ کامل حریم خصوصی میزبان و مهمانان مراسم.'],
  },
  {
    id: 'ADR-008',
    titleFa: 'استاندارد تقویم شمسی، منطقه زمانی تهران و واحد پولی تومان/ریال',
    status: 'Accepted',
    dateJalali: '۱۵ آبان ۱۴۰۵',
    contextFa:
      'محصول ویژه بازار ایران است و تمام قیمتها باید به تومان و تاریخها به شمسی نمایش داده شوند.',
    decisionFa:
      'ذخیره مبالغ در دیتابیس بهصورت عدد صحیح برحسب تومان (قیمت پایه ۵۰٬۰۰۰ تومان) و تبدیل خودکار ضربدر ۱۰ (ریال) در آداپتور درگاه بانکی.',
    consequencesFa: ['جلوگیری از خطای اعشار و اشتباه رایج بین تومان و ریال در تراکنشهای بانکی.'],
  },
];

export const ROADMAP_PHASES_SPEC: PhaseRoadmapSpec[] = [
  {
    phaseNumber: 0,
    code: 'Phase 0',
    titleEn: 'Discovery & Planning',
    titleFa: 'بررسی محیط، طراحی معماری، دیتابیس، API و مستندات پایه',
    status: 'COMPLETED',
    deliverablesFa: [
      'تحلیل امکانات و محدودیتهای محیط Google AI Studio و سرور Ubuntu 24.04 VPS',
      'طراحی کامل ۲۱ جدول دیتابیس PostgreSQL، کلیدهای خارجی، ایندکسها و ERD',
      'تعریف قراردادهای REST API و ثبت ۸ تصمیم معماری (ADR-001 تا ADR-008)',
      'پیادهسازی و تست واحد قوانین دامنه (اسلاگ، قیمتگذاری سمت سرور، اسنپشات قالب)',
      'ایجاد تمامی فایلهای مستندات الزامی داخل سورس پروژه',
    ],
    verificationGateFa:
      'اجرای موفق تستهای واحد node:test، بیلد TypeScript بدون خطا و تایید کارفرما.',
  },
  {
    phaseNumber: 1,
    code: 'Phase 1',
    titleEn: 'Project Foundation',
    titleFa: 'زیرساخت پروژه، سرور Express، ابزارهای کیفیت کد، Docker و Health Check',
    status: 'COMPLETED',
    deliverablesFa: [
      'ایجاد ساختار واقعی پوشههای Modular Monolith در src/server، src/features و infrastructure',
      'راهاندازی سرور ماژولار در server.ts با اتصال Vite Middleware روی پورت 3000',
      'پیکربندی ESLint 10، Prettier، TypeScript Strict، مدیریت متغیرهای محیطی، Logger ساختاریافته و Error Handler متمرکز',
      'پیادهسازی Endpointهای زنده (/api/v1/health و /api/v1/foundation/status) و فایلهای Dockerfile، docker-compose.yml و Nginx',
    ],
    verificationGateFa:
      'اجرای موفق ۱۰ تست واحد و یکپارچه (node:test)، عبور از ESLint/TypeScript و تست زنده Health Check.',
  },
  {
    phaseNumber: 2,
    code: 'Phase 2',
    titleEn: 'Database Foundation',
    titleFa: 'پیکربندی دیتابیس، اسکیما، مایگریشنها و دادههای اولیه (Seed)',
    status: 'NEXT_READY',
    deliverablesFa: [
      'پیادهسازی اسکیمای ۲۱ جدول، ایندکسها و قیدهای یکتایی',
      'اسکریپت Seed برای نقشها، مجوزها، قیمت پایه ۵۰٬۰۰۰ تومان و ۶ دستهبندی قالب',
    ],
    verificationGateFa: 'اجرای تست یکپارچگی دیتابیس، بررسی قیدهای کلید خارجی و تراکنشها.',
  },
  {
    phaseNumber: 3,
    code: 'Phase 3',
    titleEn: 'Authentication & RBAC',
    titleFa: 'ثبتنام، ورود، مدیریت نشستها و کنترل دسترسی نقشها',
    status: 'PLANNED',
    deliverablesFa: [
      'ثبتنام، ورود، خروج، بازیابی رمز عبور و مدیریت نشستهای فعال (user_sessions)',
      'محدودیت تلاش ورود (Rate Limit & Account Lockout) و میانافزار RBAC',
    ],
    verificationGateFa: 'تست کامل سناریوهای ثبتنام، ورود، توکن نامعتبر و مسدودسازی تلاش تکراری.',
  },
  {
    phaseNumber: 4,
    code: 'Phase 4',
    titleEn: 'Design System & Base UI',
    titleFa: 'سیستم طراحی فارسی (RTL)، کامپوننتهای پایه و صفحات معرفی',
    status: 'PLANNED',
    deliverablesFa: [
      'کامپوننتهای استاندارد فارسی (Button, Input, Modal, Toast, Skeleton, Empty/Error State)',
      'طراحی صفحه اصلی (Landing Page) و معرفی امکانات محصول با رویکرد Mobile-First',
    ],
    verificationGateFa:
      'بررسی ریسپانسیو در موبایل (390x844) و دسکتاپ (1440x900) و کنتراست استاندارد.',
  },
  {
    phaseNumber: 5,
    code: 'Phase 5',
    titleEn: 'Template Management',
    titleFa: 'سیستم مدیریت قالبها، ۶ دستهبندی و حداقل ۶ قالب حرفهای',
    status: 'PLANNED',
    deliverablesFa: [
      'کاتالوگ قالبها با جستجو، فیلتر دستهبندی، برچسب جدید/محبوب و رایگان/پولی',
      'آمادهسازی حداقل ۶ قالب حرفهای (عروسی، تولد، نامزدی، مهمانی، افتتاحیه، سایر)',
    ],
    verificationGateFa: 'تست فیلتر قالبها، نسخهبندی قالب و مشاهده جزئیات هر قالب.',
  },
  {
    phaseNumber: 6,
    code: 'Phase 6',
    titleEn: 'Template Engine',
    titleFa: 'موتور رندر مرکزی قالبها، نسخهبندی و Snapshot تغییرناپذیر',
    status: 'PLANNED',
    deliverablesFa: [
      'رندر امن قالبها از روی JSON Schema بدون امکان اجرای کد جاوااسکریپت دلخواه',
      'پشتیبانی از تایپوگرافی، رنگبندی، بخشهای پویا، موسیقی و انیمیشنهای قالب',
    ],
    verificationGateFa: 'تست عدم تغییر دعوتنامههای قبلی پس از انتشار نسخه جدید قالب.',
  },
  {
    phaseNumber: 7,
    code: 'Phase 7',
    titleEn: 'Invitation Builder',
    titleFa: 'ویرایشگر تعاملی دعوتنامه، پیشنمایش زنده و ذخیره پیشنویس',
    status: 'PLANNED',
    deliverablesFa: [
      'فرم گامبهگام موبایلفرندلی برای ویرایش میزبانها، تاریخ شمسی، ساعت، آدرس، نقشه و متن دعوت',
      'تنظیم موسیقی و انیمیشن، بررسی زنده اسلاگ (/i/:slug) و ذخیره پیشنویس',
    ],
    verificationGateFa: 'تست ساخت دعوتنامه، ویرایش فیلدها و ذخیره پیشنویس در حساب کاربر.',
  },
  {
    phaseNumber: 8,
    code: 'Phase 8',
    titleEn: 'Public Invitation Page',
    titleFa: 'صفحه عمومی دعوتنامه (/i/:slug)، اشتراکگذاری، موسیقی و سئو',
    status: 'PLANNED',
    deliverablesFa: [
      'صفحه عمومی فوقسریع برای مهمانان با پخش موسیقی پس از تعامل کاربر',
      'متادیتای OpenGraph برای اشتراکگذاری در شبکههای اجتماعی و دکمه مسیریابی',
    ],
    verificationGateFa:
      'تست بارگذاری لینک اختصاصی، عدم پخش اجباری صدا و بررسی متادیتای اشتراکگذاری.',
  },
  {
    phaseNumber: 9,
    code: 'Phase 9',
    titleEn: 'Order & Payment',
    titleFa: 'سفارش، قیمتگذاری سمت سرور، کد تخفیف و آداپتور درگاه پرداخت',
    status: 'PLANNED',
    deliverablesFa: [
      'محاسبه قیمت سمت سرور، اعمال کوپن، ایجاد سفارش و اتصال به آداپتور درگاه ایرانی/Sandbox',
      'بررسی Callback در سمت سرور، جلوگیری از پرداخت تکراری و فعالسازی دعوتنامه',
    ],
    verificationGateFa: 'تست پرداخت موفق، پرداخت ناموفق، Callback جعلی و Callback تکراری.',
  },
  {
    phaseNumber: 10,
    code: 'Phase 10',
    titleEn: 'Guest & RSVP',
    titleFa: 'ثبت پاسخ مهمانان، مدیریت لیست حضور و حفاظت از حریم خصوصی',
    status: 'PLANNED',
    deliverablesFa: [
      'فرم ثبت حضور مهمان (حضور دارم / ندارم، تعداد همراهان، پیام تبریک)',
      'پنل مدیریت پاسخها برای میزبان و جلوگیری از افشای لیست مهمانان در API عمومی',
    ],
    verificationGateFa: 'تست ثبت پاسخ مهمان، منع ثبت تکراری و بررسی عدم افشا در API عمومی.',
  },
  {
    phaseNumber: 11,
    code: 'Phase 11',
    titleEn: 'User Dashboard',
    titleFa: 'داشبورد جامع کاربر، مدیریت دعوتنامهها، سفارشها و آمار بازدید',
    status: 'PLANNED',
    deliverablesFa: [
      'نمایش دعوتنامههای فعال و پیشنویس، وضعیت پرداختها و آمار بازدید و پاسخ مهمانان',
    ],
    verificationGateFa: 'تست داشبورد کاربر و بررسی عدم دسترسی به دعوتنامه سایر کاربران (IDOR).',
  },
  {
    phaseNumber: 12,
    code: 'Phase 12',
    titleEn: 'Admin Panel',
    titleFa: 'پنل مدیریت مجزا (کاربران، قالبها، قیمت پایه، تخفیفها و لاگها)',
    status: 'PLANNED',
    deliverablesFa: [
      'مدیریت کاربران، قالبها، تغییر قیمت پایه ۵۰٬۰۰۰ تومان، کدهای تخفیف، سفارشها و Audit Logs',
    ],
    verificationGateFa: 'تست مسدود بودن دسترسی کاربر عادی به پنل مدیریت و ثبت لاگ تغییرات ادمین.',
  },
  {
    phaseNumber: 13,
    code: 'Phase 13',
    titleEn: 'Security & Optimization',
    titleFa: 'ممیزی امنیتی، بهینهسازی کوئریها، کش و بهینهسازی رسانهها',
    status: 'PLANNED',
    deliverablesFa: ['تکمیل لایههای امنیتی، کش صفحات عمومی و بهینهسازی حجم تصاویر و باندلها'],
    verificationGateFa: 'اجرای تستهای امنیتی (XSS, IDOR, Upload MIME, Rate Limit).',
  },
  {
    phaseNumber: 14,
    code: 'Phase 14',
    titleEn: 'QA & Final Testing',
    titleFa: 'تست جامع رگرسیون، تست بار (k6) و تست Backup/Restore',
    status: 'PLANNED',
    deliverablesFa: [
      'اجرای کامل سناریوهای حیاتی، اسکریپت تست بار ۵۰۰ تا ۲۰۰۰ کاربر همزمان و تست بازیابی بکاپ',
    ],
    verificationGateFa: 'گزارش واقعی نتایج تستها بدون سبز کاذب.',
  },
  {
    phaseNumber: 15,
    code: 'Phase 15',
    titleEn: 'Production Deployment',
    titleFa: 'آمادهسازی نهایی Docker Production، Nginx، SSL و مانیتورینگ VPS',
    status: 'PLANNED',
    deliverablesFa: [
      'فایلهای نهایی استقرار Ubuntu 24.04 VPS، پیکربندی SSL، بکاپ خودکار و مانیتورینگ',
    ],
    verificationGateFa: 'تکمیل چکلیست استقرار تجاری روی دامنه اختصاصی.',
  },
  {
    phaseNumber: 16,
    code: 'Phase 16',
    titleEn: 'Future Expansion',
    titleFa: 'توسعه آتی (چندزبانه، PWA، پیامک اطلاعرسانی و گزارشهای پیشرفته)',
    status: 'PLANNED',
    deliverablesFa: ['آمادهسازی هوکهای توسعه برای چندزبانه شدن، اپلیکیشن PWA و اتصال سرویس پیامک'],
    verificationGateFa: 'مستندسازی نقاط توسعه آتی.',
  },
];
