import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  LayoutTemplate,
  FolderTree,
  GitBranch,
  Image as ImageIcon,
  Music,
  Volume2,
  Type,
  Users,
  ShoppingBag,
  CreditCard,
  TicketPercent,
  UserCheck,
  Settings,
  ShieldAlert,
  Plus,
  CheckCircle2,
  Archive,
  Eye,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import {
  INITIAL_MASTER_TEMPLATES,
  type ValidatedTemplateSpec,
} from '../template-engine/template-schema';
import { TemplateSchemaRenderer } from '../template-engine/TemplateSchemaRenderer';

type AdminModuleId =
  | 'analytics'
  | 'templates'
  | 'categories'
  | 'versions'
  | 'assets'
  | 'music'
  | 'sfx'
  | 'fonts'
  | 'users'
  | 'orders'
  | 'subscriptions'
  | 'coupons'
  | 'guests'
  | 'settings';

const ADMIN_MODULES: Array<{
  id: AdminModuleId;
  number: number;
  titleFa: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'analytics',
    number: 1,
    titleFa: 'تحلیل و آمار کلان',
    titleEn: 'Dashboard Analytics',
    icon: BarChart3,
  },
  {
    id: 'templates',
    number: 2,
    titleFa: 'مدیریت قالب‌ها (بدون تغییر کد)',
    titleEn: 'Template Management',
    icon: LayoutTemplate,
  },
  {
    id: 'categories',
    number: 3,
    titleFa: 'دسته‌بندی قالب‌ها',
    titleEn: 'Template Categories',
    icon: FolderTree,
  },
  {
    id: 'versions',
    number: 4,
    titleFa: 'نسخه‌بندی قالب‌ها',
    titleEn: 'Template Versioning',
    icon: GitBranch,
  },
  {
    id: 'assets',
    number: 5,
    titleFa: 'مدیریت دارایی‌های گرافیکی',
    titleEn: 'Asset Management',
    icon: ImageIcon,
  },
  {
    id: 'music',
    number: 6,
    titleFa: 'مدیریت موسیقی متن',
    titleEn: 'Music Management',
    icon: Music,
  },
  {
    id: 'sfx',
    number: 7,
    titleFa: 'مدیریت افکت‌های صوتی',
    titleEn: 'Sound Effects',
    icon: Volume2,
  },
  { id: 'fonts', number: 8, titleFa: 'مدیریت فونت‌ها', titleEn: 'Font Management', icon: Type },
  {
    id: 'users',
    number: 9,
    titleFa: 'مدیریت کاربران و نقش‌ها',
    titleEn: 'User Management',
    icon: Users,
  },
  {
    id: 'orders',
    number: 10,
    titleFa: 'مدیریت سفارش‌ها و تراکنش',
    titleEn: 'Order Management',
    icon: ShoppingBag,
  },
  {
    id: 'subscriptions',
    number: 11,
    titleFa: 'مدیریت اشتراک‌های سازمانی',
    titleEn: 'Subscriptions',
    icon: CreditCard,
  },
  {
    id: 'coupons',
    number: 12,
    titleFa: 'مدیریت کدهای تخفیف',
    titleEn: 'Coupon Management',
    icon: TicketPercent,
  },
  {
    id: 'guests',
    number: 13,
    titleFa: 'آمار مهمانان و توکن‌های RSVP',
    titleEn: 'Guest Analytics',
    icon: UserCheck,
  },
  {
    id: 'settings',
    number: 14,
    titleFa: 'تنظیمات کلان پلتفرم و Audit Log',
    titleEn: 'Platform Settings',
    icon: Settings,
  },
];

