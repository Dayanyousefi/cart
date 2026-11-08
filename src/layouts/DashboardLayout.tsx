import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  Palette,
  Users,
  Receipt,
  Settings,
  ShieldCheck,
  Menu,
  X,
  ChevronLeft,
  ExternalLink,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import {
  type UserRoleCode,
  type DataViewState,
  resolveDashboardNavItems,
  formatToman,
  toPersianDigits,
  buildPublicInvitationUrl,
} from './rtl-utils';

export interface DashboardLayoutProps {
  /** Currently active sidebar navigation item ID */
  activeSectionId?: string;
  /** Callback when user selects a sidebar navigation item */
  onSelectSection?: (sectionId: string) => void;
  /** Current user role for RBAC-aware navigation */
  userRole?: UserRoleCode;
  /** Callback when user toggles role in preview mode */
  onChangeRole?: (role: UserRoleCode) => void;
  /** Authenticated user's full name */
  userName?: string;
  /** Authenticated user's Iranian mobile number */
  userPhone?: string;
  /** Optional custom page title override */
  pageTitle?: string;
  /** Optional custom page subtitle override */
  pageSubtitle?: string;
  /** Data state (Populated, Loading Skeleton, Empty State, Error State) per DESIGN-SYSTEM.md */
  viewState?: DataViewState;
  /** Callback to switch data view state */
  onChangeViewState?: (state: DataViewState) => void;
  /** Callback to open the PublicInvitationLayout preview for a given slug */
  onOpenPublicInvitation?: (slug: string) => void;
  /** Optional custom main content children; if omitted, renders section-aware workspace content */
  children?: React.ReactNode;
}

interface InvitationSummaryItem {
  id: string;
  titleFa: string;
  categoryFa: string;
  templateNameFa: string;
  slug: string;
  eventDateJalali: string;
  status: 'PUBLISHED' | 'DRAFT_UNPAID';
  viewsCount: number;
  rsvpConfirmedCount: number;
  rsvpDeclinedCount: number;
  pricePaidToman: number;
}

