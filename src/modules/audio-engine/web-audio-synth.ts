/**
 * INVITÉ Procedural WebAudio Music & Tactile Sound Effects Engine
 * 100% browser autoplay-compliant, zero-404 external file dependency,
 * with volume control, fade-in/fade-out, and custom user audio file playback.
 */

export type CeremonySfxType =
  | 'WAX_SEAL_CRACK'
  | 'ENVELOPE_FLAP_RUSTLE'
  | 'CARD_EMERGE_SLIDE'
  | 'PAPER_UNFOLD'
  | 'GIFT_BOX_RIBBON'
  | 'BOOKLET_PAGE_TURN';

export interface MusicTrackPreset {
  slug: string;
  titleFa: string;
  titleEn: string;
  category: string;
  durationSeconds: number;
  notesHz: number[];
  tempoMs: number;
  waveType: OscillatorType;
}

export const BUILTIN_MUSIC_LIBRARY: readonly MusicTrackPreset[] = [
  {
    slug: 'persian-santoor-serenade',
    titleFa: 'نغمه سنتور و چنگ ایرانی (اصیل و تشریفاتی)',
    titleEn: 'Persian Santoor & Harp Serenade',
    category: 'Iranian Classical',
    durationSeconds: 145,
    notesHz: [293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 493.88, 440.0],
    tempoMs: 520,
    waveType: 'triangle',
  },
  {
    slug: 'ambient-champagne-piano',
    titleFa: 'پیانو شامپاینی مینیمال (مدرن و آرام)',
    titleEn: 'Ambient Champagne Grand Piano',
    category: 'Modern Minimal',
    durationSeconds: 180,
    notesHz: [261.63, 329.63, 392.0, 493.88, 523.25, 392.0, 329.63, 293.66],
    tempoMs: 680,
    waveType: 'sine',
  },
  {
    slug: 'classical-string-quartet',
    titleFa: 'کوارتت زهی کلاسیک وین (باغ و عمارت)',
    titleEn: 'Royal String Quartet in D Major',
    category: 'Orchestral Luxury',
    durationSeconds: 210,
    notesHz: [293.66, 369.99, 440.0, 587.33, 554.37, 440.0, 369.99, 329.63],
    tempoMs: 600,
    waveType: 'sine',
  },
  {
    slug: 'romantic-evening-waltz',
    titleFa: 'والس شبانه رز و طلا (جشن و سالگرد)',
    titleEn: 'Velvet Rose Evening Waltz',
    category: 'Romantic Waltz',
    durationSeconds: 160,
    notesHz: [220.0, 261.63, 329.63, 440.0, 392.0, 329.63, 293.66, 246.94],
    tempoMs: 460,
    waveType: 'triangle',
  },
] as const;

export const BUILTIN_SFX_LIBRARY: ReadonlyArray<{
  id: CeremonySfxType;
  slug: string;
  titleFa: string;
  titleEn: string;
  sceneTriggerFa: string;
}> = [
  {
    id: 'WAX_SEAL_CRACK',
    slug: 'sfx-wax-seal-crack',
    titleFa: 'صدای شکستن مُهر موم طلایی',
    titleEn: 'Luxury Wax Seal Crisp Fracture',
    sceneTriggerFa: 'صحنه ۲: شکستن مُهر موم',
  },
  {
    id: 'ENVELOPE_FLAP_RUSTLE',
    slug: 'sfx-envelope-flap-rustle',
    titleFa: 'خش‌خش کاغذ کتان هنگام باز شدن پاکت',
    titleEn: 'Cotton Envelope Flap Rustle',
    sceneTriggerFa: 'صحنه ۳: باز شدن درب پاکت',
  },
  {
    id: 'CARD_EMERGE_SLIDE',
    slug: 'sfx-card-emerge-slide',
    titleFa: 'لغزش مخملی بیرون آمدن کارت دعوت',
    titleEn: 'Heavy Cardstock Velvet Glide',
    sceneTriggerFa: 'صحنه ۴: خروج کارت از پاکت',
  },
  {
    id: 'PAPER_UNFOLD',
    slug: 'sfx-paper-unfold',
    titleFa: 'باز شدن تای کاغذ کالک و دعوت‌نامه',
    titleEn: 'Parchment & Vellum Unfold',
    sceneTriggerFa: 'صحنه ۵ و ۶: باز شدن تای کارت',
  },
  {
    id: 'GIFT_BOX_RIBBON',
    slug: 'sfx-gift-box-ribbon',
    titleFa: 'باز شدن گره روبان ابریشمی و جعبه هدیه',
    titleEn: 'Silk Ribbon Untie & Gift Box Lift',
    sceneTriggerFa: 'صحنه ۷: گشودن جعبه هدیه',
  },
  {
    id: 'BOOKLET_PAGE_TURN',
    slug: 'sfx-booklet-page-turn',
    titleFa: 'ورق خوردن دفترچه تشریفاتی مراسم',
    titleEn: 'Ceremonial Booklet Page Turn',
    sceneTriggerFa: 'صحنه ۸: ورق زدن دفترچه',
  },
];

class InviteAudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private intervalId: number | null = null;
  private customAudioElement: HTMLAudioElement | null = null;
  private isPlayingMusic = false;
  private currentVolume = 0.75;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.currentVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudioElement) {
      this.customAudioElement.volume = this.currentVolume;
    }
  }

  public startMusic(
    trackSlug: string,
    options?: { volume?: number; fadeInSeconds?: number; customDataUrl?: string | null }
  ) {
    this.stopMusic(0.1);
    const targetVol = options?.volume ?? this.currentVolume;
    this.currentVolume = targetVol;
    const fadeIn = Math.max(0.1, options?.fadeInSeconds ?? 1.8);

    if (options?.customDataUrl) {
      const audio = new Audio(options.customDataUrl);
      audio.loop = true;
      audio.volume = targetVol;
      this.customAudioElement = audio;
      this.isPlayingMusic = true;
      void audio.play().catch(() => {});
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const preset =
      BUILTIN_MUSIC_LIBRARY.find((t) => t.slug === trackSlug) ?? BUILTIN_MUSIC_LIBRARY[0];

    this.masterGain.gain.cancelScheduledValues(ctx.currentTime);
    this.masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    this.masterGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + fadeIn);

    this.isPlayingMusic = true;
    let noteIndex = 0;

    const playNextNote = () => {
      if (!this.isPlayingMusic || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const freq = preset.notesHz[noteIndex % preset.notesHz.length] ?? 440;
      noteIndex += 1;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = preset.waveType;
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + (preset.tempoMs / 1000) * 1.4);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + (preset.tempoMs / 1000) * 1.45);
    };

    playNextNote();
    this.intervalId = window.setInterval(playNextNote, preset.tempoMs);
  }

  public stopMusic(fadeOutSeconds = 0.8) {
    this.isPlayingMusic = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.customAudioElement) {
      this.customAudioElement.pause();
      this.customAudioElement = null;
    }
    if (this.ctx && this.masterGain && fadeOutSeconds > 0) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeOutSeconds);
    }
  }

  /**
   * Synthesizes realistic tactile stationery & wax seal sound effects.
   */
  public playSfx(type: CeremonySfxType) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    if (type === 'WAX_SEAL_CRACK') {
      // Crisp snap + warm gold chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.14);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
      return;
    }

    if (type === 'GIFT_BOX_RIBBON') {
      // Silky ascending arpeggio chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.2, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.36);
      });
      return;
    }

    // Filtered noise buffer for tactile paper/cardstock rustle & page turn
    const bufferSize = Math.floor(ctx.sampleRate * 0.25);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value =
      type === 'ENVELOPE_FLAP_RUSTLE'
        ? 1100
        : type === 'CARD_EMERGE_SLIDE'
          ? 850
          : type === 'BOOKLET_PAGE_TURN'
            ? 1450
            : 980;
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.24);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(now);
  }
}

export const inviteAudio = new InviteAudioController();
