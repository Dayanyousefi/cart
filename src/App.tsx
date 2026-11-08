import { useState } from 'react';
import { Sparkles, Wand2, Play, ShieldCheck, Layout, Crown, CheckCircle2 } from 'lucide-react';
import {
  INITIAL_MASTER_TEMPLATES,
  type ValidatedTemplateSpec,
  type SupportedLocale,
} from './modules/template-engine/template-schema';
import { LuxuryLandingAndMarketplace } from './modules/landing-marketplace/LuxuryLandingAndMarketplace';
import { InvitationStudioEditor } from './modules/studio-editor/InvitationStudioEditor';
import { GuestExperienceView } from './modules/guest-experience/GuestExperienceView';
import { InviteAdminDashboard } from './modules/admin-dashboard/InviteAdminDashboard';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PublicInvitationLayout } from './layouts/PublicInvitationLayout';

type WorkspaceTab = 'landing' | 'studio' | 'cinematic' | 'admin' | 'architecture';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('landing');
  const [selectedTemplate, setSelectedTemplate] = useState<ValidatedTemplateSpec>(
    INITIAL_MASTER_TEMPLATES[0]
  );
  const [selectedLocale, setSelectedLocale] = useState<SupportedLocale>('fa');

  // Legacy Layout Showcase State (Preserved from earlier phases)
  const [legacyLayoutMode, setLegacyLayoutMode] = useState<'public' | 'dashboard'>('public');

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FAF7F2] text-[#1C1B1A] selection:bg-[#C5A059]/30"
    >
      {/* LUXURY MASTER NAVIGATION HEADER */}
      <header className="relative z-40 border-b border-[#C5A059]/35 bg-[#1C1B1A] text-[#FAF7F2] shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C5A059]/50 bg-[#C5A059]/15 text-[#C5A059] shadow-inner">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-wide text-[#FAF7F2]">
                  INVITÉ • ایوان
                </span>
                <span className="rounded border border-[#C5A059]/40 bg-[#C5A059]/15 px-2 py-0.5 text-[10px] font-bold text-[#C5A059]">
                  SaaS Enterprise
                </span>
              </div>
              <p className="text-[11px] text-[#EAE3D5]/70">
                پلتفرم بین‌المللی طراحی و فروش دعوت‌نامه دیجیتال لوکس
              </p>
            </div>
          </div>

          {/* 5 Core Module Switcher Tabs */}
          <nav
            aria-label="ناوبری ماژول‌های اصلی پلتفرم INVITÉ"
            className="flex flex-wrap items-center gap-1.5"
          >
            <button
              type="button"
              onClick={() => setActiveTab('landing')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'landing'
                  ? 'bg-[#C5A059] text-[#1C1B1A] shadow-md'
                  : 'bg-white/5 text-[#EAE3D5]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>۱. ویترین و مارکت‌پلیس قالب‌ها</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'studio'
                  ? 'bg-[#C5A059] text-[#1C1B1A] shadow-md'
                  : 'bg-white/5 text-[#EAE3D5]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>۲. استودیوی طراحی (Konva Studio)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cinematic')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'cinematic'
                  ? 'bg-[#C5A059] text-[#1C1B1A] shadow-md'
                  : 'bg-white/5 text-[#EAE3D5]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>۳. تجربه سینمایی ۹ صحنه‌ای و مهمان</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'admin'
                  ? 'bg-[#C5A059] text-[#1C1B1A] shadow-md'
                  : 'bg-white/5 text-[#EAE3D5]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>۴. پنل مدیریت (۱۴ ماژول)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'architecture'
                  ? 'bg-[#C5A059] text-[#1C1B1A] shadow-md'
                  : 'bg-white/5 text-[#EAE3D5]/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              <span>۵. پوسته‌های پایه RTL</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN WORKSPACE CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {activeTab === 'landing' && (
          <LuxuryLandingAndMarketplace
            onSelectTemplateForStudio={(tpl, loc) => {
              setSelectedTemplate(tpl);
              setSelectedLocale(loc);
              setActiveTab('studio');
            }}
            onSelectTemplateForCinematic={(tpl, loc) => {
              setSelectedTemplate(tpl);
              setSelectedLocale(loc);
              setActiveTab('cinematic');
            }}
          />
        )}

        {activeTab === 'studio' && (
          <InvitationStudioEditor
            initialTemplate={selectedTemplate}
            onOpenCinematicPreview={(tpl, customElements, loc) => {
              setSelectedTemplate({
                ...tpl,
                elements: customElements,
              });
              setSelectedLocale(loc);
              setActiveTab('cinematic');
            }}
          />
        )}

        {activeTab === 'cinematic' && (
          <GuestExperienceView activeTemplate={selectedTemplate} locale={selectedLocale} />
        )}

        {activeTab === 'admin' && <InviteAdminDashboard />}

        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C5A059]/35 bg-[#1C1B1A] p-5 text-[#FAF7F2]">
              <div>
                <h2 className="text-base font-bold text-[#C5A059]">
                  پوسته‌های استاندارد راست‌به‌چپ (DashboardLayout & PublicInvitationLayout)
                </h2>
                <p className="text-xs text-[#EAE3D5]/70">
                  شامل ۵ سبک پاکت کلاسیک و داشبورد میزبان با تایپوگرافی وزیرمتن
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLegacyLayoutMode('public')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    legacyLayoutMode === 'public'
                      ? 'bg-[#C5A059] text-[#1C1B1A]'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  پوسته کارت دعوت عمومی (۵ پاکت)
                </button>
                <button
                  type="button"
                  onClick={() => setLegacyLayoutMode('dashboard')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold ${
                    legacyLayoutMode === 'dashboard'
                      ? 'bg-[#C5A059] text-[#1C1B1A]'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  پوسته داشبورد میزبان
                </button>
              </div>
            </div>

            {legacyLayoutMode === 'public' ? (
              <PublicInvitationLayout slug="royal-niavaran-1405" />
            ) : (
              <DashboardLayout userName="درسا و کاوه" />
            )}
          </div>
        )}
      </main>

      {/* LUXURY EDITORIAL FOOTER */}
      <footer className="mt-16 border-t border-[#C5A059]/30 bg-[#1C1B1A] py-8 text-xs text-[#EAE3D5]/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-[#C5A059]" />
            <span className="font-bold text-[#FAF7F2]">
              INVITÉ • پلتفرم بین‌المللی دعوت‌نامه‌های دیجیتال لوکس
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cloud SQL PostgreSQL + Drizzle ORM
            </span>
            <span>Konva.js Visual Studio</span>
            <span>GSAP + Three.js 3D Wax Seal</span>
            <span>FA / EN / AR (RTL & LTR)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