interface AdminOverviewData {
  analytics: {
    totalRevenueToman: number;
    totalOrdersCount: number;
    publishedTemplatesCount: number;
    totalTemplatesCount: number;
    activeUsersCount: number;
    activeSubscriptionsCount: number;
    totalGuestsCount: number;
    totalRsvpResponsesCount: number;
    totalAttendingHeadcount: number;
  };
  users: Array<{
    id: number;
    email: string;
    displayName: string;
    mobileNumber: string;
    role: string;
    status: string;
  }>;
  categories: Array<{
    id: number;
    slug: string;
    nameFa: string;
    nameEn: string;
    sortOrder: number;
    isActive: boolean;
  }>;
  templates: Array<{
    id: number;
    slug: string;
    nameFa: string;
    nameEn: string;
    status: string;
    priceToman: number;
    currentVersion: number;
    envelopeStyle: string;
    schemaJson: Record<string, unknown>;
  }>;
  templateVersions: Array<{
    id: number;
    templateId: number;
    versionNumber: number;
    changelog: string;
    createdByEmail: string;
    createdAt: string;
  }>;
  mediaAssets: Array<{
    id: number;
    name: string;
    assetType: string;
    category: string;
    url: string;
    mimeType: string;
    durationSeconds: number;
  }>;
  guests: Array<{
    id: number;
    fullName: string;
    salutation: string;
    maxAllowedGuests: number;
    vipTier: string;
  }>;
  invitationTokens: Array<{
    id: number;
    guestId: number;
    token: string;
    status: string;
    openedCount: number;
  }>;
  rsvpResponses: Array<{
    id: number;
    respondentName: string;
    attendanceStatus: string;
    guestCount: number;
    dietaryNotes: string;
    messageToHosts: string;
  }>;
  orders: Array<{
    id: number;
    orderNumber: string;
    customerEmail: string;
    finalAmountToman: number;
    status: string;
    gatewayProvider: string;
    couponCode: string | null;
  }>;
  subscriptions: Array<{
    id: number;
    userEmail: string;
    planName: string;
    status: string;
    priceToman: number;
    maxEventsAllowed: number;
  }>;
  coupons: Array<{
    id: number;
    code: string;
    description: string;
    discountPercent: number;
    maxDiscountToman: number;
    usedCount: number;
    usageLimit: number;
    isActive: boolean;
  }>;
  settings: Array<{
    id: number;
    settingKey: string;
    settingValueJson: Record<string, unknown>;
    description: string;
    updatedByEmail: string;
  }>;
  auditLogs: Array<{
    id: number;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

export const InviteAdminDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AdminModuleId>('analytics');
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatedRole, setSimulatedRole] = useState<'super_admin' | 'admin' | 'viewer'>(
    'super_admin'
  );
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Template Management Form State (Create/Preview without code modification)
  const [newTplNameFa, setNewTplNameFa] = useState<string>('');
  const [newTplNameEn, setNewTplNameEn] = useState<string>('');
  const [newTplPrice, setNewTplPrice] = useState<number>(65000);
  const [previewTemplateSchema, setPreviewTemplateSchema] = useState<ValidatedTemplateSpec | null>(
    null
  );
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string>('all');

  // Category Form State
  const [newCatNameFa, setNewCatNameFa] = useState<string>('');
  const [newCatSlug, setNewCatSlug] = useState<string>('');

  // Media Asset Form State
  const [newAssetName, setNewAssetName] = useState<string>('');
  const [newAssetUrl, setNewAssetUrl] = useState<string>('');

  // Coupon Form State
  const [newCouponCode, setNewCouponCode] = useState<string>('');
  const [newCouponPercent, setNewCouponPercent] = useState<number>(25);

  // Guest Token Creation State
  const [newGuestName, setNewGuestName] = useState<string>('');
  const [newGuestMax, setNewGuestMax] = useState<number>(2);

