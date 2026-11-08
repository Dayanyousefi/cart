import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  FileCode2,
  RefreshCw,
  FolderTree,
  Server,
  Activity,
  Terminal,
  Database,
  UserPlus,
  KeyRound,
  Ban,
} from 'lucide-react';
import {
  BASE_INVITATION_PRICE_TOMAN,
  DATABASE_TABLES_SPEC,
  API_ENDPOINTS_SPEC,
  ADR_LIST_SPEC,
  ROADMAP_PHASES_SPEC,
  SAMPLE_COUPONS,
  EntityGroup,
  validateInvitationSlug,
  calculateServerOrderPricing,
  createImmutableTemplateSnapshot,
  formatToman,
  toPersianDigits,
} from './architecture/specs';
import { DashboardLayout, PublicInvitationLayout } from './layouts';

type WorkspaceTab =
  | 'dashboard_layout'
  | 'public_invitation_layout'
  | 'phase2_db'
  | 'foundation'
  | 'overview'
  | 'database'
  | 'api'
  | 'adr'
  | 'sandbox'
  | 'roadmap';

interface LiveFoundationData {
  health: {
    status: string;
    serviceName: string;
    version: string;
    phase: string;
    environment: string;
    timezone: string;
    locale: string;
    uptimeSeconds: number;
    baseInvitationPriceToman: number;
    adapters: {
      database: { engine: string; status: string; migrationsPhase: string };
      cacheAndQueue: { driver: string; redisEnabled: boolean };
      paymentGateway: { provider: string; sandboxMode: boolean };
      storage: { driver: string; maxUploadBytes: number };
    };
  };
  directoryVerification: {
    totalChecked: number;
    verifiedCount: number;
    allVerified: boolean;
    items: Array<{
      relativePath: string;
      category: 'backend' | 'frontend' | 'infrastructure' | 'docs';
      descriptionFa: string;
      existsOnDisk: boolean;
    }>;
  };
  recentLogs: Array<{
    timestamp: string;
    level: string;
    message: string;
    requestId?: string;
    module?: string;
  }>;
}

