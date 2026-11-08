import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Eye,
  Wand2,
  Check,
  ShieldCheck,
  Globe2,
  Layers,
  Music,
  Crown,
} from 'lucide-react';
import {
  INITIAL_MASTER_TEMPLATES,
  type ValidatedTemplateSpec,
  type SupportedLocale,
} from '../template-engine/template-schema';
import { TemplateSchemaRenderer } from '../template-engine/TemplateSchemaRenderer';

interface LandingAndMarketplaceProps {
  onSelectTemplateForStudio: (template: ValidatedTemplateSpec, locale: SupportedLocale) => void;
  onSelectTemplateForCinematic: (template: ValidatedTemplateSpec, locale: SupportedLocale) => void;
}

export const LuxuryLandingAndMarketplace: React.FC<LandingAndMarketplaceProps> = ({
  onSelectTemplateForStudio,
  onSelectTemplateForCinematic,
}) => {
  const [locale, setLocale] = useState<SupportedLocale>('fa');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalTemplate, setActiveModalTemplate] = useState<ValidatedTemplateSpec | null>(
    null
  );

  const isRtl = locale === 'fa' || locale === 'ar';

  const filteredTemplates = INITIAL_MASTER_TEMPLATES.filter((tpl) => {
    const matchesCat = selectedCategory === 'all' || tpl.categorySlug === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCat;
    return (
      matchesCat &&
      (tpl.localizedMeta.fa.title.toLowerCase().includes(q) ||
        tpl.localizedMeta.en.title.toLowerCase().includes(q) ||
        tpl.localizedMeta.fa.subtitle.toLowerCase().includes(q))
    );
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="space-y-14 text-[#1C1B1A]">
      {/* 1. LUXURY HERO SECTION WITH ANIMATED INVITATION PREVIEW */}
      <section className="relative overflow-hidden rounded-3xl border border-[#C5A059]/40 bg-[#1C1B1A] text-[#FAF7F2] shadow-2xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(197,160,89,0.45), transparent 55%), radial-gradient(circle at 80% 80%, rgba(30,77,59,0.55), transparent 60%)',
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-7 sm:p-12">
          <div className="lg:col-span-7 space-y-6">
            {/* Brand & Multilingual Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-[#C5A059]/45 bg-[#C5A059]/15 px-3.5 py-1.5 text-xs font-bold text-[#C5A059]">
                <Crown className="h-4 w-4" />
                <span>INVITÉ • مزون بین‌المللی دعوت‌نامه‌های دیجیتال لوکس</span>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/40 p-1 text-xs">
                <Globe2 className="h-3.5 w-3.5 text-[#C5A059] mx-1.5" />
                {(['fa', 'en', 'ar'] as SupportedLocale[]).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocale(loc)}
                    className={`rounded-lg px-2.5 py-1 font-bold transition ${
                      locale === loc
                        ? 'bg-[#C5A059] text-[#1C1B1A]'
                        : 'text-[#EAE3D5]/75 hover:text-white'
                    }`}
                  >
                    {loc === 'fa'
                      ? 'فارسی (RTL)'
                      : loc === 'en'
                        ? 'English (LTR)'
                        : 'العربية (RTL)'}
                  </button>
                ))}
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-[#FAF7F2]">
              {locale === 'en'
                ? 'Bespoke Digital Invitations Crafted Like Fine Couture Stationery'
                : locale === 'ar'
                  ? 'دعوات رقمية فاخرة مصممة كتحف فنية ملكية'
                  : 'اصالت کاغذ کتان و مهر موم طلایی، در قالب یک تجربه دیجیتال فراموش‌نشدنی'}
            </h1>

            <p className="text-sm sm:text-base leading-relaxed text-[#EAE3D5]/80 max-w-2xl">
              {locale === 'en'
                ? 'Combining physical 3D brushed-gold wax seals, 9-scene GSAP choreography, and a full Konva visual design studio backed by Cloud SQL PostgreSQL.'
                : 'ترکیب پاکت‌های مخمل با مهر موم سه‌بعدی طلایی (Three.js PBR)، کارگردانی سینمایی ۹ صحنه‌ای (GSAP)، استودیوی طراحی بصری Konva و سیستم مدیریت مهمانان با توکن اختصاصی.'}
            </p>

            {/* Color Token Palette Strip */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {[
                { hex: '#FAF7F2', label: 'Warm Ivory' },
                { hex: '#C5A059', label: 'Champagne Gold' },
                { hex: '#1C1B1A', label: 'Deep Charcoal' },
                { hex: '#1E4D3B', label: 'Muted Emerald' },
                { hex: '#EAE3D5', label: 'Soft Beige' },
              ].map((sw) => (
                <div
                  key={sw.hex}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-2.5 py-1 text-[11px]"
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span className="font-mono text-[#EAE3D5]">{sw.label}</span>
                </div>
              ))}
            </div>

            {/* Hero Primary CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onSelectTemplateForStudio(INITIAL_MASTER_TEMPLATES[0], locale)}
                className="flex items-center gap-2 rounded-xl bg-[#C5A059] px-6 py-3.5 text-sm font-extrabold text-[#1C1B1A] shadow-xl hover:bg-[#d4b16a] transition"
              >
                <Wand2 className="h-4 w-4" />
                <span>ورود به استودیوی طراحی (Konva Studio)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectTemplateForCinematic(INITIAL_MASTER_TEMPLATES[0], locale)}
                className="flex items-center gap-2 rounded-xl border border-[#C5A059]/50 bg-[#1E4D3B] px-6 py-3.5 text-sm font-bold text-[#FAF7F2] hover:bg-[#1E4D3B]/80 transition"
              >
                <Eye className="h-4 w-4 text-[#C5A059]" />
                <span>مشاهده تجربه سینمایی ۹ صحنه‌ای</span>
              </button>
            </div>
          </div>

          {/* Right Live Animated Invitation Card Preview */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative rounded-2xl border-2 border-[#C5A059]/50 bg-[#141312] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.85)]">
              <TemplateSchemaRenderer
                template={INITIAL_MASTER_TEMPLATES[0]}
                locale={locale}
                scale={0.5}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#EAE3D5]/75 px-1">
                <span className="font-bold text-[#C5A059]">
                  {INITIAL_MASTER_TEMPLATES[0].localizedMeta[locale].title}
                </span>
                <span className="font-mono text-[11px]">Royal Edition</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TEMPLATE MARKETPLACE WITH CATEGORY FILTER, SEARCH & LIVE PREVIEW */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1C1B1A]/10 pb-5">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E4D3B]">
              INVITÉ CURATED COLLECTION
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1C1B1A]">
              مارکت‌پلیس قالب‌های دعوت‌نامه دیجیتال (۵ معماری متمایز)
            </h2>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 text-[#1C1B1A]/50 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا سبک قالب..."
                className="rounded-xl border border-[#1C1B1A]/20 bg-white pr-9 pl-3.5 py-2 text-xs font-medium text-[#1C1B1A] focus:border-[#C5A059] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { slug: 'all', label: 'همه سبک‌ها (۵)' },
                { slug: 'wedding', label: 'عروسی سلطنتی ایرانی' },
                { slug: 'minimal', label: 'مینیمال عاجی' },
                { slug: 'emerald-luxury', label: 'زمردی مجلل' },
                { slug: 'floral-romantic', label: 'گل‌آرایی رمانتیک' },
                { slug: 'birthday', label: 'تولد مدرن' },
              ].map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    selectedCategory === cat.slug
                      ? 'bg-[#1C1B1A] text-[#FAF7F2] shadow'
                      : 'border border-[#1C1B1A]/15 bg-[#EAE3D5]/60 text-[#1C1B1A] hover:border-[#C5A059]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5 Distinct Master Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
          {filteredTemplates.map((tpl) => (
            <article
              key={tpl.id}
              className="group flex flex-col justify-between rounded-2xl border border-[#C5A059]/35 bg-[#FAF7F2] p-5 shadow-md hover:shadow-xl transition"
            >
              <div>
                {/* Live Scaled Schema Preview */}
                <div className="relative flex justify-center overflow-hidden rounded-xl border border-[#1C1B1A]/10 bg-[#1C1B1A] py-4">
                  <TemplateSchemaRenderer template={tpl} locale={locale} scale={0.44} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="rounded-md border border-[#C5A059]/40 bg-[#EAE3D5] px-2.5 py-0.5 text-[11px] font-bold text-[#1C1B1A]">
                    {tpl.categorySlug.toUpperCase()}
                  </span>
                  <span className="text-sm font-extrabold text-[#1E4D3B]">
                    {tpl.priceToman.toLocaleString('fa-IR')} تومان{' '}
                    <span className="text-xs font-normal text-[#1C1B1A]/60">(${tpl.priceUsd})</span>
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-extrabold text-[#1C1B1A]">
                  {tpl.localizedMeta[locale].title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#1C1B1A]/75">
                  {tpl.localizedMeta[locale].subtitle}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 pt-3 border-t border-[#1C1B1A]/10">
                <button
                  type="button"
                  onClick={() => setActiveModalTemplate(tpl)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#1C1B1A]/20 bg-white py-2.5 text-xs font-bold text-[#1C1B1A] hover:border-[#C5A059]"
                >
                  <Eye className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>جزئیات</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTemplateForCinematic(tpl, locale)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#1E4D3B] py-2.5 text-xs font-bold text-[#FAF7F2] hover:bg-[#1E4D3B]/90"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span>سینمایی</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTemplateForStudio(tpl, locale)}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#1C1B1A] py-2.5 text-xs font-bold text-[#FAF7F2] hover:bg-[#C5A059] hover:text-[#1C1B1A] transition"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>ویرایش</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS & TRANSPARENT PRICING SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-3xl border border-[#C5A059]/35 bg-[#EAE3D5]/65 p-7 sm:p-10">
        <div className="lg:col-span-7 space-y-4">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#1E4D3B]">
            ARCHITECTURE & WORKFLOW
          </span>
          <h3 className="text-2xl font-extrabold text-[#1C1B1A]">
            معماری مهندسی‌شده از استودیوی طراحی تا درگاه پرداخت و لینک اختصاصی
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-2xl border border-[#1C1B1A]/10 bg-[#FAF7F2] p-4">
              <Layers className="h-5 w-5 text-[#C5A059] mb-2" />
              <h4 className="text-xs font-extrabold text-[#1C1B1A]">۱. شخصی‌سازی در بوم Konva</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1C1B1A]/75">
                تغییر متن‌ها، چیدمان، فونت‌های فارسی/لاتین و ذخیره خودکار در PostgreSQL بدون تغییر
                در قالب مادر.
              </p>
            </div>
            <div className="rounded-2xl border border-[#1C1B1A]/10 bg-[#FAF7F2] p-4">
              <Music className="h-5 w-5 text-[#1E4D3B] mb-2" />
              <h4 className="text-xs font-extrabold text-[#1C1B1A]">
                ۲. کارگردانی صوتی و مهر ۳بعدی
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1C1B1A]/75">
                انتخاب موسیقی متن با Fade-In نرم و همگام‌سازی افکت شکستن مهر موم طلایی با ۹ صحنه
                GSAP.
              </p>
            </div>
            <div className="rounded-2xl border border-[#1C1B1A]/10 bg-[#FAF7F2] p-4">
              <ShieldCheck className="h-5 w-5 text-[#C5A059] mb-2" />
              <h4 className="text-xs font-extrabold text-[#1C1B1A]">
                ۳. توکن یکتای مهمان و RSVP امن
              </h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1C1B1A]/75">
                ارسال لینک اختصاصی برای هر مهمان با خوش‌آمدگویی شخصی و حفظ کامل محرمانگی لیست
                مهمانان.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="lg:col-span-5 rounded-2xl border-2 border-[#C5A059] bg-[#1C1B1A] p-6 text-[#FAF7F2] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-md bg-[#C5A059] px-2.5 py-1 text-[11px] font-extrabold text-[#1C1B1A]">
                تعرفه پایه مصوب
              </span>
              <span className="font-mono text-xs text-[#C5A059]">Zarinpal / Zibal / Stripe</span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#FAF7F2]">۵۰٬۰۰۰ تومان</span>
              <span className="text-xs text-[#EAE3D5]/70">/ به ازای هر دعوت‌نامه ($29 Global)</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-[#EAE3D5]/85">
              {[
                'لینک اختصاصی دائمی مبتنی بر مسیر (/i/:slug)',
                'موتور بازگشایی سینمایی ۹ صحنه‌ای + مهر موم ۳بعدی',
                'توکن‌های اختصاصی نامحدود برای مهمانان و فرم RSVP',
                'قابل تغییر لحظه‌ای از ماژول ۱۴ پنل مدیریت ادمین',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#C5A059] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onSelectTemplateForStudio(INITIAL_MASTER_TEMPLATES[0], locale)}
            className="mt-6 w-full rounded-xl bg-[#C5A059] py-3 text-xs font-extrabold text-[#1C1B1A] hover:bg-[#d4b16a]"
          >
            ساخت دعوت‌نامه با این تعرفه
          </button>
        </div>
      </section>

      {/* Template Details Modal */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-w-3xl w-full rounded-2xl border border-[#C5A059] bg-[#1C1B1A] p-6 text-[#FAF7F2] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#C5A059]">
                  {activeModalTemplate.localizedMeta[locale].title}
                </h3>
                <p className="text-xs text-[#EAE3D5]/70">
                  اسلاگ: {activeModalTemplate.slug} • تعداد لایه‌های قابل ویرایش:{' '}
                  {activeModalTemplate.elements.length} لایه
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTemplate(null)}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
              >
                بستن ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="flex justify-center rounded-xl bg-black/40 p-3">
                <TemplateSchemaRenderer
                  template={activeModalTemplate}
                  locale={locale}
                  scale={0.45}
                />
              </div>
              <div className="space-y-4 text-xs">
                <p className="leading-relaxed text-[#EAE3D5]/85">
                  {activeModalTemplate.localizedMeta[locale].subtitle}
                </p>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-1.5">
                  <p>
                    <strong className="text-[#C5A059]">سبک پاکت:</strong>{' '}
                    {activeModalTemplate.openingSequence.envelopeStyle}
                  </p>
                  <p>
                    <strong className="text-[#C5A059]">مونوگرام مهر موم:</strong>{' '}
                    {activeModalTemplate.openingSequence.waxSealMonogram}
                  </p>
                  <p>
                    <strong className="text-[#C5A059]">زبان‌های پشتیبانی‌شده:</strong> فارسی (RTL)،
                    English (LTR)، العربية (RTL)
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = activeModalTemplate;
                      setActiveModalTemplate(null);
                      onSelectTemplateForStudio(tpl, locale);
                    }}
                    className="flex-1 rounded-xl bg-[#C5A059] py-2.5 font-bold text-[#1C1B1A]"
                  >
                    ویرایش در استودیو Konva
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const tpl = activeModalTemplate;
                      setActiveModalTemplate(null);
                      onSelectTemplateForCinematic(tpl, locale);
                    }}
                    className="flex-1 rounded-xl border border-[#C5A059] py-2.5 font-bold text-[#C5A059]"
                  >
                    پخش سینمایی ۹ صحنه‌ای
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