  // Platform Price Setting State
  const [basePriceInput, setBasePriceInput] = useState<number>(50000);

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    setRbacError(null);
    try {
      const res = await fetch('/api/v1/invite/admin/overview', {
        headers: {
          'x-invite-admin-role': simulatedRole,
          'x-invite-admin-email': 'admin@invite-luxury.ir',
        },
      });
      if (res.status === 403) {
        setRbacError(
          'خطای ۴۰۳ سمت سرور (RBAC Denied): نقش انتخاب‌شده مجوز دسترسی به عملیات مدیریتی را ندارد.'
        );
        setLoading(false);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setOverview(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, [simulatedRole]);

  useEffect(() => {
    void loadAdminOverview();
  }, [loadAdminOverview]);

  const executeAdminAction = async (actionType: string, payload: Record<string, unknown>) => {
    setRbacError(null);
    try {
      const res = await fetch('/api/v1/invite/admin/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-invite-admin-role': simulatedRole,
          'x-invite-admin-email': 'admin@invite-luxury.ir',
        },
        body: JSON.stringify({ actionType, payload }),
      });

      if (res.status === 403) {
        setRbacError('عملیات توسط سرور مسدود شد (403 Forbidden — Server-Side RBAC Guard).');
        return;
      }

      if (res.ok) {
        const json = await res.json();
        if (json.data?.overview) {
          setOverview(json.data.overview);
        }
        setActionToast(`عملیات ${actionType} در PostgreSQL و جدول Audit Log ثبت شد.`);
        window.setTimeout(() => setActionToast(null), 4000);
      }
    } catch {
      setRbacError('خطا در ارتباط با سرور مدیریت.');
    }
  };

  const filteredTemplates = (overview?.templates ?? []).filter((t) =>
    templateStatusFilter === 'all' ? true : t.status === templateStatusFilter
  );

