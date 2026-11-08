import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Send,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Smartphone,
  Monitor,
  MailOpen,
  Mail,
  Gift,
  Flower2,
  Layers,
  Compass,
  LayoutGrid,
} from 'lucide-react';
import {
  type CeremonyThemeId,
  type EnvelopeStyleId,
  ENVELOPE_STYLES_SPEC,
  getEnvelopeStyleSpec,
  getCeremonyThemePalette,
  buildPublicInvitationUrl,
  toPersianDigits,
  formatToman,
} from './rtl-utils';

export interface PublicInvitationLayoutProps {
  /** Path-based invitation slug (e.g., "dayan123" -> /i/dayan123) */
  slug?: string;
  /** Ceremonial visual theme preset */
  themeId?: CeremonyThemeId;
  /** Callback when user switches ceremonial theme */
  onChangeTheme?: (theme: CeremonyThemeId) => void;
  /** Active envelope design style */
  envelopeStyleId?: EnvelopeStyleId;
  /** Callback when user switches envelope design style */
  onChangeEnvelopeStyle?: (styleId: EnvelopeStyleId) => void;
  /** Event category title in Persian */
  categoryTitleFa?: string;
  /** Couple or host headline in Persian */
  hostsHeadlineFa?: string;
  /** Couple initials for monogram seals */
  hostsMonogramFa?: string;
  /** Poetic Bismillah or opening line */
  openingVerseFa?: string;
  /** Invitation body message */
  invitationBodyFa?: string;
  /** Jalali date display string */
  eventDateJalali?: string;
  /** Event time window */
  eventTimeFa?: string;
  /** Venue title */
  venueTitleFa?: string;
  /** Venue full address */
  venueAddressFa?: string;
  /** Whether the envelope gate starts closed (false) or already opened (true) */
  initialEnvelopeOpened?: boolean;
  /** Callback to return to DashboardLayout */
  onBackToDashboard?: () => void;
  /** Optional custom content inside the ceremonial card frame */
  children?: React.ReactNode;
}

