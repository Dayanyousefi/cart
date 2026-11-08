import React, { useEffect, useState, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Upload,
  Play,
  Square,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Sliders,
} from 'lucide-react';
import {
  INITIAL_MASTER_TEMPLATES,
  type ValidatedTemplateSpec,
  type SupportedLocale,
} from '../template-engine/template-schema';
import { CinematicExperienceEngine } from '../cinematic-engine/CinematicExperienceEngine';
import {
  inviteAudio,
  BUILTIN_MUSIC_LIBRARY,
  BUILTIN_SFX_LIBRARY,
  type CeremonySfxType,
} from '../audio-engine/web-audio-synth';

interface GuestExperienceProps {
  activeTemplate?: ValidatedTemplateSpec;
  locale?: SupportedLocale;
}

interface PersonalizedGuestInfo {
  guestName: string;
  salutation: string;
  maxAllowedGuests: number;
  vipTier: string;
  token: string;
  tokenStatus: string;
}

export const GuestExperienceView: React.FC<GuestExperienceProps> = ({
  activeTemplate = INITIAL_MASTER_TEMPLATES[0],
  locale = 'fa',
}) => {
  // Tokenized Guest Experience State
  const [selectedToken, setSelectedToken] = useState<string>('inv_tok_sepehri');
  const [personalizedGuest, setPersonalizedGuest] = useState<PersonalizedGuestInfo | null>(null);
  const [eventData, setEventData] = useState<{
    id: number;
    slug: string;
    title: string;
    hostNames: string;
    eventDateDisplay: string;
    venueName: string;
    venueAddress: string;
    isPublished: boolean;
  } | null>(null);
  const [publicStats, setPublicStats] = useState<{
    totalResponses: number;
    attendingGuestsCount: number;
  }>({ totalResponses: 2, attendingGuestsCount: 4 });

  // Audio Module State
  const [selectedMusicSlug, setSelectedMusicSlug] = useState<string>(BUILTIN_MUSIC_LIBRARY[0].slug);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.75);
  const [fadeInMs, setFadeInMs] = useState<number>(2500);
  const [fadeOutMs, setFadeOutMs] = useState<number>(1800);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);
  const audioUploadRef = useRef<HTMLInputElement | null>(null);

  // RSVP Form State
  const [respondentName, setRespondentName] = useState<string>('دکتر سهراب سپهری و بانو');
  const [attendanceStatus, setAttendanceStatus] = useState<'attending' | 'maybe' | 'declined'>(
    'attending'
  );
  const [guestCount, setGuestCount] = useState<number>(2);
  const [dietaryPreference, setDietaryPreference] = useState<string>('پذیرایی کامل سلطنتی (معمول)');
  const [valetParking, setValetParking] = useState<string>('بله، لطفاً رزرو شود');
  const [messageToHosts, setMessageToHosts] = useState<string>('');
  const [rsvpSubmitted, setRsvpSubmitted] = useState<boolean>(false);
  const [submittingRsvp, setSubmittingRsvp] = useState<boolean>(false);

  // Fetch Public Invitation & Tokenized Guest Greeting from PostgreSQL
  useEffect(() => {
    let active = true;
    const loadGuestView = async () => {
      try {
        const query = selectedToken ? `?token=${encodeURIComponent(selectedToken)}` : '';
        const res = await fetch(`/api/v1/invite/guest-view/royal-niavaran-1405${query}`);
        if (!res.ok) return;
        const json = await res.json();
        if (!active || !json.data) return;

        setEventData(json.data.event);
        setPersonalizedGuest(json.data.personalizedGuest);
        setPublicStats(json.data.publicStats);
        if (json.data.personalizedGuest) {
          setRespondentName(json.data.personalizedGuest.guestName);
          setGuestCount(Math.min(2, json.data.personalizedGuest.maxAllowedGuests));
        }
      } catch {
        // Fallback safely
      }
    };
    void loadGuestView();
    return () => {
      active = false;
    };
  }, [selectedToken]);

  // Audio Controls
  const handleToggleMusicPreview = (trackSlug?: string) => {
    const targetSlug = trackSlug || selectedMusicSlug;
    if (isPlayingMusic && targetSlug === selectedMusicSlug) {
      inviteAudio.stopMusic(fadeOutMs / 1000);
      setIsPlayingMusic(false);
    } else {
      setSelectedMusicSlug(targetSlug);
      inviteAudio.startMusic(targetSlug, { volume, fadeInSeconds: fadeInMs / 1000 });
      setIsPlayingMusic(true);
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    inviteAudio.setVolume(nextVol);
  };

  const handleUserAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedAudioName(file.name);
    const objectUrl = URL.createObjectURL(file);
    inviteAudio.startMusic(selectedMusicSlug, {
      volume,
      fadeInSeconds: fadeInMs / 1000,
      customDataUrl: objectUrl,
    });
    setIsPlayingMusic(true);
  };

  // Host Publish / Unpublish Invitation Toggle
  const handleTogglePublishEvent = async () => {
    if (!eventData) return;
    const nextState = !eventData.isPublished;
    try {
      const res = await fetch(`/api/v1/invite/events/${eventData.id}/toggle-publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });
      if (res.ok) {
        const json = await res.json();
        setEventData(json.data);
      }
    } catch {
      // Ignore error
    }
  };

  // Submit RSVP to PostgreSQL
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondentName.trim()) return;
    setSubmittingRsvp(true);
    try {
      const res = await fetch('/api/v1/invite/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData?.id ?? 1,
          token: selectedToken || undefined,
          respondentName,
          attendanceStatus,
          guestCount,
          dietaryNotes: dietaryPreference,
          customAnswersJson: {
            dietary_pref: dietaryPreference,
            valet_parking: valetParking,
          },
          messageToHosts,
        }),
      });
      if (res.ok) {
        setRsvpSubmitted(true);
        setPublicStats((prev) => ({
          totalResponses: prev.totalResponses + 1,
          attendingGuestsCount:
            prev.attendingGuestsCount + (attendanceStatus === 'attending' ? guestCount : 0),
        }));
      }
    } finally {
      setSubmittingRsvp(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-8">
      {/* TOP TOKENIZED GUEST BAR & HOST PUBLISH CONTROL */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C5A059]/35 bg-[#1C1B1A] p-5 text-[#FAF7F2] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C5A059]/40 bg-[#C5A059]/15 text-[#C5A059]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#FAF7F2]">
                شبیه‌ساز توکن اختصاصی مهمان و حریم خصوصی (Personalized Guest Token)
              </h2>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                لیست مهمانان کاملاً محرمانه
              </span>
            </div>
            <p className="text-xs text-[#EAE3D5]/70">
              هر مهمان تنها با توکن یکتای خود پیام خوش‌آمدگویی شخصی‌سازی‌شده را می‌بیند و لیست سایر
              مهمانان هرگز در صفحه عمومی افشا نمی‌شود.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="انتخاب توکن اختصاصی مهمان"
            value={selectedToken}
            onChange={(e) => {
              setSelectedToken(e.target.value);
              setRsvpSubmitted(false);
            }}
            className="rounded-xl border border-[#C5A059]/50 bg-black/40 px-3.5 py-2 text-xs font-semibold text-[#FAF7F2]"
          >
            <option value="inv_tok_sepehri">
              توکن ۱: دکتر سهراب سپهری و بانو (VIP Royal — سقف ۴ نفر)
            </option>
            <option value="inv_tok_radmehr">
              توکن ۲: سرکار خانم آناهیتا رادمهر (VIP — سقف ۲ نفر)
            </option>
            <option value="inv_tok_tabesh">
              توکن ۳: مهندس امیرحسین تابش (Standard — سقف ۳ نفر)
            </option>
            <option value="">لینک عمومی بدون توکن (مهمان عمومی)</option>
          </select>

          <button
            type="button"
            onClick={handleTogglePublishEvent}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
              eventData?.isPublished !== false
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
            }`}
          >
            {eventData?.isPublished !== false ? (
              <>
                <Eye className="h-4 w-4" />
                <span>وضعیت دعوت‌نامه: منتشرشده (Published)</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>وضعیت دعوت‌نامه: متوقف‌شده (Unpublished)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 1. THE 9-SCENE CINEMATIC OPENING ENGINE (GSAP + Three.js 3D Wax Seal) */}
      {eventData?.isPublished === false ? (
        <div className="rounded-2xl border border-amber-500/40 bg-[#1C1B1A] p-12 text-center text-[#FAF7F2]">
          <EyeOff className="mx-auto mb-3 h-10 w-10 text-amber-400" />
          <h3 className="text-lg font-bold">این دعوت‌نامه موقتاً توسط میزبان غیرفعال شده است</h3>
          <p className="mt-1 text-xs text-[#EAE3D5]/70">
            میزبان می‌تواند در هر زمان از نوار بالا دکمه «انتشار دعوت‌نامه» را فعال کند.
          </p>
        </div>
      ) : (
        <CinematicExperienceEngine
          template={activeTemplate}
          locale={locale}
          guestHonorificName={
            personalizedGuest
              ? personalizedGuest.salutation
              : 'مهمان گرامی، حضور ارزشمندتان مایه مباهات ماست'
          }
        />
      )}

      {/* 2. AUDIO STUDIO & CEREMONY SOUND EFFECTS MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-2xl border border-[#C5A059]/30 bg-[#1C1B1A] p-6 text-[#FAF7F2] shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Music className="h-5 w-5 text-[#C5A059]" />
              <div>
                <h3 className="text-sm font-bold text-[#FAF7F2]">
                  کتابخانه موسیقی پس‌زمینه و کنترل صدا (INVITÉ Audio Studio)
                </h3>
                <p className="text-[11px] text-[#EAE3D5]/65">
                  پشتیبانی از قوانین Autoplay مرورگر، کنترل Fade-In / Fade-Out و آپلود فایل صوتی
                  مهماندار
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggleMusicPreview()}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isPlayingMusic
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-[#C5A059] text-[#1C1B1A]'
              }`}
            >
              {isPlayingMusic ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>توقف موسیقی (Fade Out)</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>پخش پیش‌نمایش (Fade In)</span>
                </>
              )}
            </button>
          </div>

          {/* Built-in Luxury Tracks */}
          <div className="space-y-2 mb-5">
            {BUILTIN_MUSIC_LIBRARY.map((track) => {
              const isSelected = selectedMusicSlug === track.slug;
              return (
                <div
                  key={track.slug}
                  onClick={() => handleToggleMusicPreview(track.slug)}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition ${
                    isSelected
                      ? 'border-[#C5A059] bg-[#C5A059]/15'
                      : 'border-white/10 bg-black/25 hover:border-white/25'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[#FAF7F2]">{track.titleFa}</p>
                    <p className="text-[11px] text-[#EAE3D5]/65">
                      {track.titleEn} • {track.category}
                    </p>
                  </div>
                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-mono text-[#C5A059]">
                    {Math.floor(track.durationSeconds / 60)}:
                    {String(track.durationSeconds % 60).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Volume, Fade-In, Fade-Out & User Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 mb-4">
            <div>
              <label className="flex items-center justify-between text-[11px] text-[#EAE3D5]/75 mb-1">
                <span className="flex items-center gap-1">
                  {volume > 0 ? (
                    <Volume2 className="h-3.5 w-3.5 text-[#C5A059]" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  بلندی صدا
                </span>
                <span className="font-mono text-[#C5A059]">{Math.round(volume * 100)}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-[11px] text-[#EAE3D5]/75 mb-1">
                <span>Fade-In</span>
                <span className="font-mono text-[#C5A059]">{fadeInMs}ms</span>
              </label>
              <input
                type="range"
                min={500}
                max={5000}
                step={500}
                value={fadeInMs}
                onChange={(e) => setFadeInMs(Number(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-[11px] text-[#EAE3D5]/75 mb-1">
                <span>Fade-Out</span>
                <span className="font-mono text-[#C5A059]">{fadeOutMs}ms</span>
              </label>
              <input
                type="range"
                min={500}
                max={4000}
                step={500}
                value={fadeOutMs}
                onChange={(e) => setFadeOutMs(Number(e.target.value))}
                className="w-full accent-[#C5A059]"
              />
            </div>
          </div>

          {/* Custom Audio Upload */}
          <div className="flex items-center justify-between rounded-xl border border-dashed border-[#C5A059]/40 bg-[#C5A059]/10 p-3">
            <div className="text-xs">
              <p className="font-bold text-[#C5A059]">
                {uploadedAudioName
                  ? `فایل آپلودشده: ${uploadedAudioName}`
                  : 'آپلود موسیقی اختصاصی میزبان (MP3 / WAV)'}
              </p>
              <p className="text-[11px] text-[#EAE3D5]/70">
                پخش ایمن پس از اولین تعامل کاربر مطابق استانداردهای مرورگر
              </p>
            </div>
            <button
              type="button"
              onClick={() => audioUploadRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-[#C5A059] px-3 py-1.5 text-xs font-bold text-[#1C1B1A]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>انتخاب فایل صوتی</span>
            </button>
            <input
              ref={audioUploadRef}
              type="file"
              accept="audio/*"
              onChange={handleUserAudioUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Tactile Paper & Wax Seal Sound Effects Pad */}
        <div className="lg:col-span-6 rounded-2xl border border-[#C5A059]/30 bg-[#1C1B1A] p-6 text-[#FAF7F2] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-white/10 pb-4 mb-4">
              <Sliders className="h-5 w-5 text-[#C5A059]" />
              <div>
                <h3 className="text-sm font-bold text-[#FAF7F2]">
                  افکت‌های صوتی لمسی پاکت، موم و کاغذ کتان (Tactile Sound Effects)
                </h3>
                <p className="text-[11px] text-[#EAE3D5]/65">
                  همگام‌سازی خودکار با ۹ صحنه موتور سینمایی؛ برای تست هر افکت کلیک کنید
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BUILTIN_SFX_LIBRARY.map((sfx) => (
                <button
                  key={sfx.id}
                  type="button"
                  onClick={() => inviteAudio.playSfx(sfx.id as CeremonySfxType)}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-right hover:border-[#C5A059] hover:bg-[#C5A059]/10 transition"
                >
                  <div>
                    <p className="text-xs font-bold text-[#FAF7F2]">{sfx.titleFa}</p>
                    <p className="text-[10px] font-mono text-[#C5A059]">{sfx.sceneTriggerFa}</p>
                  </div>
                  <Volume2 className="h-4 w-4 text-[#C5A059]" />
                </button>
              ))}
            </div>
          </div>

          {/* Event Countdown & Venue Location Summary Card */}
          <div className="mt-5 rounded-xl border border-[#C5A059]/30 bg-[#151413] p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#FAF7F2]">زمان برگزاری مراسم:</p>
                  <p className="text-[#EAE3D5]/80">
                    {eventData?.eventDateDisplay || 'پنج‌شنبه ۲۴ اردیبهشت ۱۴۰۵ — ساعت ۱۹:۳۰'}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 rounded bg-[#C5A059]/15 px-2 py-0.5 text-[11px] font-bold text-[#C5A059]">
                    <Clock className="h-3 w-3" />
                    <span>شمارش معکوس: ۲۸ روز و ۱۴ ساعت مانده</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#C5A059] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-[#FAF7F2]">مکان و مسیریابی عمارت:</p>
                  <p className="text-[#EAE3D5]/80">
                    {eventData?.venueName || 'عمارت تاریخی باغ فردوس نیاوران، تالار آینه'}
                  </p>
                  <p className="text-[11px] text-[#EAE3D5]/60 mt-0.5">
                    {eventData?.venueAddress || 'تهران، خیابان ولیعصر، نرسیده به میدان تجریش'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GUEST RSVP FORM WITH CUSTOM QUESTIONS & ATTENDANCE STATUS */}
      <div className="rounded-2xl border border-[#C5A059]/40 bg-[#FAF7F2] p-6 sm:p-8 text-[#1C1B1A] shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1C1B1A]/10 pb-5 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E4D3B]">
              <Sparkles className="h-4 w-4 text-[#C5A059]" />
              کارت ثبت پاسخ حضور مهمان (Official RSVP & Custom Questions)
            </span>
            <h3 className="mt-1 text-xl font-bold text-[#1C1B1A]">
              {personalizedGuest ? personalizedGuest.salutation : 'تایید حضور در مراسم سلطنتی'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#C5A059]/40 bg-[#EAE3D5]/70 px-3.5 py-2 text-xs">
              <span className="text-[#1C1B1A]/70">تعداد کل مهمانان تاییدشده تا این لحظه: </span>
              <strong className="text-[#1E4D3B] font-bold">
                {publicStats.attendingGuestsCount} نفر
              </strong>
            </div>
          </div>
        </div>

        {rsvpSubmitted ? (
          <div className="rounded-2xl border border-[#1E4D3B]/30 bg-[#1E4D3B]/10 p-6 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[#1E4D3B]" />
            <h4 className="text-base font-bold text-[#1E4D3B]">
              پاسخ حضور شما با موفقیت در پایگاه داده PostgreSQL ثبت گردید
            </h4>
            <p className="mt-1 text-xs text-[#1C1B1A]/80">
              نام ثبت‌شده: <strong>{respondentName}</strong> • تعداد همراهان:{' '}
              <strong>{attendanceStatus === 'declined' ? 0 : guestCount} نفر</strong> • رژیم غذایی:{' '}
              <strong>{dietaryPreference}</strong>
            </p>
            <button
              type="button"
              onClick={() => setRsvpSubmitted(false)}
              className="mt-4 rounded-xl bg-[#1C1B1A] px-4 py-2 text-xs font-bold text-[#FAF7F2]"
            >
              ویرایش پاسخ حضور
            </button>
          </div>
        ) : (
          <form onSubmit={handleRsvpSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  نام و نام خانوادگی مهمان (یا خانواده محترم):
                </label>
                <input
                  type="text"
                  required
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="w-full rounded-xl border border-[#1C1B1A]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C1B1A] focus:border-[#C5A059] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  وضعیت حضور در مراسم (Attendance Status):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'attending', label: 'با کمال میل حضور دارم' },
                    { id: 'maybe', label: 'هنوز مطمئن نیستم' },
                    { id: 'declined', label: 'متاسفانه قادر به حضور نیستم' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        setAttendanceStatus(opt.id as 'attending' | 'maybe' | 'declined')
                      }
                      className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                        attendanceStatus === opt.id
                          ? 'border-[#1E4D3B] bg-[#1E4D3B] text-[#FAF7F2]'
                          : 'border-[#1C1B1A]/15 bg-white text-[#1C1B1A]/80 hover:border-[#C5A059]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  تعداد نفرات حاضر (سقف مجاز توکن شما:{' '}
                  {personalizedGuest ? personalizedGuest.maxAllowedGuests : 4} نفر):
                </label>
                <select
                  value={guestCount}
                  disabled={attendanceStatus === 'declined'}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1C1B1A]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C1B1A]"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} نفر
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Host Questions */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  سوال اختصاصی ۱: ترجیحات پذیرایی و رژیم غذایی
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full rounded-xl border border-[#1C1B1A]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C1B1A]"
                >
                  <option value="پذیرایی کامل سلطنتی (معمول)">پذیرایی کامل سلطنتی (معمول)</option>
                  <option value="منوی گیاه‌خواری (Vegetarian)">منوی گیاه‌خواری (Vegetarian)</option>
                  <option value="منوی بدون گلوتن (Gluten-Free)">
                    منوی بدون گلوتن (Gluten-Free)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  سوال اختصاصی ۲: رزرو جایگاه پارکینگ تشریفاتی (VIP Valet)
                </label>
                <select
                  value={valetParking}
                  onChange={(e) => setValetParking(e.target.value)}
                  className="w-full rounded-xl border border-[#1C1B1A]/20 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1C1B1A]"
                >
                  <option value="بله، لطفاً رزرو شود">بله، لطفاً رزرو شود</option>
                  <option value="خیر، نیاز به پارکینگ ندارم">خیر، نیاز به پارکینگ ندارم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1B1A] mb-1.5">
                  یادداشت و دل‌نوشته یادگاری برای میزبانان:
                </label>
                <input
                  type="text"
                  value={messageToHosts}
                  onChange={(e) => setMessageToHosts(e.target.value)}
                  placeholder="آرزوی خوشبختی و شادکامی برای شما..."
                  className="w-full rounded-xl border border-[#1C1B1A]/20 bg-white px-3.5 py-2.5 text-xs text-[#1C1B1A]"
                />
              </div>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#1C1B1A]/10">
              <div className="flex items-center gap-2 text-xs text-[#1C1B1A]/70">
                <ShieldCheck className="h-4 w-4 text-[#1E4D3B]" />
                <span>
                  پاسخ شما به صورت رمزنگاری‌شده فقط برای میزبان مراسم ارسال می‌گردد و برای سایر
                  مهمانان قابل مشاهده نیست.
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingRsvp}
                className="flex items-center gap-2 rounded-xl bg-[#1C1B1A] px-6 py-3 text-xs font-bold text-[#FAF7F2] shadow-lg hover:bg-[#1E4D3B] transition"
              >
                <UserCheck className="h-4 w-4 text-[#C5A059]" />
                <span>
                  {submittingRsvp ? 'در حال ثبت در پایگاه داده...' : 'ثبت نهایی پاسخ حضور (RSVP)'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