  return (
    <section
      dir="rtl"
      className="rounded-2xl border border-[#C5A059]/35 bg-[#1C1B1A] text-[#FAF7F2] shadow-2xl overflow-hidden"
    >
      {/* TOP ADMIN HEADER WITH RBAC ROLE SWITCHER & AUDIT LOG COUNTER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C5A059]/25 bg-[#141312] px-6 py-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-[#C5A059] px-2.5 py-1 text-xs font-extrabold text-[#1C1B1A]">
              INVITÉ ADMIN
            </span>
            <h2 className="text-lg font-bold text-[#FAF7F2]">
              پنل مدیریت جامع ۱۴ ماژوله و مرکز ممیزی امنیتی (RBAC & Audit Center)
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#EAE3D5]/70">
            مدیریت چرخه حیات قالب‌ها (ایجاد، پیش‌نمایش، انتشار، توقف انتشار و آرشیو بدون دستکاری
            کد)، دارایی‌های صوتی، فونت‌ها، سفارش‌ها و کنترل دسترسی مبتنی بر نقش (RBAC)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-xs">
            <span className="text-[#EAE3D5]/70">نقش امنیتی فعلی (RBAC):</span>
            <select
              aria-label="انتخاب نقش امنیتی ادمین"
              value={simulatedRole}
              onChange={(e) =>
                setSimulatedRole(e.target.value as 'super_admin' | 'admin' | 'viewer')
              }
              className="rounded bg-[#C5A059]/20 px-2 py-1 font-bold text-[#C5A059]"
            >
              <option value="super_admin">Super Admin (دسترسی کامل)</option>
              <option value="admin">Admin (مدیر محتوا و قالب)</option>
              <option value="viewer">Viewer (تست رد دسترسی ۴۰۳ سمت سرور)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => void loadAdminOverview()}
            className="flex items-center gap-1.5 rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/15 px-3.5 py-2 text-xs font-bold text-[#C5A059] hover:bg-[#C5A059]/25"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {/* RBAC Error or Action Toast */}
      {rbacError && (
        <div className="flex items-center justify-between bg-rose-950/90 border-b border-rose-500/40 px-6 py-3 text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            <span className="font-bold">{rbacError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSimulatedRole('super_admin')}
            className="rounded-lg bg-rose-500 px-3 py-1 font-bold text-white"
          >
            بازگشت به نقش Super Admin
          </button>
        </div>
      )}

      {actionToast && (
        <div className="flex items-center gap-2 bg-emerald-950/90 border-b border-emerald-500/40 px-6 py-2.5 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="font-bold">{actionToast}</span>
        </div>
      )}

      {/* MAIN BODY: 14 MODULE NAVIGATION SIDEBAR + ACTIVE MODULE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* Sidebar listing all 14 modules */}
        <aside className="lg:col-span-3 border-b lg:border-b-0 lg:border-l border-white/10 bg-[#161514] p-3 space-y-1">
          {ADMIN_MODULES.map((mod) => {
            const IconComp = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-right text-xs transition ${
                  isActive
                    ? 'bg-[#C5A059] text-[#1C1B1A] font-extrabold shadow-md'
                    : 'text-[#EAE3D5]/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <IconComp className="h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {mod.number}. {mod.titleFa}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono ${
                    isActive ? 'text-[#1C1B1A]/80' : 'text-[#C5A059]/70'
                  }`}
                >
                  {mod.titleEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Active Module Content Area */}
        <div className="lg:col-span-9 p-6 bg-[#1C1B1A] space-y-6">
          {/* MODULE 1: DASHBOARD ANALYTICS */}
          {activeModule === 'analytics' && overview && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-[#C5A059]">
                  ۱. داشبورد تحلیل و آمار زنده پلتفرم (Real PostgreSQL Aggregations)
                </h3>
                <p className="text-xs text-[#EAE3D5]/65">
                  تمامی شاخص‌ها مستقیماً از جداول orders، templates، users، rsvp_responses و
                  audit_logs استخراج می‌شوند.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#C5A059]/30 bg-black/30 p-4">
                  <span className="text-xs text-[#EAE3D5]/70">مجموع درآمد سفارش‌های موفق</span>
                  <p className="mt-2 text-2xl font-extrabold text-[#C5A059]">
                    {overview.analytics.totalRevenueToman.toLocaleString('fa-IR')} تومان
                  </p>
                  <span className="text-[11px] text-emerald-400">
                    از {overview.analytics.totalOrdersCount} سفارش ثبت‌شده
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="text-xs text-[#EAE3D5]/70">قالب‌های فعال و منتشرشده</span>
                  <p className="mt-2 text-2xl font-extrabold text-[#FAF7F2]">
                    {overview.analytics.publishedTemplatesCount} از{' '}
                    {overview.analytics.totalTemplatesCount}
                  </p>
                  <span className="text-[11px] text-[#C5A059]">موتور اسکیمای Zod فعال</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="text-xs text-[#EAE3D5]/70">مهمانان تاییدشده (RSVP)</span>
                  <p className="mt-2 text-2xl font-extrabold text-emerald-400">
                    {overview.analytics.totalAttendingHeadcount} نفر
                  </p>
                  <span className="text-[11px] text-[#EAE3D5]/60">
                    از {overview.analytics.totalRsvpResponsesCount} پاسخ ثبت‌شده
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="text-xs text-[#EAE3D5]/70">کاربران و اشتراک‌های فعال</span>
                  <p className="mt-2 text-2xl font-extrabold text-[#FAF7F2]">
                    {overview.analytics.activeUsersCount} کاربر
                  </p>
                  <span className="text-[11px] text-[#C5A059]">
                    {overview.analytics.activeSubscriptionsCount} اشتراک سازمانی فعال
                  </span>
                </div>
              </div>

              {/* Recent Audit Logs Snapshot */}
              <div className="rounded-xl border border-white/10 bg-black/25 p-4">
                <h4 className="text-xs font-bold text-[#C5A059] mb-3">
                  آخرین رویدادهای ثبت‌شده در جدول ممیزی امنیتی (audit_logs):
                </h4>
                <div className="space-y-2">
                  {overview.auditLogs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-mono text-[11px] text-[#C5A059]">
                          {log.action}
                        </span>
                        <span className="text-[#FAF7F2] font-medium">{log.actorEmail}</span>
                        <span className="text-[#EAE3D5]/50">({log.actorRole})</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#EAE3D5]/60">
                        Target: {log.targetType}:{log.targetId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODULE 2: TEMPLATE MANAGEMENT (CREATE, PREVIEW, PUBLISH, UNPUBLISH, ARCHIVE) */}
          {activeModule === 'templates' && overview && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#C5A059]">
                    ۲. مدیریت چرخه حیات قالب‌ها (بدون نیاز به تغییر کد منبع)
                  </h3>
                  <p className="text-xs text-[#EAE3D5]/65">
                    ایجاد، پیش‌نمایش زنده، انتشار (Publish)، توقف انتشار (Unpublish) و آرشیو قالب‌ها
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {['all', 'published', 'unpublished', 'archived'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTemplateStatusFilter(st)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        templateStatusFilter === st
                          ? 'bg-[#C5A059] text-[#1C1B1A]'
                          : 'bg-white/5 text-[#EAE3D5]/70'
                      }`}
                    >
                      {st === 'all'
                        ? 'همه قالب‌ها'
                        : st === 'published'
                          ? 'منتشرشده'
                          : st === 'unpublished'
                            ? 'متوقف‌شده'
                            : 'آرشیوشده'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create New Dynamic Template Form */}
              <div className="rounded-xl border border-[#C5A059]/30 bg-black/30 p-4">
                <h4 className="text-xs font-bold text-[#C5A059] mb-3">
                  + افزودن قالب جدید به مارکت‌پلیس (ذخیره اسکیمای JSON در PostgreSQL):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={newTplNameFa}
                    onChange={(e) => setNewTplNameFa(e.target.value)}
                    placeholder="نام فارسی قالب (مثلاً عروسی قصر زرین)"
                    className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newTplNameEn}
                    onChange={(e) => setNewTplNameEn(e.target.value)}
                    placeholder="English Title (e.g. Golden Palace)"
                    className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    value={newTplPrice}
                    onChange={(e) => setNewTplPrice(Number(e.target.value))}
                    placeholder="قیمت (تومان)"
                    className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newTplNameFa.trim()) return;
                      void executeAdminAction('CREATE_OR_UPDATE_TEMPLATE', {
                        nameFa: newTplNameFa,
                        nameEn: newTplNameEn || 'Royal Custom Template',
                        priceToman: newTplPrice,
                        status: 'PUBLISHED',
                      });
                      setNewTplNameFa('');
                      setNewTplNameEn('');
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                  >
                    <Plus className="h-4 w-4" />
                    <span>ایجاد و انتشار قالب</span>
                  </button>
                </div>
              </div>

              {/* Templates Table */}
              <div className="space-y-2.5">
                {filteredTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#FAF7F2]">{tpl.nameFa}</span>
                        <span className="text-xs text-[#EAE3D5]/60">({tpl.nameEn})</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            tpl.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : tpl.status === 'unpublished'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {tpl.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#EAE3D5]/65">
                        اسلاگ: <span className="font-mono text-[#C5A059]">{tpl.slug}</span> • قیمت:{' '}
                        <strong>{tpl.priceToman.toLocaleString('fa-IR')} تومان</strong> • نسخه: v
                        {tpl.currentVersion}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const found =
                            INITIAL_MASTER_TEMPLATES.find((m) => m.slug === tpl.slug) ??
                            INITIAL_MASTER_TEMPLATES[0];
                          setPreviewTemplateSchema(found);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:border-[#C5A059]"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#C5A059]" />
                        <span>پیش‌نمایش زنده</span>
                      </button>

                      {tpl.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            void executeAdminAction('UPDATE_TEMPLATE_STATUS', {
                              templateId: tpl.id,
                              status: 'PUBLISHED',
                            })
                          }
                          className="rounded-lg bg-emerald-600/25 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300"
                        >
                          انتشار (Publish)
                        </button>
                      )}

                      {tpl.status === 'published' && (
                        <button
                          type="button"
                          onClick={() =>
                            void executeAdminAction('UPDATE_TEMPLATE_STATUS', {
                              templateId: tpl.id,
                              status: 'UNPUBLISHED',
                            })
                          }
                          className="rounded-lg bg-amber-600/25 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300"
                        >
                          توقف انتشار (Unpublish)
                        </button>
                      )}

                      {tpl.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() =>
                            void executeAdminAction('UPDATE_TEMPLATE_STATUS', {
                              templateId: tpl.id,
                              status: 'ARCHIVED',
                            })
                          }
                          className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/40 px-3 py-1.5 text-xs font-bold text-rose-300"
                        >
                          <Archive className="h-3.5 w-3.5" />
                          <span>آرشیو</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Schema Preview Drawer inside Admin */}
              {previewTemplateSchema && (
                <div className="rounded-2xl border border-[#C5A059] bg-black/50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-[#C5A059]">
                      پیش‌نمایش زنده موتور رندر قالب: {previewTemplateSchema.localizedMeta.fa.title}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplateSchema(null)}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs"
                    >
                      بستن پیش‌نمایش ×
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <TemplateSchemaRenderer
                      template={previewTemplateSchema}
                      locale="fa"
                      scale={0.55}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODULE 3: TEMPLATE CATEGORIES */}
          {activeModule === 'categories' && overview && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۳. مدیریت دسته‌بندی قالب‌ها (template_categories)
              </h3>
              <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="text"
                  value={newCatNameFa}
                  onChange={(e) => setNewCatNameFa(e.target.value)}
                  placeholder="نام دسته‌بندی (مثلاً جشن عقد و نامزدی)"
                  className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  placeholder="Slug (e.g. engagement-gala)"
                  className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCatNameFa.trim()) return;
                    void executeAdminAction('CREATE_CATEGORY', {
                      nameFa: newCatNameFa,
                      nameEn: newCatSlug || 'Engagement Gala',
                      slug: newCatSlug || `cat-${Date.now()}`,
                    });
                    setNewCatNameFa('');
                    setNewCatSlug('');
                  }}
                  className="rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                >
                  + ثبت دسته‌بندی
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overview.categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-xl border border-white/10 bg-black/25 p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#FAF7F2]">{cat.nameFa}</p>
                      <p className="text-xs text-[#C5A059] font-mono">
                        {cat.nameEn} • /{cat.slug}
                      </p>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-300">
                      فعال
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 4: TEMPLATE VERSIONING */}
          {activeModule === 'versions' && overview && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۴. تاریخچه نسخه‌بندی قالب‌ها (template_versions)
              </h3>
              <div className="space-y-2.5">
                {overview.templateVersions.map((ver) => (
                  <div
                    key={ver.id}
                    className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4 text-xs"
                  >
                    <div>
                      <span className="rounded bg-[#C5A059]/20 px-2 py-0.5 font-mono font-bold text-[#C5A059] ml-2">
                        Template #{ver.templateId} — v{ver.versionNumber}.0
                      </span>
                      <span className="font-semibold text-[#FAF7F2]">{ver.changelog}</span>
                    </div>
                    <span className="text-[#EAE3D5]/60 font-mono">{ver.createdByEmail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULES 5, 6, 7, 8: ASSETS, MUSIC, SFX, FONTS */}
          {(activeModule === 'assets' ||
            activeModule === 'music' ||
            activeModule === 'sfx' ||
            activeModule === 'fonts') &&
            overview && (
              <div className="space-y-5">
                <h3 className="text-base font-bold text-[#C5A059]">
                  {activeModule === 'assets' && '۵. مدیریت دارایی‌های گرافیکی و تذهیب'}
                  {activeModule === 'music' && '۶. مدیریت کتابخانه موسیقی متن دعوت‌نامه'}
                  {activeModule === 'sfx' && '۷. مدیریت افکت‌های صوتی پاکت و موم (SFX)'}
                  {activeModule === 'fonts' && '۸. مدیریت فونت‌های فارسی، عربی و لاتین'}
                </h3>

                <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                  <input
                    type="text"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    placeholder="عنوان دارایی، قطعه موسیقی یا فونت جدید..."
                    className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={newAssetUrl}
                    onChange={(e) => setNewAssetUrl(e.target.value)}
                    placeholder="آدرس فایل یا شناسه سنتز (URL / URI)"
                    className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAssetName.trim()) return;
                      const typeMap: Record<string, string> = {
                        assets: 'ASSET',
                        music: 'MUSIC',
                        sfx: 'SFX',
                        fonts: 'FONT',
                      };
                      void executeAdminAction('CREATE_MEDIA_ASSET', {
                        name: newAssetName,
                        assetType: typeMap[activeModule] || 'MUSIC',
                        url: newAssetUrl || 'synth://persian-santoor-serenade',
                      });
                      setNewAssetName('');
                      setNewAssetUrl('');
                    }}
                    className="rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                  >
                    + آپلود و ثبت در دیتابیس
                  </button>
                </div>

                <div className="space-y-2">
                  {overview.mediaAssets
                    .filter((a) => {
                      if (activeModule === 'music') return a.assetType === 'music';
                      if (activeModule === 'sfx') return a.assetType === 'sfx';
                      if (activeModule === 'fonts') return a.assetType === 'font';
                      return true;
                    })
                    .map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 p-3.5 text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#FAF7F2]">{asset.name}</p>
                          <p className="text-[11px] font-mono text-[#C5A059]">{asset.url}</p>
                        </div>
                        <span className="rounded bg-white/10 px-2.5 py-1 font-mono text-[11px] uppercase">
                          {asset.assetType}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {/* MODULE 9: USER MANAGEMENT */}
          {activeModule === 'users' && overview && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۹. مدیریت کاربران و سطوح دسترسی (RBAC Users)
              </h3>
              <div className="space-y-2.5">
                {overview.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#FAF7F2]">{u.displayName}</p>
                      <p className="text-[#EAE3D5]/65 font-mono">
                        {u.email} • {u.mobileNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#C5A059]/20 px-2.5 py-1 font-mono font-bold text-[#C5A059]">
                        {u.role}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void executeAdminAction('UPDATE_USER_ROLE', {
                            userId: u.id,
                            role: u.role === 'super_admin' ? 'ADMIN' : 'SUPER_ADMIN',
                          })
                        }
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:border-[#C5A059]"
                      >
                        ارتقا / تغییر نقش
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 10: ORDER MANAGEMENT */}
          {activeModule === 'orders' && overview && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۱۰. مدیریت سفارش‌ها و تراکنش‌های درگاه پرداخت (orders)
              </h3>
              <div className="space-y-2.5">
                {overview.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#FAF7F2]">
                        شماره سفارش:{' '}
                        <span className="font-mono text-[#C5A059]">{ord.orderNumber}</span>
                      </p>
                      <p className="text-[#EAE3D5]/70">
                        خریدار: {ord.customerEmail} • درگاه: {ord.gatewayProvider}
                        {ord.couponCode ? ` • کوپن: ${ord.couponCode}` : ''}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-400">
                        {ord.finalAmountToman.toLocaleString('fa-IR')} تومان
                      </p>
                      <span className="text-[10px] uppercase text-[#EAE3D5]/60">{ord.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 11: SUBSCRIPTION MANAGEMENT */}
          {activeModule === 'subscriptions' && overview && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۱۱. مدیریت اشتراک‌های میزبانان و تشریفات (subscriptions)
              </h3>
              <div className="space-y-2.5">
                {overview.subscriptions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/25 p-4 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#FAF7F2]">{sub.planName}</p>
                      <p className="text-[#EAE3D5]/70">
                        کاربر: {sub.userEmail} • سقف مراسم مجاز: {sub.maxEventsAllowed} مراسم
                      </p>
                    </div>
                    <span className="rounded bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300">
                      {sub.priceToman.toLocaleString('fa-IR')} تومان ({sub.status})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 12: COUPON MANAGEMENT */}
          {activeModule === 'coupons' && overview && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۱۲. مدیریت کدهای تخفیف و کمپین‌های فروش (coupons)
              </h3>
              <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="کد تخفیف جدید (مثلاً NOROOZ30)"
                  className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white uppercase"
                />
                <input
                  type="number"
                  min={5}
                  max={90}
                  value={newCouponPercent}
                  onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                  placeholder="درصد تخفیف"
                  className="rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCouponCode.trim()) return;
                    void executeAdminAction('CREATE_COUPON', {
                      code: newCouponCode,
                      discountPercent: newCouponPercent,
                    });
                    setNewCouponCode('');
                  }}
                  className="rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                >
                  + ایجاد کد تخفیف
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overview.coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className="rounded-xl border border-[#C5A059]/30 bg-black/25 p-4 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-[#C5A059]">{cp.code}</p>
                      <p className="text-[#EAE3D5]/75 mt-0.5">{cp.description}</p>
                    </div>
                    <div className="text-left">
                      <span className="rounded bg-emerald-500/20 px-2.5 py-1 font-bold text-emerald-300">
                        {cp.discountPercent}% تخفیف
                      </span>
                      <p className="mt-1 text-[10px] text-[#EAE3D5]/60">
                        استفاده: {cp.usedCount} / {cp.usageLimit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODULE 13: GUEST ANALYTICS & INVITATION TOKENS */}
          {activeModule === 'guests' && overview && (
            <div className="space-y-5">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۱۳. مدیریت مهمانان، صدور توکن یکتا و تحلیل پاسخ‌های RSVP
              </h3>
              <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="text"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  placeholder="نام کامل مهمان ویژه (مثلاً جناب آقای دکتر فرهاد مستوفی)"
                  className="flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newGuestMax}
                  onChange={(e) => setNewGuestMax(Number(e.target.value))}
                  className="w-28 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newGuestName.trim()) return;
                    void executeAdminAction('CREATE_GUEST_AND_TOKEN', {
                      fullName: newGuestName,
                      maxAllowedGuests: newGuestMax,
                    });
                    setNewGuestName('');
                  }}
                  className="rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                >
                  + صدور توکن اختصاصی مهمان
                </button>
              </div>

              <div className="space-y-2">
                {overview.guests.map((g) => {
                  const tok = overview.invitationTokens.find((t) => t.guestId === g.id);
                  return (
                    <div
                      key={g.id}
                      className="flex flex-wrap items-center justify-between rounded-xl border border-white/10 bg-black/25 p-3.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-[#FAF7F2]">{g.fullName}</p>
                        <p className="text-[#EAE3D5]/65">
                          سقف مجاز: {g.maxAllowedGuests} نفر • سطح: {g.vipTier}
                        </p>
                      </div>
                      {tok && (
                        <div className="text-left font-mono">
                          <span className="rounded bg-[#C5A059]/20 px-2.5 py-1 text-[#C5A059]">
                            ?token={tok.token}
                          </span>
                          <span className="mr-2 text-[11px] text-[#EAE3D5]/60">
                            ({tok.openedCount} بازدید)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* MODULE 14: PLATFORM SETTINGS & FULL AUDIT LOG */}
          {activeModule === 'settings' && overview && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-[#C5A059]">
                ۱۴. تنظیمات کلان پلتفرم و لاگ ممیزی کامل (platform_settings & audit_logs)
              </h3>

              <div className="rounded-xl border border-[#C5A059]/30 bg-black/30 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs">
                  <p className="font-bold text-[#FAF7F2]">
                    قیمت پایه دعوت‌نامه دیجیتال در سراسر پلتفرم (تومان):
                  </p>
                  <p className="text-[#EAE3D5]/65">
                    تغییر این مقدار بلافاصله در جدول platform_settings و لاگ ممیزی ثبت می‌گردد.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={basePriceInput}
                    onChange={(e) => setBasePriceInput(Number(e.target.value))}
                    className="w-36 rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void executeAdminAction('UPDATE_PLATFORM_SETTING', {
                        settingKey: 'base_invitation_price_toman',
                        settingValueJson: {
                          value: basePriceInput,
                          currency: 'TOMAN',
                          usdEquivalent: 29,
                        },
                      })
                    }
                    className="flex items-center gap-1.5 rounded-lg bg-[#C5A059] px-4 py-2 text-xs font-bold text-[#1C1B1A]"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    <span>ذخیره قیمت پایه</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {overview.settings.map((st) => (
                  <div
                    key={st.id}
                    className="rounded-xl border border-white/10 bg-black/25 p-3.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-mono font-bold text-[#C5A059]">{st.settingKey}</p>
                      <p className="text-[#EAE3D5]/70">{st.description}</p>
                    </div>
                    <code className="rounded bg-black/50 px-2.5 py-1 text-[11px] text-emerald-300">
                      {JSON.stringify(st.settingValueJson)}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