export const PublicInvitationLayout: React.FC<PublicInvitationLayoutProps> = ({
  slug = 'dayan123',
  themeId: controlledThemeId,
  onChangeTheme,
  envelopeStyleId: controlledEnvelopeStyle,
  onChangeEnvelopeStyle,
  categoryTitleFa = 'جشن پیوند زناشویی',
  hostsHeadlineFa = 'سارا محمدی و دیان یوسفی',
  hostsMonogramFa = 'س · د',
  openingVerseFa = 'به نام آن‌که مهر را آفرید و دل‌ها را به پیوند عشق آراست',
  invitationBodyFa = 'با قلبی سرشار از شادی و سپاس، افتخار داریم میزبان حضور گرم و صمیمی شما عزیزان در آغاز فصل مشترک زندگی‌مان باشیم. دیدار شما روشنی‌بخش محفل ما خواهد بود.',
  eventDateJalali = 'پنجشنبه ۲۵ آبان ۱۴۰۵',
  eventTimeFa = 'ساعت ۱۹:۳۰ الی ۲۳:۳۰',
  venueTitleFa = 'باغ‌عمارت تشریفاتی نیاوران',
  venueAddressFa = 'تهران، میدان نیاوران، خیابان باهنر، کوچه گلستان، پلاک ۱۴',
  initialEnvelopeOpened = false,
  onBackToDashboard,
  children,
}) => {
  const [internalThemeId, setInternalThemeId] = useState<CeremonyThemeId>('LUXURY_GOLD');
  const [internalEnvelopeStyle, setInternalEnvelopeStyle] =
    useState<EnvelopeStyleId>('ROYAL_WAX_SEAL');
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState<boolean>(initialEnvelopeOpened);
  const [showAllEnvelopesGrid, setShowAllEnvelopesGrid] = useState<boolean>(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [viewportMode, setViewportMode] = useState<'RESPONSIVE' | 'MOBILE_FRAME'>('RESPONSIVE');
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Interactive RSVP state inside PublicInvitationLayout
  const [guestName, setGuestName] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<'ATTENDING' | 'NOT_ATTENDING' | 'MAYBE'>(
    'ATTENDING'
  );
  const [companionsCount, setCompanionsCount] = useState<number>(1);
  const [guestNote, setGuestNote] = useState<string>('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState<{
    guestName: string;
    status: string;
    companionsCount: number;
  } | null>(null);

  const activeThemeId = controlledThemeId ?? internalThemeId;
  const activeEnvelopeStyleId = controlledEnvelopeStyle ?? internalEnvelopeStyle;

  const palette = getCeremonyThemePalette(activeThemeId);
  const activeEnvelopeSpec = getEnvelopeStyleSpec(activeEnvelopeStyleId);
  const urlInfo = buildPublicInvitationUrl(slug);

  const handleSelectTheme = (nextTheme: CeremonyThemeId) => {
    if (onChangeTheme) {
      onChangeTheme(nextTheme);
    } else {
      setInternalThemeId(nextTheme);
    }
  };

  const handleSelectEnvelopeStyle = (nextStyle: EnvelopeStyleId) => {
    if (onChangeEnvelopeStyle) {
      onChangeEnvelopeStyle(nextStyle);
    } else {
      setInternalEnvelopeStyle(nextStyle);
    }
    // Automatically show the closed envelope when user selects an envelope style
    setIsEnvelopeOpen(false);
    setShowAllEnvelopesGrid(false);
  };

  const handleOpenEnvelope = () => {
    setIsEnvelopeOpen(true);
    setShowAllEnvelopesGrid(false);
    setIsMusicPlaying(true);
  };

  const handleCopyPathUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(urlInfo.fullUrl).catch(() => {});
    }
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = guestName.trim() || 'مهمان گرامی';
    setRsvpSubmitted({
      guestName: cleanName,
      status:
        attendanceStatus === 'ATTENDING'
          ? 'با کمال میل شرکت می‌کنم'
          : attendanceStatus === 'NOT_ATTENDING'
            ? 'متأسفانه امکان حضور ندارم'
            : 'هنوز مطمئن نیستم',
      companionsCount,
    });
  };

  /**
   * Renders the specific interactive closed envelope artwork & geometry for each of the 5 styles.
   */
  const renderInteractiveEnvelopeByStyle = (styleId: EnvelopeStyleId) => {
    switch (styleId) {
      case 'ROYAL_WAX_SEAL':
        return (
          <section
            aria-label="پاکت سلطنتی با مُهر موم طلایی"
            className="relative rounded-2xl border-2 border-amber-700/35 bg-[#FAF4E8] shadow-xl overflow-hidden select-none"
          >
            {/* Top V-Flap Geometry */}
            <div
              className="w-full h-44 sm:h-52 bg-gradient-to-b from-[#EFE4CE] via-[#E6D5B8] to-[#DEC8A2] border-b border-amber-800/30 flex flex-col items-center justify-start pt-5 px-4 text-center shadow-md"
              style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
            >
              <span className="text-[11px] font-semibold text-amber-950/80 tracking-wide">
                {openingVerseFa}
              </span>
              <span className="mt-1.5 text-[10px] px-2.5 py-0.5 rounded-full bg-amber-900/10 text-amber-950 font-bold">
                درب مثلثی کلاسیک سلطنتی
              </span>
            </div>

            {/* Wax Seal Button overlapping flap tip */}
            <div className="-mt-12 relative z-10 flex flex-col items-center justify-center px-6">
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="group w-28 h-28 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 text-amber-50 ring-4 ring-amber-300/80 shadow-xl flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer border-2 border-amber-400/50"
              >
                <span className="text-base font-extrabold tracking-widest border-b border-amber-400/40 pb-0.5 mb-1">
                  {hostsMonogramFa}
                </span>
                <Sparkles className="w-4 h-4 text-amber-300 mb-0.5" />
                <span className="text-[10px] font-bold text-amber-100">مُهر موم طلایی</span>
              </button>
            </div>

            {/* Lower Envelope Body */}
            <div className="px-6 sm:px-10 pt-5 pb-8 text-center space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-amber-800">{categoryTitleFa}</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {hostsHeadlineFa}
                </h1>
                <p className="text-xs text-slate-600 tabular-nums">
                  {eventDateJalali} · {venueTitleFa}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-amber-50 text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MailOpen className="w-4 h-4" />
                  <span>{activeEnvelopeSpec.actionPromptFa}</span>
                </button>
              </div>
            </div>
          </section>
        );

      case 'PERSIAN_TERMEH_ARCH':
        return (
          <section
            aria-label="پاکت محرابی ترمه و کاشی ایرانی"
            className="relative rounded-t-[120px] rounded-b-2xl border-2 border-emerald-800/40 bg-gradient-to-b from-emerald-950 via-emerald-900 to-[#0B2922] text-emerald-50 p-6 sm:p-10 shadow-xl overflow-hidden select-none"
          >
            {/* Inner Gold Arch Frame */}
            <div className="rounded-t-[100px] rounded-b-xl border border-amber-400/45 bg-[#0F352C]/80 px-5 sm:px-8 py-8 text-center space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-[11px] font-semibold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>طرح محرابی شمسه و ترمه ایرانی</span>
                </span>
                <p className="text-xs text-amber-100/90 font-medium">{openingVerseFa}</p>
              </div>

              {/* Octagonal Turquoise-Gold Shamseh Medallion */}
              <div className="py-2 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="w-28 h-28 rotate-45 rounded-2xl bg-gradient-to-br from-teal-500 via-emerald-700 to-teal-900 border-2 border-amber-300 shadow-lg flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="-rotate-45 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-extrabold text-amber-200">{hostsMonogramFa}</span>
                    <span className="text-[10px] font-bold text-white mt-0.5">نگین شمسه</span>
                    <span className="text-[9px] text-emerald-100">لمس برای گشودن</span>
                  </div>
                </button>
              </div>

              {/* Calligraphy Cartouche (کتیبه زرنگار) */}
              <div className="rounded-xl bg-white/10 border border-amber-300/30 p-4 space-y-1.5">
                <p className="text-xs text-amber-200 font-medium">{categoryTitleFa}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {hostsHeadlineFa}
                </h1>
                <p className="text-xs text-emerald-100/80 tabular-nums">{eventDateJalali}</p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MailOpen className="w-4 h-4" />
                  <span>{activeEnvelopeSpec.actionPromptFa}</span>
                </button>
              </div>
            </div>
          </section>
        );

      case 'SILK_RIBBON_TIE':
        return (
          <section
            aria-label="پاکت مخملی با روبان ابریشمی و پاپیون"
            className="relative rounded-2xl border-2 border-rose-800/30 bg-[#FFF7F8] p-8 sm:p-12 shadow-xl overflow-hidden select-none"
          >
            {/* Horizontal Silk Ribbon Band */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-11 bg-gradient-to-r from-rose-900 via-rose-700 to-rose-900 border-y border-amber-300/50 shadow-sm"
            />
            {/* Vertical Silk Ribbon Band */}
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-11 bg-gradient-to-b from-rose-900 via-rose-700 to-rose-900 border-x border-amber-300/50 shadow-sm"
            />

            <div className="relative z-10 flex flex-col items-center justify-between space-y-8">
              {/* Upper Card Header Above Ribbon */}
              <div className="bg-white/95 backdrop-blur-xs px-6 py-3.5 rounded-xl border border-rose-200 shadow-xs text-center space-y-1 max-w-md w-full">
                <p className="text-[11px] font-semibold text-rose-800">{openingVerseFa}</p>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {hostsHeadlineFa}
                </h1>
              </div>

              {/* Central Silk Bow Knot & Hanging Guest Tag */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-2">
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-rose-800 via-rose-900 to-amber-950 text-rose-50 ring-4 ring-rose-200 border-2 border-amber-300 shadow-xl flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <Gift className="w-6 h-6 text-amber-200 mb-1" />
                  <span className="text-[11px] font-extrabold">گره پاپیون</span>
                  <span className="text-[10px] text-rose-200">باز کردن روبان</span>
                </button>

                {/* Hanging Personalized Guest Tag */}
                <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 shadow-sm text-right max-w-[210px]">
                  <span className="text-[10px] text-amber-800 font-bold block">
                    تگ آویز اختصاصی پاکت:
                  </span>
                  <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                    مهمان گرامی، حضور شما افتخار ماست
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums block mt-0.5">
                    {eventDateJalali}
                  </span>
                </div>
              </div>

              {/* Lower Action Box Below Ribbon */}
              <div className="bg-white/95 px-6 py-3 rounded-xl border border-rose-200 shadow-xs text-center">
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="min-h-[42px] px-5 py-2 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  <MailOpen className="w-4 h-4" />
                  <span>{activeEnvelopeSpec.actionPromptFa}</span>
                </button>
              </div>
            </div>
          </section>
        );

      case 'BOTANICAL_VELLUM_GATE':
        return (
          <section
            aria-label="پاکت دولنگه کالک گل‌دار (Gatefold)"
            className="relative rounded-2xl border-2 border-teal-800/25 bg-[#F4F8F5] shadow-xl overflow-hidden select-none"
          >
            {/* Two Gatefold Shutters meeting at the center seam */}
            <div className="grid grid-cols-2 min-h-[360px] relative">
              {/* Right Gatefold Door */}
              <div className="bg-gradient-to-l from-[#E5EFE8] to-[#F7FAF8] border-l border-teal-800/25 p-5 sm:p-8 flex flex-col justify-between text-right">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                    <Flower2 className="w-3 h-3" />
                    <span>لنگه راست کالک</span>
                  </span>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{categoryTitleFa}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-teal-900">میزبانان مراسم:</p>
                  <p className="text-sm sm:text-base font-extrabold text-slate-900">
                    {hostsHeadlineFa}
                  </p>
                </div>
              </div>

              {/* Left Gatefold Door */}
              <div className="bg-gradient-to-r from-[#E5EFE8] to-[#F7FAF8] p-5 sm:p-8 flex flex-col justify-between text-left">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 bg-teal-100/80 px-2.5 py-0.5 rounded-full">
                    <span>لنگه چپ کالک</span>
                  </span>
                  <p className="text-xs text-slate-600 mt-2 tabular-nums">{eventDateJalali}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-teal-900">مکان برگزاری:</p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">{venueTitleFa}</p>
                </div>
              </div>

              {/* Center Clasp Locking Both Doors */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-4">
                <button
                  type="button"
                  onClick={handleOpenEnvelope}
                  className="pointer-events-auto w-28 h-28 rounded-full bg-white border-2 border-amber-600 ring-8 ring-teal-900/10 shadow-xl flex flex-col items-center justify-center text-center hover:scale-105 transition-transform cursor-pointer"
                >
                  <Flower2 className="w-6 h-6 text-emerald-700 mb-0.5" />
                  <span className="text-xs font-extrabold text-slate-900">{hostsMonogramFa}</span>
                  <span className="text-[10px] font-semibold text-amber-800 mt-0.5">
                    باز کردن دولنگه
                  </span>
                </button>
              </div>
            </div>

            {/* Bottom Gatefold Bar */}
            <div className="bg-white/90 border-t border-teal-800/15 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-600">
                پاکت دولنگه کاغذ کالک نیمه‌شفاف با سگک طلایی برگ زیتون
              </span>
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MailOpen className="w-3.5 h-3.5" />
                <span>{activeEnvelopeSpec.actionPromptFa}</span>
              </button>
            </div>
          </section>
        );

      case 'MODERN_ARCH_POCKET':
      default:
        return (
          <section
            aria-label="پاکت جیبی مدرن قوسی (Pocket Fold)"
            className="relative rounded-2xl border border-slate-300 bg-slate-200/70 pt-6 px-4 sm:px-8 pb-0 shadow-xl overflow-hidden select-none"
          >
            {/* Arch-Top Invitation Card Peeking Out of the Pocket */}
            <div className="mx-auto max-w-md rounded-t-[90px] bg-white border-x border-t border-slate-300 px-6 pt-8 pb-12 text-center shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-amber-800 tracking-wide">
                کارت قوسی داخل جیب پاکت
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {hostsHeadlineFa}
              </h1>
              <p className="text-xs text-slate-500">{categoryTitleFa}</p>
            </div>

            {/* Angled Bottom Pocket Sleeve Holding the Card */}
            <div className="-mt-6 relative z-10 rounded-t-2xl bg-slate-900 text-white p-6 sm:p-8 border-t-4 border-amber-500 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-right">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>پاکت جیبی مدرن (Pocket Fold)</span>
                </div>
                <p className="text-sm font-bold text-white tabular-nums">{eventDateJalali}</p>
                <p className="text-xs text-slate-300">{venueTitleFa}</p>
              </div>

              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <MailOpen className="w-4 h-4" />
                <span>{activeEnvelopeSpec.actionPromptFa}</span>
              </button>
            </div>
          </section>
        );
    }
  };

  return (
    <div
      dir="rtl"
      lang="fa"
      className={`min-h-screen font-vazirmatn transition-colors duration-300 ${palette.outerBgClass} flex flex-col`}
    >
      {/* Top Path-Based URL, Envelope Selector & Theme Inspector Bar */}
      <header className="relative z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 text-slate-900 space-y-2.5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت به DashboardLayout</span>
              </button>
            )}
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] text-slate-500 hidden sm:inline">آدرس مسیرمحور:</span>
              <code dir="ltr" className="text-xs font-mono font-semibold text-amber-800">
                {urlInfo.fullUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyPathUrl}
                className="text-[11px] px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span className="text-emerald-800">کپی شد</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>کپی</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Theme Preset & Envelope Open/Close Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="انتخاب تم ظاهری کارت دعوت"
              className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]"
            >
              {(
                [
                  { id: 'LUXURY_GOLD', label: 'طلایی سلطنتی' },
                  { id: 'PERSIAN_EMERALD', label: 'زمرد ایرانی' },
                  { id: 'VELVET_ROSE', label: 'رز مخملی' },
                  { id: 'MINIMAL_IVORY', label: 'عاجی رسمی' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTheme(t.id)}
                  className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeThemeId === t.id
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAllEnvelopesGrid(false);
                setIsEnvelopeOpen((prev) => !prev);
              }}
              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <MailOpen className="w-3.5 h-3.5" />
              <span>{isEnvelopeOpen ? 'بستن و مشاهده پاکت' : 'گشودن کارت دعوت'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setViewportMode((m) => (m === 'RESPONSIVE' ? 'MOBILE_FRAME' : 'RESPONSIVE'))
              }
              className="hidden md:flex min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium items-center gap-1.5 cursor-pointer"
            >
              {viewportMode === 'MOBILE_FRAME' ? (
                <>
                  <Monitor className="w-3.5 h-3.5" />
                  <span>نمای تمام‌صفحه</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>قاب موبایل (Mobile-First)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dedicated 5-Envelope Style Selector Bar */}
        <div className="max-w-5xl mx-auto pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 ml-1">
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>انتخاب مدل پاکت دعوت‌نامه (۵ طرح متنوع):</span>
            </span>
            {ENVELOPE_STYLES_SPEC.map((envStyle) => {
              const isSelected =
                activeEnvelopeStyleId === envStyle.id && !showAllEnvelopesGrid && !isEnvelopeOpen;
              return (
                <button
                  key={envStyle.id}
                  type="button"
                  onClick={() => handleSelectEnvelopeStyle(envStyle.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                      : activeEnvelopeStyleId === envStyle.id
                        ? 'bg-amber-50 text-amber-950 border-amber-300 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {envStyle.shortLabelFa}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAllEnvelopesGrid((prev) => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              showAllEnvelopesGrid
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>
              {showAllEnvelopesGrid ? 'بازگشت به نمای تکی پاکت' : 'مقایسه هم‌زمان هر ۵ نوع پاکت'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Ceremonial Container */}
      <main className="flex-1 py-6 sm:py-10 px-3 sm:px-6 flex flex-col items-center justify-center">
        {showAllEnvelopesGrid ? (
          /* Side-by-Side 5 Envelope Styles Showcase Grid */
          <div className="w-full max-w-5xl space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ویترین ۵ مدل پاکت دعوت‌نامه دیجیتال «ایوان»
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  هر میزبان می‌تواند هنگام ساخت دعوت‌نامه، یکی از ۵ ساختار هندسی زیر را برای پاکت
                  ورودی کارت دعوت خود انتخاب کند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllEnvelopesGrid(false)}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                مشاهده پاکت انتخاب‌شده در ابعاد کامل
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ENVELOPE_STYLES_SPEC.map((spec) => {
                const isCurrent = activeEnvelopeStyleId === spec.id;
                return (
                  <div
                    key={spec.id}
                    className={`rounded-2xl bg-white border p-5 flex flex-col justify-between gap-4 transition-all ${
                      isCurrent
                        ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${spec.accentBadgeClass}`}
                        >
                          {spec.shortLabelFa}
                        </span>
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-amber-800">
                            ● طرح فعال فعلی
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-extrabold text-slate-900">{spec.titleFa}</h2>
                      <p className="text-xs text-slate-600 leading-relaxed">{spec.subtitleFa}</p>

                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">مکانیزم باز شدن:</span>
                          <span className="font-bold text-slate-800">{spec.claspTitleFa}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">مناسب برای:</span>
                          <span className="font-medium text-slate-700">
                            {spec.recommendedForFa}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectEnvelopeStyle(spec.id)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>مشاهده و تست این پاکت</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className={`w-full transition-all duration-300 ${
              viewportMode === 'MOBILE_FRAME' ? 'max-w-[420px]' : 'max-w-2xl'
            }`}
          >
            {/* Floating Ceremonial Music & Active Envelope Badge Strip */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => setIsMusicPlaying((prev) => !prev)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isMusicPlaying
                    ? 'bg-amber-800 text-amber-50 shadow-sm'
                    : 'bg-white/90 text-slate-700 border border-slate-300 hover:bg-white'
                }`}
              >
                {isMusicPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>در حال پخش موسیقی سنتی ملایم... (توقف)</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-500" />
                    <span>پخش موسیقی متن دعوت‌نامه</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${activeEnvelopeSpec.accentBadgeClass}`}
                >
                  پاکت: {activeEnvelopeSpec.shortLabelFa}
                </span>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${palette.badgeClass}`}
                >
                  {palette.titleFa}
                </span>
              </div>
            </div>

            {/* Envelope Closed Cover State (5 Distinct Geometries) vs Opened Invitation Card */}
            {!isEnvelopeOpen ? (
              <div className="space-y-4">
                {renderInteractiveEnvelopeByStyle(activeEnvelopeStyleId)}

                {/* Quick Bottom Switcher Under the Closed Envelope */}
                <div className="bg-white/90 backdrop-blur-xs rounded-xl border border-slate-200/90 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700">
                    طرح فعلی: {activeEnvelopeSpec.titleFa}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ENVELOPE_STYLES_SPEC.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectEnvelopeStyle(s.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium cursor-pointer ${
                          activeEnvelopeStyleId === s.id
                            ? 'bg-amber-800 text-white font-bold'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s.shortLabelFa}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Opened Ceremonial Invitation Card */
              <article
                aria-label="کارت دعوت دیجیتال عمومی (PublicInvitationLayout)"
                className={`${palette.cardBgClass} rounded-2xl border ${palette.borderClass} ceremonial-double-border overflow-hidden shadow-lg`}
              >
                {/* Ceremonial Header Banner */}
                <div
                  className={`bg-gradient-to-b ${palette.headerAccentClass} px-6 sm:px-10 py-8 sm:py-10 text-center space-y-3`}
                >
                  <p className="text-xs sm:text-sm opacity-90 font-medium tracking-wide">
                    {openingVerseFa}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold">
                    <Heart className="w-3.5 h-3.5" />
                    <span>{categoryTitleFa}</span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight pt-1">
                    {hostsHeadlineFa}
                  </h1>
                  <p className="text-xs opacity-80 tabular-nums">{eventDateJalali}</p>
                </div>

                {/* Card Inner Body */}
                <div className="p-5 sm:p-8 space-y-8">
                  {children ? (
                    children
                  ) : (
                    <>
                      {/* Poetic Invitation Text */}
                      <section className="text-center max-w-lg mx-auto space-y-3">
                        <p
                          className={`text-sm sm:text-base leading-8 font-medium ${palette.primaryTextClass}`}
                        >
                          {invitationBodyFa}
                        </p>
                      </section>

                      {/* Jalali Date, Time & Countdown Box */}
                      <section
                        aria-label="زمان برگزاری و شمارش معکوس مراسم"
                        className={`rounded-xl border ${palette.borderClass} bg-white/80 p-4 sm:p-5 space-y-4`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-200/80">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${palette.badgeClass}`}>
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                تاریخ برگزاری (شمسی)
                              </span>
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {eventDateJalali}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${palette.badgeClass}`}>
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block">
                                ساعت پذیرش و مراسم
                              </span>
                              <span className="text-sm font-bold text-slate-900 tabular-nums">
                                {eventTimeFa}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tabular Countdown Strip */}
                        <div className="text-center space-y-2">
                          <span className="text-[11px] font-medium text-slate-500">
                            شمارش معکوس تا آغاز مراسم (به وقت تهران — Asia/Tehran)
                          </span>
                          <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto tabular-nums">
                            {[
                              { value: toPersianDigits(8), unit: 'روز' },
                              { value: toPersianDigits(14), unit: 'ساعت' },
                              { value: toPersianDigits(35), unit: 'دقیقه' },
                              { value: toPersianDigits(20), unit: 'ثانیه' },
                            ].map((item) => (
                              <div
                                key={item.unit}
                                className="rounded-lg bg-slate-50 border border-slate-200/90 py-2 px-1"
                              >
                                <span
                                  className={`block text-lg sm:text-xl font-extrabold ${palette.accentTextClass}`}
                                >
                                  {item.value}
                                </span>
                                <span className="text-[11px] text-slate-500">{item.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* Venue & Iranian Navigation Apps (Neshan, Balad, Google Maps) */}
                      <section
                        aria-label="نشانی و مسیریابی مراسم"
                        className={`rounded-xl border ${palette.borderClass} bg-white/80 p-4 sm:p-5 space-y-3.5`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg shrink-0 ${palette.badgeClass}`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h2 className="text-sm font-bold text-slate-900">{venueTitleFa}</h2>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {venueAddressFa}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <a
                            href="https://neshan.org"
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-700" />
                            <span>مسیریابی با نشان</span>
                          </a>
                          <a
                            href="https://balad.ir"
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                            <span>مسیریابی با بلد</span>
                          </a>
                          <a
                            href="https://maps.google.com"
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-700" />
                            <span>مسیریابی گوگل‌مپ</span>
                          </a>
                        </div>
                      </section>

                      {/* Guest RSVP & Greeting Form */}
                      <section
                        aria-label="فرم اعلام حضور مهمانان (RSVP)"
                        className={`rounded-xl border ${palette.borderClass} bg-white p-4 sm:p-6 space-y-4`}
                      >
                        <div className="border-b border-slate-100 pb-3">
                          <h2 className="text-sm sm:text-base font-bold text-slate-900">
                            اعلام حضور در مراسم (RSVP) و ثبت یادگاری
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            لطفاً جهت برنامه‌ریزی بهتر پذیرایی، وضعیت حضور و تعداد همراهان خود را
                            ثبت فرمایید.
                          </p>
                        </div>

                        {rsvpSubmitted ? (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              <span>پاسخ شما با موفقیت برای میزبان ثبت شد</span>
                            </div>
                            <p className="text-xs text-emerald-800 tabular-nums">
                              نام مهمان: <strong>{rsvpSubmitted.guestName}</strong> · وضعیت:{' '}
                              <strong>{rsvpSubmitted.status}</strong> · تعداد کل نفرات:{' '}
                              <strong>{toPersianDigits(rsvpSubmitted.companionsCount)} نفر</strong>
                            </p>
                            <button
                              type="button"
                              onClick={() => setRsvpSubmitted(null)}
                              className="text-xs font-semibold text-emerald-900 underline cursor-pointer"
                            >
                              ویرایش پاسخ ثبت‌شده
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleRsvpSubmit} className="space-y-3.5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor="rsvp-guest-name"
                                  className="block text-xs font-semibold text-slate-700 mb-1"
                                >
                                  نام و نام خانوادگی شما:
                                </label>
                                <input
                                  id="rsvp-guest-name"
                                  type="text"
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  placeholder="مثال: دکتر سهراب سپهری"
                                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-700"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="rsvp-companions"
                                  className="block text-xs font-semibold text-slate-700 mb-1"
                                >
                                  تعداد کل نفرات (شما و همراهان):
                                </label>
                                <select
                                  id="rsvp-companions"
                                  value={companionsCount}
                                  onChange={(e) => setCompanionsCount(Number(e.target.value))}
                                  className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white tabular-nums focus:outline-none focus:border-amber-700"
                                >
                                  {[1, 2, 3, 4, 5].map((cnt) => (
                                    <option key={cnt} value={cnt}>
                                      {toPersianDigits(cnt)} نفر
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                                وضعیت حضور در مراسم:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {(
                                  [
                                    { id: 'ATTENDING', label: 'حتماً شرکت می‌کنم' },
                                    { id: 'MAYBE', label: 'هنوز مطمئن نیستم' },
                                    { id: 'NOT_ATTENDING', label: 'متأسفانه نمی‌توانم' },
                                  ] as const
                                ).map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setAttendanceStatus(opt.id)}
                                    className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                      attendanceStatus === opt.id
                                        ? `${palette.badgeClass} font-bold`
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor="rsvp-note"
                                className="block text-xs font-semibold text-slate-700 mb-1"
                              >
                                متن تبریک و یادگاری برای میزبان (اختیاری):
                              </label>
                              <textarea
                                id="rsvp-note"
                                rows={2}
                                value={guestNote}
                                onChange={(e) => setGuestNote(e.target.value)}
                                placeholder="با آرزوی خوشبختی و شادی ابدی برای شما دو عزیز..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-amber-700"
                              />
                            </div>

                            <button
                              type="submit"
                              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold ${palette.buttonPrimaryClass} flex items-center justify-center gap-2 cursor-pointer`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>ثبت پاسخ حضور و ارسال یادگاری</span>
                            </button>
                          </form>
                        )}
                      </section>
                    </>
                  )}
                </div>

                {/* Subtle Ceremonial Card Footer */}
                <footer className="px-6 py-4 bg-slate-50/90 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>طراحی‌شده با پلتفرم دعوت‌نامه دیجیتال «ایوان» (فونت Vazirmatn · RTL)</span>
                  <span className="tabular-nums font-medium text-slate-700">
                    ساخت کارت مشابه: {formatToman(50000)}
                  </span>
                </footer>
              </article>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