const SAMPLE_HOST_INVITATIONS: InvitationSummaryItem[] = [
  {
    id: 'inv_01',
    titleFa: 'جشن پیوند دیان و سارا',
    categoryFa: 'عروسی و عقد',
    templateNameFa: 'عمارت طلایی نیاوران (v2)',
    slug: 'dayan123',
    eventDateJalali: 'پنجشنبه ۲۵ آبان ۱۴۰۵ — ساعت ۱۹:۳۰',
    status: 'PUBLISHED',
    viewsCount: 342,
    rsvpConfirmedCount: 48,
    rsvpDeclinedCount: 5,
    pricePaidToman: 50000,
  },
  {
    id: 'inv_02',
    titleFa: 'جشن تولد ۳۰ سالگی آرمان',
    categoryFa: 'جشن تولد',
    templateNameFa: 'شب‌های فیروزه‌ای شیراز (v1)',
    slug: 'arman-30',
    eventDateJalali: 'جمعه ۹ آذر ۱۴۰۵ — ساعت ۲۰:۰۰',
    status: 'DRAFT_UNPAID',
    viewsCount: 0,
    rsvpConfirmedCount: 0,
    rsvpDeclinedCount: 0,
    pricePaidToman: 50000,
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeSectionId: controlledSectionId,
  onSelectSection,
  userRole: controlledRole,
  onChangeRole,
  userName = 'دیان یوسفی',
  userPhone = '09123456789',
  pageTitle,
  pageSubtitle,
  viewState: controlledViewState,
  onChangeViewState,
  onOpenPublicInvitation,
  children,
}) => {
  const [internalSectionId, setInternalSectionId] = useState<string>('overview');
  const [internalRole, setInternalRole] = useState<UserRoleCode>('USER');
  const [internalViewState, setInternalViewState] = useState<DataViewState>('POPULATED');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const activeSectionId = controlledSectionId ?? internalSectionId;
  const currentRole = controlledRole ?? internalRole;
  const currentViewState = controlledViewState ?? internalViewState;

  const navItems = resolveDashboardNavItems(currentRole, activeSectionId);
  const hostNavItems = navItems.filter((item) => item.group === 'HOST');
  const adminNavItems = navItems.filter((item) => item.group === 'ADMIN');
  const activeNavObj = navItems.find((item) => item.id === activeSectionId) ?? navItems[0];

  const handleSelectNav = (id: string) => {
    if (onSelectSection) {
      onSelectSection(id);
    } else {
      setInternalSectionId(id);
    }
    setMobileDrawerOpen(false);
  };

  const handleRoleSwitch = (nextRole: UserRoleCode) => {
    if (onChangeRole) {
      onChangeRole(nextRole);
    } else {
      setInternalRole(nextRole);
    }
  };

  const handleStateSwitch = (nextState: DataViewState) => {
    if (onChangeViewState) {
      onChangeViewState(nextState);
    } else {
      setInternalViewState(nextState);
    }
  };

  const handleCopyLink = (slug: string) => {
    const { fullUrl } = buildPublicInvitationUrl(slug);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl).catch(() => {});
    }
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const renderNavIcon = (id: string) => {
    switch (id) {
      case 'overview':
        return <LayoutDashboard className="w-4 h-4 shrink-0" />;
      case 'my-invitations':
        return <Sparkles className="w-4 h-4 shrink-0" />;
      case 'builder':
        return <PlusCircle className="w-4 h-4 shrink-0" />;
      case 'templates':
        return <Palette className="w-4 h-4 shrink-0" />;
      case 'guests-rsvp':
        return <Users className="w-4 h-4 shrink-0" />;
      case 'orders':
        return <Receipt className="w-4 h-4 shrink-0" />;
      case 'admin-templates':
      case 'admin-pricing':
        return <Settings className="w-4 h-4 shrink-0" />;
      case 'admin-users':
        return <ShieldCheck className="w-4 h-4 shrink-0" />;
      default:
        return <LayoutDashboard className="w-4 h-4 shrink-0" />;
    }
  };

  const renderBadgeClass = (tone?: 'amber' | 'emerald' | 'slate') => {
    if (tone === 'amber') {
      return 'bg-amber-100 text-amber-900 border border-amber-300/80';
    }
    if (tone === 'emerald') {
      return 'bg-emerald-100 text-emerald-900 border border-emerald-300/80';
    }
    return 'bg-slate-200/80 text-slate-700';
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between bg-white text-slate-900 select-none">
      {/* Top Brand & CTA */}
      <div>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-700 text-white flex items-center justify-center font-bold text-base shadow-xs">
              ا
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm tracking-tight">
                ایوان | پنل دعوت‌نامه
              </div>
              <div className="text-[11px] text-slate-500">پلتفرم دعوت‌نامه دیجیتال فارسی</div>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            RTL
          </span>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => handleSelectNav('builder')}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs flex items-center justify-between transition-colors shadow-xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              <span>ساخت دعوت‌نامه جدید</span>
            </span>
            <span className="tabular-nums bg-amber-900/40 px-2 py-0.5 rounded text-[11px]">
              {formatToman(50000)}
            </span>
          </button>
        </div>

        {/* Host Navigation Group */}
        <nav aria-label="منوی پنل کاربری میزبان" className="px-3 py-3 space-y-1">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold text-slate-400">
            بخش کاربری میزبان مراسم
          </div>
          {hostNavItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectNav(item.id)}
              className={`w-full min-h-[42px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                item.isActive
                  ? 'bg-amber-50/90 text-amber-950 font-semibold border-r-[3px] border-amber-700'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={item.isActive ? 'text-amber-700' : 'text-slate-500'}>
                  {renderNavIcon(item.id)}
                </span>
                <span>{item.labelFa}</span>
              </span>
              {item.badgeText && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded tabular-nums font-medium ${renderBadgeClass(
                    item.badgeTone
                  )}`}
                >
                  {item.badgeText}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Admin Navigation Group (RBAC Conditional) */}
        {adminNavItems.length > 0 && (
          <nav
            aria-label="منوی مدیریت سامانه (RBAC)"
            className="px-3 py-2 border-t border-slate-100 space-y-1"
          >
            <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold text-amber-800 flex items-center justify-between">
              <span>مدیریت سامانه (RBAC)</span>
              <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">
                {currentRole}
              </span>
            </div>
            {adminNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`w-full min-h-[42px] px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                  item.isActive
                    ? 'bg-amber-50/90 text-amber-950 font-semibold border-r-[3px] border-amber-700'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={item.isActive ? 'text-amber-700' : 'text-slate-500'}>
                    {renderNavIcon(item.id)}
                  </span>
                  <span>{item.labelFa}</span>
                </span>
                {item.badgeText && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded tabular-nums font-medium ${renderBadgeClass(
                      item.badgeTone
                    )}`}
                  >
                    {item.badgeText}
                  </span>
                )}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Bottom Authenticated User & Role Switcher */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
            <p
              dir="ltr"
              className="text-[11px] font-mono text-slate-500 tabular-nums text-right truncate"
            >
              {userPhone}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium shrink-0">
            نشست فعال
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1.5">
          <span className="text-[11px] text-slate-500">نقش آزمایشی:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleRoleSwitch('USER')}
              className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                currentRole === 'USER'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              میزبان (USER)
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('ADMIN')}
              className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN'
                  ? 'bg-amber-700 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              مدیر (ADMIN)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      dir="rtl"
      lang="fa"
      className="min-h-screen bg-slate-50 text-slate-900 font-vazirmatn flex flex-col lg:flex-row"
    >
      {/* Mobile Header Bar (lg:hidden) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="باز کردن منوی داشبورد"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <span className="font-bold text-sm text-slate-900">ایوان | داشبورد میزبان</span>
            <span className="block text-[11px] text-slate-500">{activeNavObj?.labelFa}</span>
          </div>
        </div>
        {onOpenPublicInvitation && (
          <button
            type="button"
            onClick={() => onOpenPublicInvitation('dayan123')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span>کارت زنده</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mobile Slide-Over RTL Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full bg-white border-l border-slate-200 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">منوی ناوبری راست‌به‌چپ (RTL)</span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="بستن منو"
                className="min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderSidebarContent()}</div>
          </aside>
        </div>
      )}

      {/* Desktop Right-Hand RTL Sidebar */}
      <aside
        aria-label="ستون کناری داشبورد (DashboardLayout Sidebar)"
        className="hidden lg:flex lg:w-68 xl:w-72 shrink-0 border-l border-slate-200 bg-white flex-col"
      >
        {renderSidebarContent()}
      </aside>

      {/* Main RTL Workspace Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* RTL Breadcrumb Trail */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">ایوان</span>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>DashboardLayout (RTL)</span>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-amber-800">{activeNavObj?.labelFa}</span>
          </div>

          {/* Right/Left Metadata & State Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>شنبه ۱۷ آبان ۱۴۰۵</span>
            </div>

            {/* Design System 4-State Switcher (Populated, Loading, Empty, Error) */}
            <div
              role="group"
              aria-label="تغییر وضعیت نمایش داده طبق DESIGN-SYSTEM.md"
              className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]"
            >
              {(
                [
                  { id: 'POPULATED', label: 'پُر (عادی)' },
                  { id: 'LOADING', label: 'اسکلتون لودینگ' },
                  { id: 'EMPTY', label: 'خالی (Empty)' },
                  { id: 'ERROR', label: 'خطا (Error)' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStateSwitch(st.id)}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    currentViewState === st.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {onOpenPublicInvitation && (
              <button
                type="button"
                onClick={() => onOpenPublicInvitation('dayan123')}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>مشاهده PublicInvitationLayout</span>
                <span dir="ltr" className="font-mono text-[11px] text-amber-800">
                  (/i/dayan123)
                </span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Section Heading Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800 mb-1">
                <span>پوسته اصلی پنل کاربری و مدیریت (`DashboardLayout`)</span>
                <span>·</span>
                <span>فونت Vazirmatn + اعداد هم‌عرض (`tabular-nums`)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {pageTitle ?? activeNavObj?.labelFa ?? 'میز کار میزبان'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {pageSubtitle ??
                  'مدیریت یکپارچه دعوت‌نامه‌های دیجیتال، لینک‌های اختصاصی مسیرمحور (/i/:slug)، آمار بازدید و پاسخ حضور مهمانان (RSVP).'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[11px]">تعرفه پایه هر دعوت‌نامه:</span>
                <span className="font-bold text-slate-900 tabular-nums">{formatToman(50000)}</span>
              </div>
            </div>
          </div>

          {/* Custom Children or Built-in 4-State Workspace Content */}
          {children ? (
            children
          ) : currentViewState === 'LOADING' ? (
            /* 1. Loading Skeleton State */
            <div aria-label="وضعیت بارگذاری (Loading Skeleton)" className="space-y-4 animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="bg-white p-4 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="h-3 w-24 bg-slate-200 rounded" />
                    <div className="h-6 w-16 bg-slate-300 rounded" />
                    <div className="h-2.5 w-32 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-14 w-full bg-slate-100 rounded-lg" />
                <div className="h-14 w-full bg-slate-100 rounded-lg" />
              </div>
            </div>
          ) : currentViewState === 'EMPTY' ? (
            /* 2. Empty State */
            <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto my-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  هنوز دعوت‌نامه‌ای در حساب شما ثبت نشده است
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  شما می‌توانید از میان قالب‌های عروسی، نامزدی، تولد و همایش یک قالب انتخاب کنید،
                  پیش‌نمایش زنده بگیرید و با پرداخت{' '}
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatToman(50000)}
                  </span>{' '}
                  لینک اختصاصی دریافت نمایید.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStateSwitch('POPULATED')}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold cursor-pointer"
                >
                  + ساخت اولین دعوت‌نامه دیجیتال
                </button>
              </div>
            </div>
          ) : currentViewState === 'ERROR' ? (
            /* 3. Error State */
            <div
              role="alert"
              className="bg-red-50/80 rounded-xl border border-red-200 p-6 sm:p-8 max-w-xl mx-auto my-4 space-y-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-sm sm:text-base font-bold text-red-950">
                    خطا در برقراری ارتباط با سرور دعوت‌نامه‌ها
                  </h2>
                  <p className="text-xs text-red-800 leading-relaxed">
                    متأسفانه دریافت فهرست دعوت‌نامه‌های شما به دلیل کندی شبکه با خطا مواجه شد.
                    اطلاعات شما کاملاً محفوظ است؛ لطفاً مجدداً تلاش کنید.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleStateSwitch('POPULATED')}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تلاش مجدد و بارگذاری داده‌ها</span>
                </button>
              </div>
            </div>
          ) : (
            /* 4. Populated State (Default Realistic Host & Admin Workspace) */
            <>
              {/* KPI Summary Strip */}
              <section
                aria-label="شاخص‌های کلیدی عملکرد میزبان"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              >
                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">دعوت‌نامه‌های فعال و منتشرشده</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {toPersianDigits(1)} از {toPersianDigits(2)}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                    لینک عمومی{' '}
                    <code dir="ltr" className="font-mono">
                      /i/dayan123
                    </code>{' '}
                    فعال است
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">مجموع بازدید کارت‌های دعوت</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                    {toPersianDigits(342)} بازدید
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                    {toPersianDigits(289)} بازدیدکننده یکتا (موبایل: ۹۱٪)
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">پاسخ حضور مهمانان (RSVP)</p>
                  <p className="text-2xl font-bold text-emerald-800 mt-1 tabular-nums">
                    {toPersianDigits(48)} تایید حضور
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                    {toPersianDigits(5)} عدم حضور · مجموع {toPersianDigits(114)} نفر با همراهان
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">وضعیت مالی و تعرفه پایه</p>
                  <p className="text-2xl font-bold text-amber-800 mt-1 tabular-nums">
                    {formatToman(50000)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    قابل تغییر از پنل مدیریت + پشتیبانی کد تخفیف
                  </p>
                </div>
              </section>

              {/* Invitations List Card */}
              <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900">
                      فهرست دعوت‌نامه‌های دیجیتال من
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      هر دعوت‌نامه پس از پرداخت نهایی، یک آدرس اختصاصی مسیرمحور (Path-Based URL)
                      دریافت می‌کند.
                    </p>
                  </div>
                  {onOpenPublicInvitation && (
                    <button
                      type="button"
                      onClick={() => onOpenPublicInvitation('dayan123')}
                      className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>پیش‌نمایش کارت عمومی</span>
                      <code dir="ltr" className="font-mono text-[11px]">
                        /i/dayan123
                      </code>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-200">
                  {SAMPLE_HOST_INVITATIONS.map((inv) => {
                    const urlInfo = buildPublicInvitationUrl(inv.slug);
                    const isPublished = inv.status === 'PUBLISHED';

                    return (
                      <div
                        key={inv.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{inv.titleFa}</h3>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {inv.categoryFa}
                            </span>
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>منتشرشده و پرداخت‌شده</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                                <Clock className="w-3 h-3" />
                                <span>پیش‌نویس (در انتظار پرداخت {formatToman(50000)})</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 tabular-nums">
                            <span>قالب: {inv.templateNameFa}</span>
                            <span>·</span>
                            <span>موعد مراسم: {inv.eventDateJalali}</span>
                          </div>

                          {/* Explicit LTR Path-Based URL inside RTL card */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs text-slate-500">لینک اختصاصی مهمانان:</span>
                            <code
                              dir="ltr"
                              className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800"
                            >
                              {urlInfo.fullUrl}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(inv.slug)}
                              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedSlug === inv.slug ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" />
                                  <span className="text-emerald-800">کپی شد</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>کپی لینک</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Right-aligned stats & actions */}
                        <div className="flex flex-wrap items-center gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs tabular-nums">
                            <span className="text-slate-500 block text-[10px]">بازدید / RSVP</span>
                            <span className="font-bold text-slate-800">
                              {toPersianDigits(inv.viewsCount)} بازدید ·{' '}
                              {toPersianDigits(inv.rsvpConfirmedCount)} حضور
                            </span>
                          </div>

                          {onOpenPublicInvitation && (
                            <button
                              type="button"
                              onClick={() => onOpenPublicInvitation(inv.slug)}
                              className="min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>مشاهده کارت دعوت</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};