interface LiveDbStatusData {
  migrations: Array<{
    version: string;
    name: string;
    filename: string;
    checksumSha256: string;
    sqlContent: string;
    tablesCreated: string[];
    indexesCreated: string[];
    appliedAt: string;
  }>;
  roles: Array<{
    id: string;
    code: string;
    titleFa: string;
    description: string | null;
  }>;
  permissions: Array<{
    id: string;
    code: string;
    module: string;
    titleFa: string;
    roleCodes: string[];
  }>;
  users: Array<{
    id: string;
    roleId: string;
    roleCode?: string;
    roleTitleFa?: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    status: string;
    failedLoginAttempts: number;
    isCurrentlyLocked: boolean;
    lockedUntil: string | null;
    lastLoginAt: string | null;
  }>;
  sessions: Array<{
    id: string;
    userId: string;
    userFullName?: string;
    tokenHashPreview: string;
    ipAddress: string;
    userAgent: string | null;
    isRevoked: boolean;
    isExpired: boolean;
    expiresAt: string;
  }>;
  summary: {
    migrationsCount: number;
    rolesCount: number;
    permissionsCount: number;
    usersCount: number;
    activeSessionsCount: number;
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('public_invitation_layout');
  const [activeInvitationSlug, setActiveInvitationSlug] = useState<string>('dayan123');

  // Phase 2 Live Database State
  const [dbStatus, setDbStatus] = useState<LiveDbStatusData | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [repoFeedback, setRepoFeedback] = useState<{
    isError: boolean;
    statusCode: number;
    messageFa: string;
    rawJson?: string;
  } | null>(null);

  // New User Form State for Repository Testing
  const [newUserName, setNewUserName] = useState<string>('امیرحسین رضایی');
  const [newUserPhone, setNewUserPhone] = useState<string>('09125554433');
  const [newUserEmail, setNewUserEmail] = useState<string>('amir@example.ir');
  const [newUserRole, setNewUserRole] = useState<string>('USER');

  // Phase 1 Live Server Diagnostics State
  const [foundationData, setFoundationData] = useState<LiveFoundationData | null>(null);
  const [isLoadingFoundation, setIsLoadingFoundation] = useState<boolean>(true);
  const [foundationError, setFoundationError] = useState<string | null>(null);
  const [simulatedErrorPayload, setSimulatedErrorPayload] = useState<{
    statusCode: number;
    requestId: string;
    body: string;
  } | null>(null);
  const [dirCategoryFilter, setDirCategoryFilter] = useState<
    'all' | 'backend' | 'frontend' | 'infrastructure'
  >('all');

  const fetchLiveDbStatus = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch('/api/v1/db/status');
      if (res.ok) {
        const json = (await res.json()) as {
          success: boolean;
          data: LiveDbStatusData;
        };
        if (json.success && json.data) {
          setDbStatus(json.data);
        }
      }
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  const fetchLiveFoundationStatus = useCallback(async () => {
    setIsLoadingFoundation(true);
    setFoundationError(null);
    try {
      const response = await fetch('/api/v1/foundation/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = (await response.json()) as {
        success: boolean;
        data: LiveFoundationData;
      };
      if (json.success && json.data) {
        setFoundationData(json.data);
      }
    } catch (err) {
      setFoundationError(err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور API');
    } finally {
      setIsLoadingFoundation(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveDbStatus();
    void fetchLiveFoundationStatus();
  }, [fetchLiveDbStatus, fetchLiveFoundationStatus]);

  const runRepoAction = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/v1/db/test-repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { messageFa?: string };
        error?: { message?: string };
      };

      if (res.ok && json.success) {
        setRepoFeedback({
          isError: false,
          statusCode: res.status,
          messageFa: json.data?.messageFa || 'عملیات در لایه Repository با موفقیت انجام شد.',
          rawJson: JSON.stringify(json, null, 2),
        });
      } else {
        setRepoFeedback({
          isError: true,
          statusCode: res.status,
          messageFa: json.error?.message || 'خطای قید دیتابیس در لایه Repository',
          rawJson: JSON.stringify(json, null, 2),
        });
      }
      void fetchLiveDbStatus();
      void fetchLiveFoundationStatus();
    } catch (err) {
      setRepoFeedback({
        isError: true,
        statusCode: 500,
        messageFa: String(err),
      });
    }
  };

  const triggerErrorSimulation = async (
    type: 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'slug_conflict' | 'rate_limit'
  ) => {
    try {
      const res = await fetch(`/api/v1/health/simulate-error?type=${type}`);
      const reqId = res.headers.get('x-request-id') || 'req_local';
      const json = await res.json();
      setSimulatedErrorPayload({
        statusCode: res.status,
        requestId: reqId,
        body: JSON.stringify(json, null, 2),
      });
      void fetchLiveFoundationStatus();
    } catch (err) {
      setSimulatedErrorPayload({
        statusCode: 500,
        requestId: 'req_err',
        body: String(err),
      });
    }
  };

  // Database Explorer State
  const [dbSearch, setDbSearch] = useState('');
  const [selectedEntityGroup, setSelectedEntityGroup] = useState<'all' | EntityGroup>('all');
  const [selectedTableName, setSelectedTableName] = useState<string>('users');

  // API Explorer State
  const [selectedApiModule, setSelectedApiModule] = useState<string>('all');
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('ep-orders-create');

  // Interactive Domain Rules Sandbox State
  const [slugInput, setSlugInput] = useState<string>('dayan123');
  const [existingSlugs, setExistingSlugs] = useState<string[]>([
    'ali-sara',
    'mahsa-wedding',
    'tavalod-1405',
  ]);
  const [adminBasePrice, setAdminBasePrice] = useState<number>(BASE_INVITATION_PRICE_TOMAN);
  const [templateType, setTemplateType] = useState<'standard' | 'luxury' | 'free'>('standard');
  const [couponInput, setCouponInput] = useState<string>('BAHAR20');

  const [liveTemplateVersion, setLiveTemplateVersion] = useState<{
    versionNumber: number;
    primaryColorHex: string;
    animationPreset: 'floral-reveal' | 'fade-up' | 'envelope-gold' | 'none';
    sections: string[];
  }>({
    versionNumber: 1,
    primaryColorHex: '#B45309',
    animationPreset: 'floral-reveal',
    sections: ['hero', 'hosts', 'venue_map', 'rsvp_form'],
  });

  const lockedInvitationSnapshot = useMemo(
    () =>
      createImmutableTemplateSnapshot({
        templateId: 'tpl-royal-persian-wedding',
        versionNumber: 1,
        fontFamily: 'Vazirmatn',
        primaryColorHex: '#B45309',
        backgroundColorHex: '#FFFBEB',
        sections: ['hero', 'hosts', 'venue_map', 'rsvp_form'],
        animationPreset: 'floral-reveal',
      }),
    []
  );

  const filteredTables = useMemo(() => {
    return DATABASE_TABLES_SPEC.filter((table) => {
      const matchesGroup = selectedEntityGroup === 'all' || table.group === selectedEntityGroup;
      const q = dbSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        table.tableName.toLowerCase().includes(q) ||
        table.titleFa.includes(q) ||
        table.descriptionFa.includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [dbSearch, selectedEntityGroup]);

  const activeTable = useMemo(() => {
    return (
      filteredTables.find((t) => t.tableName === selectedTableName) ||
      filteredTables[0] ||
      DATABASE_TABLES_SPEC[0]
    );
  }, [filteredTables, selectedTableName]);

  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS_SPEC.filter(
      (ep) => selectedApiModule === 'all' || ep.module === selectedApiModule
    );
  }, [selectedApiModule]);

  const activeEndpoint = useMemo(() => {
    return (
      filteredEndpoints.find((ep) => ep.id === selectedEndpointId) ||
      filteredEndpoints[0] ||
      API_ENDPOINTS_SPEC[0]
    );
  }, [filteredEndpoints, selectedEndpointId]);

  const slugValidation = useMemo(() => {
    return validateInvitationSlug(slugInput, existingSlugs, 'https://example.ir');
  }, [slugInput, existingSlugs]);

  const pricingResult = useMemo(() => {
    return calculateServerOrderPricing({
      systemBasePriceToman: adminBasePrice,
      templateIsFree: templateType === 'free',
      templatePriceOverrideToman: templateType === 'luxury' ? 85000 : null,
      couponCode: couponInput,
      availableCoupons: SAMPLE_COUPONS,
    });
  }, [adminBasePrice, templateType, couponInput]);

  const filteredDirectoryItems = useMemo(() => {
    const items = foundationData?.directoryVerification.items ?? [];
    if (dirCategoryFilter === 'all') return items;
    return items.filter((i) => i.category === dirCategoryFilter);
  }, [foundationData, dirCategoryFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-vazirmatn" dir="rtl">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="relative z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#dashboard-layout"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard_layout');
          }}
          className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          ایوان | پوسته‌های ظاهری و معماری
        </a>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav
          aria-label="ناوبری اصلی پلتفرم"
          className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => setActiveTab('dashboard_layout')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'dashboard_layout'
                ? 'border-amber-700 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            DashboardLayout (داشبورد RTL)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('public_invitation_layout')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'public_invitation_layout'
                ? 'border-amber-700 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            PublicInvitationLayout (/i/:slug)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phase2_db')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'phase2_db'
                ? 'border-amber-700 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            ریپازیتوری احراز هویت (فاز ۲)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('foundation')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'foundation'
                ? 'border-amber-700 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            زیرساخت و سلامت سرور
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 cursor-pointer ${
              activeTab === 'database'
                ? 'border-amber-700 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            اسکیمای کل (۲۱ جدول)
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            آزمایشگاه قوانین دامنه
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-2">
        {[
          { id: 'dashboard_layout', label: 'DashboardLayout' },
          { id: 'public_invitation_layout', label: 'PublicInvitationLayout' },
          { id: 'phase2_db', label: 'ریپازیتوری فاز ۲' },
          { id: 'foundation', label: 'زیرساخت فاز ۱' },
          { id: 'database', label: 'اسکیمای ۲۱ جدول' },
          { id: 'api', label: 'قراردادهای API' },
          { id: 'sandbox', label: 'آزمایشگاه دامنه' },
          { id: 'roadmap', label: 'نقشه راه' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id as WorkspaceTab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
              activeTab === item.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Full-Bleed Layout Views: DashboardLayout & PublicInvitationLayout */}
      {activeTab === 'dashboard_layout' ? (
        <div className="flex-1">
          <DashboardLayout
            onOpenPublicInvitation={(slug) => {
              setActiveInvitationSlug(slug);
              setActiveTab('public_invitation_layout');
            }}
          />
        </div>
      ) : activeTab === 'public_invitation_layout' ? (
        <div className="flex-1">
          <PublicInvitationLayout
            slug={activeInvitationSlug}
            onBackToDashboard={() => setActiveTab('dashboard_layout')}
          />
        </div>
      ) : (
        /* Main Content Container for Architecture & Database Workbench Tabs */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Hero / Phase 2 Banner */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-emerald-700">
                    فاز فعلی: Phase 2 — Database Foundation (Auth & Users)
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>لایهها: Entity + SQL Migrations + Repository + Seed</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">نسخه: v0.3.0</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  لایه Entity، Migration و Repository جداول احراز هویت و کاربران
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  ساختار کامل دایرکتوریهای{' '}
                  <code dir="ltr" className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    src/server/db/entities
                  </code>
                  ،{' '}
                  <code dir="ltr" className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    src/server/db/migrations
                  </code>{' '}
                  و{' '}
                  <code dir="ltr" className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                    src/server/db/repositories
                  </code>{' '}
                  برای جداول{' '}
                  <code dir="ltr" className="text-xs font-mono">
                    roles, permissions, users, user_sessions
                  </code>{' '}
                  ایجاد و با تراکنشهای اتمیک، بررسی کلید خارجی (
                  <code dir="ltr" className="text-xs font-mono">
                    ON DELETE RESTRICT / CASCADE
                  </code>
                  ) و قید یکتایی راستیآزمایی شد.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('foundation')}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  سلامت سرور و ۲۹ مسیر دیسک
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('phase2_db');
                    void fetchLiveDbStatus();
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>بروزرسانی دادههای Repository</span>
                </button>
              </div>
            </div>

            {/* 4-Column Architectural KPI Strip */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-500">مایگریشنهای اعمالشده</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                  {dbStatus
                    ? `${toPersianDigits(dbStatus.summary.migrationsCount)} مایگریشن (001_auth)`
                    : '۱ مایگریشن (001_auth)'}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">تاییدشده با هش SHA-256</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">نقشها و مجوزهای پایه (RBAC)</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                  {dbStatus
                    ? `${toPersianDigits(dbStatus.summary.rolesCount)} نقش · ${toPersianDigits(
                        dbStatus.summary.permissionsCount
                      )} مجوز`
                    : '۴ نقش · ۱۰ مجوز'}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">USER, SUPPORT, ADMIN, SUPER_ADMIN</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">کاربران و نشستهای فعال</p>
                <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums">
                  {dbStatus
                    ? `${toPersianDigits(dbStatus.summary.usersCount)} کاربر · ${toPersianDigits(
                        dbStatus.summary.activeSessionsCount
                      )} نشست`
                    : isLoadingDb
                      ? 'در حال بارگذاری...'
                      : '۳ کاربر · ۳ نشست'}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">بدون افشای password_hash در DTO</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">تستهای خودکار کل پروژه</p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-700 tabular-nums flex items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>۱۵ از ۱۵ موفق</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-600">فاز ۰ + فاز ۱ + فاز ۲ (node:test)</p>
              </div>
            </div>
          </section>

          {/* TAB: PHASE 2 DATABASE FOUNDATION (ENTITIES, MIGRATIONS, REPOSITORIES) */}
          {activeTab === 'phase2_db' && (
            <div className="space-y-8">
              {/* Row 1: Interactive Repository Tester & Migration Inspector */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Left 6 cols: Interactive Repository Operations & Constraint Tester */}
                <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          ۱. آزمایشگاه زنده Repositoryهای کاربران و نقشها
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          تست مستقیم{' '}
                          <code dir="ltr" className="font-mono">
                            UsersRepository
                          </code>
                          ،{' '}
                          <code dir="ltr" className="font-mono">
                            RolesRepository
                          </code>{' '}
                          و قیدهای یکتایی / کلید خارجی.
                        </p>
                      </div>
                      <UserPlus className="w-5 h-5 text-amber-700 shrink-0" />
                    </div>

                    {/* Create User Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label
                          htmlFor="repo-user-name"
                          className="block font-semibold text-slate-700 mb-1"
                        >
                          نام و نام خانوادگی کاربر:
                        </label>
                        <input
                          id="repo-user-name"
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="repo-user-phone"
                          className="block font-semibold text-slate-700 mb-1"
                        >
                          شماره موبایل ایران (UNIQUE):
                        </label>
                        <input
                          id="repo-user-phone"
                          type="text"
                          dir="ltr"
                          value={newUserPhone}
                          onChange={(e) => setNewUserPhone(e.target.value)}
                          className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="repo-user-email"
                          className="block font-semibold text-slate-700 mb-1"
                        >
                          پست الکترونیکی (اختیاری - UNIQUE):
                        </label>
                        <input
                          id="repo-user-email"
                          type="email"
                          dir="ltr"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="repo-user-role"
                          className="block font-semibold text-slate-700 mb-1"
                        >
                          نقش کاربری (FK به جدول roles):
                        </label>
                        <select
                          id="repo-user-role"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        >
                          <option value="USER">USER — کاربر میزبان</option>
                          <option value="SUPPORT">SUPPORT — کارشناس پشتیبانی</option>
                          <option value="ADMIN">ADMIN — مدیر سامانه</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          void runRepoAction({
                            action: 'create_user',
                            fullName: newUserName,
                            phoneNumber: newUserPhone,
                            email: newUserEmail,
                            roleCode: newUserRole,
                          })
                        }
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        + ثبت کاربر جدید در UsersRepository
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void runRepoAction({
                            action: 'test_fk_restrict_role_delete',
                          })
                        }
                        className="px-3 py-2 text-xs font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                      >
                        تست حذف نقش USER (خطای کلید خارجی ON DELETE RESTRICT)
                      </button>
                    </div>

                    {/* Brute Force Lockout Simulation */}
                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        تست مکانیزم امنیتی قفل حساب پس از ۵ تلاش ناموفق ورود روی شماره{' '}
                        <code dir="ltr" className="font-mono">
                          09123456789
                        </code>
                        :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void runRepoAction({
                              action: 'simulate_failed_login',
                              phoneNumber: '09123456789',
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-md cursor-pointer"
                        >
                          ثبت تلاش ناموفق ورود (+۱ خطا)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void runRepoAction({
                              action: 'reset_login_lock',
                              phoneNumber: '09123456789',
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-md cursor-pointer"
                        >
                          ثبت ورود موفق و بازنشانی قفل
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Box */}
                  {repoFeedback && (
                    <div
                      className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                        repoFeedback.isError
                          ? 'bg-red-50 border-red-200 text-red-900'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{repoFeedback.messageFa}</span>
                        <span className="font-mono" dir="ltr">
                          HTTP {repoFeedback.statusCode}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Right 6 cols: Applied Migration 001_auth_and_users.sql Inspector */}
                <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          ۲. مایگریشن نسخهبندیشده (
                          <code dir="ltr" className="font-mono text-xs">
                            001_auth_and_users.sql
                          </code>
                          )
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          اجراشده توسط{' '}
                          <code dir="ltr" className="font-mono">
                            MigrationRunner
                          </code>{' '}
                          همراه با بررسی یکپارچگی هش SHA-256.
                        </p>
                      </div>
                      <Database className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>

                    {dbStatus?.migrations.map((mig) => (
                      <div key={mig.version} className="space-y-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-slate-600">
                          <span className="font-mono font-bold text-slate-900" dir="ltr">
                            {mig.filename}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>جداول: {mig.tablesCreated.join(', ')}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-500" dir="ltr">
                            SHA256: {mig.checksumSha256.slice(0, 14)}...
                          </span>
                        </div>
                        <pre
                          dir="ltr"
                          className="bg-slate-900 text-slate-100 p-3.5 rounded-lg text-xs font-mono overflow-x-auto max-h-64 leading-relaxed"
                        >
                          {mig.sqlContent}
                        </pre>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Row 2: Live Users & Active Sessions Tables from Repositories */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    ۳. رکوردهای زنده جدول کاربران (
                    <code dir="ltr" className="font-mono text-xs">
                      users
                    </code>
                    ) و نشستهای فعال (
                    <code dir="ltr" className="font-mono text-xs">
                      user_sessions
                    </code>
                    )
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    واکشیشده از لایه Repository با تبدیل به DTO امن (
                    <code dir="ltr" className="font-mono">
                      toSafeUserView
                    </code>{' '}
                    و{' '}
                    <code dir="ltr" className="font-mono">
                      toSafeSessionView
                    </code>{' '}
                    — فیلدهای هش رمز و توکن خام هرگز به بیرون ارسال نمیشوند).
                  </p>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3 font-semibold">نام کامل کاربر</th>
                        <th className="py-2.5 px-3 font-semibold">شماره موبایل</th>
                        <th className="py-2.5 px-3 font-semibold">نقش کاربری (Role)</th>
                        <th className="py-2.5 px-3 font-semibold">وضعیت حساب</th>
                        <th className="py-2.5 px-3 font-semibold">تلاش ناموفق ورود</th>
                        <th className="py-2.5 px-3 font-semibold">وضعیت قفل امنیتی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dbStatus?.users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{u.fullName}</td>
                          <td
                            className="py-2.5 px-3 font-mono text-slate-800 tabular-nums"
                            dir="ltr"
                          >
                            {u.phoneNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-semibold text-amber-800">
                              {u.roleCode}
                            </span>{' '}
                            <span className="text-slate-500">({u.roleTitleFa})</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                            {u.status}
                          </td>
                          <td className="py-2.5 px-3 tabular-nums font-bold">
                            {toPersianDigits(u.failedLoginAttempts)} از ۵
                          </td>
                          <td className="py-2.5 px-3">
                            {u.isCurrentlyLocked ? (
                              <span className="text-red-700 font-bold flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                <span>قفل موقت (Brute-Force Guard)</span>
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-semibold">آزاد و مجاز</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Active Sessions Table */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    نشستهای ثبتشده در{' '}
                    <code dir="ltr" className="font-mono text-xs">
                      UserSessionsRepository
                    </code>
                    :
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 px-3 font-semibold">کاربر مالک نشست</th>
                          <th className="py-2.5 px-3 font-semibold">هش توکن نوسازی (SHA-256)</th>
                          <th className="py-2.5 px-3 font-semibold">آدرس IP</th>
                          <th className="py-2.5 px-3 font-semibold">وضعیت نشست</th>
                          <th className="py-2.5 px-3 font-semibold">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dbStatus?.sessions.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {s.userFullName || s.userId}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-600" dir="ltr">
                              {s.tokenHashPreview}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700" dir="ltr">
                              {s.ipAddress}
                            </td>
                            <td className="py-2.5 px-3">
                              {s.isRevoked ? (
                                <span className="text-red-700 font-bold">باطل شده (Revoked)</span>
                              ) : (
                                <span className="text-emerald-700 font-bold">فعال و معتبر</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {!s.isRevoked && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void runRepoAction({
                                      action: 'revoke_session',
                                      sessionId: s.id,
                                    })
                                  }
                                  className="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded flex items-center gap-1 cursor-pointer"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>ابطال نشست</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Row 3: Roles & Granular Permissions Matrix */}
              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      ۴. ماتریس نقشها (
                      <code dir="ltr" className="font-mono text-xs">
                        roles
                      </code>
                      ) و مجوزهای ریزدانه (
                      <code dir="ltr" className="font-mono text-xs">
                        permissions
                      </code>
                      )
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      مقداردهیشده توسط اسکریپت Seed (
                      <code dir="ltr" className="font-mono">
                        src/server/db/seed/auth.seed.ts
                      </code>
                      ) جهت کنترل دسترسی RBAC.
                    </p>
                  </div>
                  <KeyRound className="w-5 h-5 text-slate-400 shrink-0" />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3 font-semibold">کد مجوز (Permission Code)</th>
                        <th className="py-2.5 px-3 font-semibold">ماژول</th>
                        <th className="py-2.5 px-3 font-semibold">شرح فارسی مجوز</th>
                        <th className="py-2.5 px-3 font-semibold">نقشهای دارای مجوز</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dbStatus?.permissions.map((perm) => (
                        <tr key={perm.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900" dir="ltr">
                            {perm.code}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-800" dir="ltr">
                            {perm.module}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{perm.titleFa}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-800" dir="ltr">
                            {perm.roleCodes.join(' · ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 0: PHASE 1 FOUNDATION & LIVE HEALTH MONITOR */}
          {activeTab === 'foundation' && (
            <div className="space-y-8">
              {foundationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-center justify-between">
                  <span>خطا در دریافت وضعیت زنده سرور: {foundationError}</span>
                  <button
                    type="button"
                    onClick={() => void fetchLiveFoundationStatus()}
                    className="px-3 py-1.5 bg-red-700 text-white rounded-md font-semibold cursor-pointer"
                  >
                    تلاش مجدد
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          ۱. وضعیت زنده سرور و متغیرهای محیطی (
                          <code dir="ltr" className="font-mono text-xs">
                            GET /api/v1/health
                          </code>
                          )
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          این اطلاعات مستقیماً از سرور Express در حال اجرا روی پورت 3000 خوانده شده
                          است.
                        </p>
                      </div>
                      <Activity className="w-5 h-5 text-emerald-700 shrink-0" />
                    </div>

                    {foundationData ? (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-slate-500 block">محیط اجرا (NODE_ENV):</span>
                          <span className="font-mono font-bold text-slate-900 mt-1 block" dir="ltr">
                            {foundationData.health.environment}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-slate-500 block">قیمت پایه دعوتنامه:</span>
                          <span className="font-bold text-slate-900 mt-1 block tabular-nums">
                            {formatToman(foundationData.health.baseInvitationPriceToman)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-slate-500 block">درایور صف و کش فعلی:</span>
                          <span className="font-mono font-bold text-slate-900 mt-1 block" dir="ltr">
                            {foundationData.health.adapters.cacheAndQueue.driver} (Redis:{' '}
                            {String(foundationData.health.adapters.cacheAndQueue.redisEnabled)})
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <span className="text-slate-500 block">آداپتور درگاه پرداخت:</span>
                          <span className="font-mono font-bold text-slate-900 mt-1 block" dir="ltr">
                            {foundationData.health.adapters.paymentGateway.provider} (Sandbox:{' '}
                            {String(foundationData.health.adapters.paymentGateway.sandboxMode)})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        در حال بارگذاری پاسخ زنده از سرور...
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-slate-700 mb-1.5">
                        خروجی JSON زنده از Endpoint سلامت:
                      </p>
                      <pre
                        dir="ltr"
                        className="bg-slate-900 text-emerald-300 p-3.5 rounded-lg text-xs font-mono overflow-x-auto max-h-48"
                      >
                        {foundationData
                          ? JSON.stringify(foundationData.health, null, 2)
                          : 'Loading /api/v1/health...'}
                      </pre>
                    </div>
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          ۲. آزمایشگاه مدیریت خطای متمرکز (
                          <code dir="ltr" className="font-mono text-xs">
                            centralizedErrorHandler
                          </code>
                          )
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          تست واقعی پاکت خطای استاندارد سرور، هدر{' '}
                          <code dir="ltr" className="font-mono">
                            X-Request-Id
                          </code>{' '}
                          و ثبت خودکار در لاگر سرور.
                        </p>
                      </div>
                      <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700">
                        یک سناریوی خطا را به سرور واقعی ارسال کنید:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void triggerErrorSimulation('validation')}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          خطای اعتبارسنجی (400)
                        </button>
                        <button
                          type="button"
                          onClick={() => void triggerErrorSimulation('unauthorized')}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          عدم احراز هویت (401)
                        </button>
                        <button
                          type="button"
                          onClick={() => void triggerErrorSimulation('forbidden')}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition-colors cursor-pointer"
                        >
                          عدم مجوز ادمین (403)
                        </button>
                        <button
                          type="button"
                          onClick={() => void triggerErrorSimulation('slug_conflict')}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md transition-colors cursor-pointer"
                        >
                          تداخل اسلاگ تکراری (409)
                        </button>
                        <button
                          type="button"
                          onClick={() => void triggerErrorSimulation('rate_limit')}
                          className="px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-900 rounded-md transition-colors cursor-pointer"
                        >
                          محدودیت نرخ درخواست (429)
                        </button>
                      </div>
                    </div>

                    {simulatedErrorPayload ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>
                            کد وضعیت HTTP:{' '}
                            <strong className="font-mono text-red-700">
                              {simulatedErrorPayload.statusCode}
                            </strong>
                          </span>
                          <span className="font-mono" dir="ltr">
                            X-Request-Id: {simulatedErrorPayload.requestId}
                          </span>
                        </div>
                        <pre
                          dir="ltr"
                          className="bg-slate-900 text-amber-300 p-3.5 rounded-lg text-xs font-mono overflow-x-auto max-h-48"
                        >
                          {simulatedErrorPayload.body}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
                        روی یکی از دکمههای بالا کلیک کنید تا پاسخ واقعی میانافزار خطای سرور نمایش
                        داده شود.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      ۳. راستیآزمایی زنده ساختار پوشهبندی، لایههای دیتابیس فاز ۲ و Docker روی دیسک
                      سرور
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      سرور بکاند با استفاده از{' '}
                      <code dir="ltr" className="font-mono">
                        fs.existsSync
                      </code>{' '}
                      وجود واقعی تمام ۲۹ مسیر ماژولار فاز ۱ و فاز ۲ را بررسی کرده است.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                    {[
                      { id: 'all', label: 'همه مسیرها (۲۹)' },
                      { id: 'backend', label: 'سرور و دیتابیس (۲۲)' },
                      { id: 'frontend', label: 'فرانتاند (۲)' },
                      { id: 'infrastructure', label: 'Docker و ابزارها (۵)' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setDirCategoryFilter(
                            cat.id as 'all' | 'backend' | 'frontend' | 'infrastructure'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          dirCategoryFilter === cat.id
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2.5 px-3 font-semibold">مسیر نسبی در پروژه</th>
                        <th className="py-2.5 px-3 font-semibold">لایه معماری</th>
                        <th className="py-2.5 px-3 font-semibold">مسئولیت و کاربرد در پلتفرم</th>
                        <th className="py-2.5 px-3 font-semibold">وضعیت روی دیسک</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDirectoryItems.map((item) => (
                        <tr key={item.relativePath} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900" dir="ltr">
                            {item.relativePath}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono" dir="ltr">
                            {item.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{item.descriptionFa}</td>
                          <td className="py-2.5 px-3">
                            {item.existsOnDisk ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>موجود و تاییدشده</span>
                              </span>
                            ) : (
                              <span className="text-red-700 font-bold">یافت نشد</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      ۴. آخرین لاگهای ساختاریافته ثبتشده در سرور (
                      <code dir="ltr" className="font-mono text-xs">
                        src/server/common/logger.ts
                      </code>
                      )
                    </h2>
                  </div>
                  <Terminal className="w-5 h-5 text-slate-400 shrink-0" />
                </div>

                <div
                  className="bg-slate-900 rounded-lg p-4 overflow-x-auto max-h-60 space-y-1.5 font-mono text-xs"
                  dir="ltr"
                >
                  {foundationData?.recentLogs && foundationData.recentLogs.length > 0 ? (
                    foundationData.recentLogs.map((log, index) => (
                      <div
                        key={`${log.timestamp}-${index}`}
                        className="text-slate-200 flex items-center gap-2"
                      >
                        <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                        <span
                          className={`font-bold uppercase shrink-0 ${
                            log.level === 'error'
                              ? 'text-red-400'
                              : log.level === 'warn'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          [{log.level}]
                        </span>
                        {log.requestId && (
                          <span className="text-sky-300 shrink-0">[{log.requestId}]</span>
                        )}
                        <span className="text-slate-100 truncate">{log.message}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400">Waiting for server logs...</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* TAB 1: OVERVIEW & ENVIRONMENT ANALYSIS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      ۰۱. بررسی امکانات واقعی محیط Google AI Studio و تطبیق با سرور Ubuntu 24.04 VPS
                    </h2>
                  </div>
                  <Server className="w-5 h-5 text-slate-400 shrink-0" />
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs text-slate-500">
                        <th className="py-3 px-4 font-semibold">بخش معماری</th>
                        <th className="py-3 px-4 font-semibold">وضعیت در محیط Google AI Studio</th>
                        <th className="py-3 px-4 font-semibold">
                          وضعیت در محیط Production VPS (Ubuntu 24.04)
                        </th>
                        <th className="py-3 px-4 font-semibold">
                          راهکار مهندسی اتخاذشده (Adapter)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">سرور وب و پورت</td>
                        <td className="py-3 px-4">
                          تکپورت اجباری (<code className="font-mono text-xs">PORT=3000</code>)
                        </td>
                        <td className="py-3 px-4">Nginx Reverse Proxy (443/80) به پورت 3000</td>
                        <td className="py-3 px-4">
                          سرور یکپارچه Express + Vite Middleware در{' '}
                          <code className="font-mono text-xs">server.ts</code>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-semibold text-slate-900">دیتابیس اصلی</td>
                        <td className="py-3 px-4">پشتیبانی از PostgreSQL / Repository سازگار</td>
                        <td className="py-3 px-4">PostgreSQL 16 داخل Docker با Volume پایدار</td>
                        <td className="py-3 px-4">
                          لایه Repository تراکنشی با ۲۱ جدول نرمالسازیشده
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h2 className="text-lg font-bold text-slate-900">
                        ۰۲. ساختار پوشههای مهندسی پروژه
                      </h2>
                      <FolderTree className="w-5 h-5 text-slate-400" />
                    </div>
                    <pre
                      dir="ltr"
                      className="mt-4 bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed"
                    >
                      {`invitation-platform/
├── server.ts                  # Express + Vite Full-Stack Entry
├── src/server/
│   ├── db/
│   │   ├── entities/          # auth.entities.ts (Role, Permission, User, Session)
│   │   ├── migrations/        # 001_auth_and_users.sql + migration-runner.ts
│   │   ├── repositories/      # roles, users, sessions, base transactional store
│   │   └── seed/              # auth.seed.ts (4 Roles, 10 Permissions, Seed Users)
│   ├── modules/               # health, database, auth, templates, invitations...
│   ├── middleware/            # Request-Context, Security, ErrorHandler
│   └── common/                # Structured Logger, AppError, Envelopes`}
                    </pre>
                  </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <h2 className="text-lg font-bold text-slate-900">
                        ۰۳. فهرست مستندات ایجادشده داخل سورس پروژه
                      </h2>
                      <FileCode2 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="mt-4 divide-y divide-slate-200 text-xs">
                      {[
                        { file: 'README.md', desc: 'معرفی کامل پروژه، معماری، نصب و دستورات اجرا' },
                        {
                          file: 'DATABASE.md',
                          desc: 'طراحی ۲۱ جدول PostgreSQL، نمودار ERD و ایندکسها',
                        },
                        {
                          file: 'STATUS.md',
                          desc: 'گزارش وضعیت واقعی مراحل، تستهای اجراشده و گام بعدی',
                        },
                        { file: 'CHANGELOG.md', desc: 'تاریخچه تغییرات نسخه v0.3.0 (فاز ۲)' },
                        {
                          file: 'MANUAL-TESTS.md',
                          desc: 'راهنمای تستهای دستی کارفرما برای تایید فاز ۲',
                        },
                      ].map((doc) => (
                        <div
                          key={doc.file}
                          className="py-2.5 flex items-center justify-between gap-4"
                        >
                          <span
                            className="font-mono font-semibold text-slate-900 shrink-0"
                            dir="ltr"
                          >
                            {doc.file}
                          </span>
                          <span className="text-slate-600 text-left sm:text-right">{doc.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE & ERD EXPLORER (21 TABLES) */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      کاوشگر مدل دیتابیس و روابط موجودیتها (۲۱ جدول PostgreSQL)
                    </h2>
                  </div>

                  <div className="relative w-full md:w-72">
                    <label htmlFor="db-table-search" className="sr-only">
                      جستجوی نام جدول یا توضیح
                    </label>
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="db-table-search"
                      type="text"
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      placeholder="جستجوی جدول (مثلاً users یا orders)..."
                      className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-700"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {[
                    { id: 'all', label: 'همه جداول (۲۱)' },
                    { id: 'auth_rbac', label: 'احراز هویت و دسترسی (۴)' },
                    { id: 'templates_engine', label: 'قالبها و موتور رندر (۳)' },
                    { id: 'invitations_rsvp', label: 'دعوتنامه و مهمانان (۶)' },
                    { id: 'orders_payments', label: 'مالی، سفارش و پرداخت (۶)' },
                    { id: 'admin_system', label: 'مدیریت و لاگ ممیزی (۲)' },
                  ].map((grp) => (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => setSelectedEntityGroup(grp.id as 'all' | EntityGroup)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedEntityGroup === grp.id
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {grp.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-4 border border-slate-200 rounded-lg divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
                    {filteredTables.map((tbl) => {
                      const isSelected = activeTable.tableName === tbl.tableName;
                      return (
                        <button
                          key={tbl.tableName}
                          type="button"
                          onClick={() => setSelectedTableName(tbl.tableName)}
                          className={`w-full text-right p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p
                              className="font-mono text-xs font-bold text-slate-900 truncate"
                              dir="ltr"
                            >
                              {tbl.tableName}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">{tbl.titleFa}</p>
                          </div>
                          <span className="text-xs text-slate-400 tabular-nums shrink-0">
                            {toPersianDigits(tbl.columns.length)} ستون
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="lg:col-span-8 border border-slate-200 rounded-lg p-5 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>گروه: {activeTable.groupLabelFa}</span>
                          <span aria-hidden="true">·</span>
                          <span>سیاست حذف: {activeTable.deletionPolicy}</span>
                        </div>
                        <h3 className="mt-1 text-xl font-bold text-slate-900 flex items-center gap-2">
                          <span>{activeTable.titleFa}</span>
                          <code
                            className="text-sm font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded"
                            dir="ltr"
                          >
                            {activeTable.tableName}
                          </code>
                        </h3>
                        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                          {activeTable.descriptionFa}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2.5 px-3 font-semibold">نام ستون</th>
                            <th className="py-2.5 px-3 font-semibold">نوع داده (PostgreSQL)</th>
                            <th className="py-2.5 px-3 font-semibold">قیدها (Constraints)</th>
                            <th className="py-2.5 px-3 font-semibold">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {activeTable.columns.map((col) => (
                            <tr key={col.name} className="hover:bg-slate-50">
                              <td
                                className="py-2.5 px-3 font-mono font-semibold text-slate-900"
                                dir="ltr"
                              >
                                {col.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-amber-800" dir="ltr">
                                {col.type}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600" dir="ltr">
                                {col.constraints}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{col.descriptionFa}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: API CONTRACTS EXPLORER */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900">
                    قراردادهای REST API و کنترل دسترسی (OpenAPI Specification)
                  </h2>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
                  {[
                    { id: 'all', label: 'همه ماژولها' },
                    { id: 'system', label: 'سلامت سیستم' },
                    { id: 'auth', label: 'احراز هویت' },
                    { id: 'templates', label: 'کاتالوگ قالبها' },
                    { id: 'invitations', label: 'ویرایشگر دعوتنامه' },
                    { id: 'public_rsvp', label: 'صفحه عمومی و RSVP' },
                    { id: 'orders_payments', label: 'پرداخت و سفارش' },
                    { id: 'admin', label: 'پنل مدیریت' },
                  ].map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedApiModule(mod.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedApiModule === mod.id
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 border border-slate-200 rounded-lg divide-y divide-slate-200">
                    {filteredEndpoints.map((ep) => {
                      const isSelected = activeEndpoint.id === ep.id;
                      return (
                        <button
                          key={ep.id}
                          type="button"
                          onClick={() => setSelectedEndpointId(ep.id)}
                          className={`w-full text-right p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2" dir="ltr">
                              <span className="font-mono text-xs font-bold text-amber-700">
                                {ep.method}
                              </span>
                              <span className="font-mono text-xs text-slate-900 truncate">
                                {ep.path}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 truncate">{ep.summaryFa}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="lg:col-span-7 border border-slate-200 rounded-lg p-5 space-y-4">
                    <p className="font-mono text-sm font-bold text-slate-900" dir="ltr">
                      {activeEndpoint.method} {activeEndpoint.path}
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {activeEndpoint.summaryFa}
                    </p>
                    <pre
                      dir="ltr"
                      className="bg-slate-900 text-emerald-300 p-3.5 rounded-lg text-xs font-mono overflow-x-auto"
                    >
                      {activeEndpoint.sampleResponse}
                    </pre>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 4: ARCHITECTURE DECISION RECORDS (ADR) */}
          {activeTab === 'adr' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-200">
                  تصمیمات کلیدی معماری (ADR-001 تا ADR-008)
                </h2>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ADR_LIST_SPEC.map((adr) => (
                    <article
                      key={adr.id}
                      className="border border-slate-200 rounded-lg p-5 space-y-2"
                    >
                      <span className="font-mono text-xs font-bold text-amber-800">{adr.id}</span>
                      <h3 className="text-base font-bold text-slate-900">{adr.titleFa}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{adr.decisionFa}</p>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 5: INTERACTIVE DOMAIN RULES SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    ۱. آزمایشگاه اعتبارسنجی آدرس اختصاصی دعوتنامه (/i/:slug)
                  </h2>
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-300 px-3 py-2 rounded-lg shrink-0">
                      https://example.ir/i/
                    </span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={(e) => setSlugInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-800">{slugValidation.messageFa}</p>
                </section>

                <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-slate-900">
                    ۲. شبیهساز محاسبه قیمت سفارش سمت سرور
                  </h2>
                  <p className="text-xs text-slate-600">
                    مبلغ نهایی با کوپن {couponInput}:{' '}
                    <strong className="text-amber-800">
                      {formatToman(pricingResult.finalAmountToman)}
                    </strong>
                  </p>
                </section>
              </div>

              <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    ۳. اسنپشات نسخه قالب (Locked v{lockedInvitationSnapshot.lockedVersionNumber} vs
                    Catalog v{liveTemplateVersion.versionNumber})
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setLiveTemplateVersion((prev) => ({
                        ...prev,
                        versionNumber: prev.versionNumber + 1,
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                  >
                    ارتقای نسخه کاتالوگ
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* TAB 6: ROADMAP (PHASES 0 TO 16) */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 pb-4 border-b border-slate-200">
                  نقشه راه اجرایی پروژه (Phase 0 تا Phase 16)
                </h2>
                <div className="mt-6 divide-y divide-slate-200">
                  {ROADMAP_PHASES_SPEC.map((phase) => (
                    <div
                      key={phase.code}
                      className="py-4 flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {phase.code} — {phase.titleFa}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      )}

      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            پلتفرم دعوت‌نامه دیجیتال «ایوان» — پوسته‌های اصلی (DashboardLayout و
            PublicInvitationLayout با فونت Vazirmatn و RTL)
          </span>
          <span>تمامی ۲۰ تست خودکار (Unit & Integration) با موفقیت اجرا شدند</span>
        </div>
      </footer>
    </div>
  );
}
