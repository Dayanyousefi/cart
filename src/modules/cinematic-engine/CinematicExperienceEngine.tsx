import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Play,
  RotateCcw,
  FastForward,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  type ValidatedTemplateSpec,
  type SupportedLocale,
} from '../template-engine/template-schema.ts';
import { TemplateSchemaRenderer } from '../template-engine/TemplateSchemaRenderer.tsx';
import { inviteAudio } from '../audio-engine/web-audio-synth.ts';

export type CinematicSceneId =
  | 'SCENE_1_CLOSED_ENVELOPE'
  | 'SCENE_2_WAX_SEAL_BREAKING'
  | 'SCENE_3_FLAP_OPENING'
  | 'SCENE_4_CARD_EMERGING'
  | 'SCENE_5_CARD_UNFOLDING'
  | 'SCENE_6_PAPER_REVEAL'
  | 'SCENE_7_GIFT_BOX_OPENING'
  | 'SCENE_8_BOOKLET_PAGE_TURNING'
  | 'SCENE_9_FINAL_PRESENTATION';

export interface CinematicSceneDefinition {
  id: CinematicSceneId;
  stepNumber: number;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
}

export const CINEMATIC_SCENES_CATALOG: readonly CinematicSceneDefinition[] = [
  {
    id: 'SCENE_1_CLOSED_ENVELOPE',
    stepNumber: 1,
    titleFa: '۱. پاکت لوکس بسته',
    titleEn: '1. Closed Luxury Envelope',
    descriptionFa: 'نمایش پاکت کتان دست‌ساز با مُهر موم سه بعدی طلایی در حالت آماده به گشودن.',
  },
  {
    id: 'SCENE_2_WAX_SEAL_BREAKING',
    stepNumber: 2,
    titleFa: '۲. شکستن مُهر موم طلایی (3D)',
    titleEn: '2. Wax Seal Breaking',
    descriptionFa: 'باز شدن و شکافته شدن مُهر موم برجسته با افکت صوتی همگام.',
  },
  {
    id: 'SCENE_3_FLAP_OPENING',
    stepNumber: 3,
    titleFa: '۳. باز شدن درب پاکت',
    titleEn: '3. Envelope Flap Opening',
    descriptionFa: 'چرخش سه‌بعدی درب پاکت حول محور بالایی با صدای خش‌خش کاغذ کتان.',
  },
  {
    id: 'SCENE_4_CARD_EMERGING',
    stepNumber: 4,
    titleFa: '۴. بیرون آمدن کارت دعوت',
    titleEn: '4. Invitation Card Emerging',
    descriptionFa: 'خروج نرم و عمودی کارت دعوت از درون جیب پاکت.',
  },
  {
    id: 'SCENE_5_CARD_UNFOLDING',
    stepNumber: 5,
    titleFa: '۵. باز شدن تای کارت',
    titleEn: '5. Folded Card Unfolding',
    descriptionFa: 'گشوده شدن لت‌های تاشده کارت دعوت با انیمیشن GSAP.',
  },
  {
    id: 'SCENE_6_PAPER_REVEAL',
    stepNumber: 6,
    titleFa: '۶. کنار رفتن کاغذ کالک',
    titleEn: '6. Translucent Paper Reveal',
    descriptionFa: 'کنار رفتن لایه محافظ کاغذ کالک نیمه‌شفاف از روی متن زرنگار.',
  },
  {
    id: 'SCENE_7_GIFT_BOX_OPENING',
    stepNumber: 7,
    titleFa: '۷. باز شدن جعبه هدیه و روبان',
    titleEn: '7. Luxury Gift Box Opening',
    descriptionFa: 'باز شدن گره روبان ابریشمی و بلند شدن درب جعبه تشریفاتی.',
  },
  {
    id: 'SCENE_8_BOOKLET_PAGE_TURNING',
    stepNumber: 8,
    titleFa: '۸. ورق خوردن دفترچه مراسم',
    titleEn: '8. Booklet Page Turning',
    descriptionFa: 'ورق زدن صفحات دفترچه راهنمای مراسم و نقشه عمارت.',
  },
  {
    id: 'SCENE_9_FINAL_PRESENTATION',
    stepNumber: 9,
    titleFa: '۹. نمایش نهایی کارت دعوت',
    titleEn: '9. Final Invitation Presentation',
    descriptionFa: 'نمایش کامل و تعاملی کارت دعوت به همراه پخش موسیقی و آمادگی برای ثبت RSVP.',
  },
] as const;

export interface CinematicExperienceEngineProps {
  template: ValidatedTemplateSpec;
  locale?: SupportedLocale;
  guestHonorificName?: string;
  onCompleteToRsvp?: () => void;
}

export const CinematicExperienceEngine: React.FC<CinematicExperienceEngineProps> = ({
  template,
  locale = 'fa',
  guestHonorificName = 'جناب آقای دکتر سهراب سپهری و خانواده محترم',
  onCompleteToRsvp,
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [isAutoPlayingSequence, setIsAutoPlayingSequence] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [durationMultiplier, setDurationMultiplier] = useState<number>(
    template.openingSequence.durationMultiplier || 1.0
  );
  const [easingPreset, setEasingPreset] = useState<'power3.inOut' | 'expo.out' | 'back.out'>(
    template.openingSequence.easingPreset || 'power3.inOut'
  );
  const [audioSynced, setAudioSynced] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  // DOM refs for GSAP choreography
  const stageCardRef = useRef<HTMLDivElement | null>(null);
  const flapRef = useRef<HTMLDivElement | null>(null);
  const emergingCardRef = useRef<HTMLDivElement | null>(null);
  const vellumOverlayRef = useRef<HTMLDivElement | null>(null);
  const ribbonOverlayRef = useRef<HTMLDivElement | null>(null);

  // Dedicated empty ref container for Three.js 3D Brushed-Gold Wax Seal
  const sealCanvasMountRef = useRef<HTMLDivElement | null>(null);
  const trigger3dSealStateRef = useRef<((sceneIdx: number) => void) | null>(null);

  const currentScene = CINEMATIC_SCENES_CATALOG[activeSceneIndex] ?? CINEMATIC_SCENES_CATALOG[0];

  // Initialize Three.js 3D Multi-Part Brushed-Gold Wax Seal with Software-WebGL guard & On-Demand Render
  useEffect(() => {
    const mountEl = sealCanvasMountRef.current;
    if (!mountEl) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let frameId = 0;

    try {
      const isSoftwareGl = (() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      })();

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(150, 150);

      mountEl.innerHTML = '';
      mountEl.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
      camera.position.set(0, 2.3, 3.4);
      camera.lookAt(0, 0, 0);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();

      // 3-Point Warm/Cool Lighting Rig
      const hemiLight = new THREE.HemisphereLight(0xfff6e5, 0x1e293b, 0.9);
      scene.add(hemiLight);

      const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xc5a059, 1.2);
      rimLight.position.set(-3, 2, -3);
      scene.add(rimLight);

      // Composite 5-Part 3D Wax Seal Group (Left Half, Right Half, Outer Bezel Ring, Inner Star Crest, Contact Shadow)
      const sealGroup = new THREE.Group();
      scene.add(sealGroup);

      const goldColor = new THREE.Color(template.openingSequence.waxSealColorHex || '#C5A059');
      const sealMaterial = new THREE.MeshPhysicalMaterial({
        color: goldColor,
        metalness: 0.88,
        roughness: 0.22,
        clearcoat: 0.6,
        clearcoatRoughness: 0.18,
      });

      const bezelMaterial = new THREE.MeshStandardMaterial({
        color: goldColor.clone().multiplyScalar(0.85),
        metalness: 0.92,
        roughness: 0.48,
      });

      // Left & Right Seal Halves (so Scene 2 can physically split them apart!)
      const leftHalfGeo = new THREE.CylinderGeometry(1.05, 1.12, 0.22, 32, 1, false, 0, Math.PI);
      const rightHalfGeo = new THREE.CylinderGeometry(
        1.05,
        1.12,
        0.22,
        32,
        1,
        false,
        Math.PI,
        Math.PI
      );
      const leftHalfMesh = new THREE.Mesh(leftHalfGeo, sealMaterial);
      const rightHalfMesh = new THREE.Mesh(rightHalfGeo, sealMaterial);
      sealGroup.add(leftHalfMesh);
      sealGroup.add(rightHalfMesh);

      // Outer Bezel Torus
      const torusGeo = new THREE.TorusGeometry(0.92, 0.09, 16, 48);
      torusGeo.rotateX(Math.PI / 2);
      const torusMesh = new THREE.Mesh(torusGeo, bezelMaterial);
      torusMesh.position.y = 0.11;
      sealGroup.add(torusMesh);

      // Inner Octagonal Star Emblem (2 crossed boxes)
      const starGeo = new THREE.BoxGeometry(0.95, 0.08, 0.95);
      const starMeshA = new THREE.Mesh(starGeo, bezelMaterial);
      starMeshA.position.y = 0.13;
      const starMeshB = new THREE.Mesh(starGeo, bezelMaterial);
      starMeshB.position.y = 0.13;
      starMeshB.rotation.y = Math.PI / 4;
      sealGroup.add(starMeshA);
      sealGroup.add(starMeshB);

      // Grounding Contact Shadow Plane
      const shadowPlane = new THREE.Mesh(
        new THREE.CircleGeometry(1.35, 32),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.22,
          depthWrite: false,
        })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.14;
      scene.add(shadowPlane);

      let renderBusy = false;
      let renderDirty = false;

      const afterDraw = (cb: () => void) => {
        if (!renderer) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (!gl || typeof gl.fenceSync !== 'function') {
          frameId = window.setTimeout(cb, 80);
          return;
        }
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      };

      const requestRender = () => {
        if (renderBusy || !renderer) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        frameId = requestAnimationFrame(() => {
          renderDirty = false;
          if (renderer) {
            renderer.render(scene, camera);
          }
          const done = () => {
            renderBusy = false;
            if (renderDirty) requestRender();
          };
          if (isSoftwareGl) afterDraw(done);
          else done();
        });
      };

      trigger3dSealStateRef.current = (sceneIdx: number) => {
        if (sceneIdx === 0) {
          leftHalfMesh.position.set(0, 0, 0);
          rightHalfMesh.position.set(0, 0, 0);
          leftHalfMesh.rotation.set(0, 0, 0);
          rightHalfMesh.rotation.set(0, 0, 0);
          sealGroup.scale.set(1, 1, 1);
        } else if (sceneIdx === 1) {
          // Scene 2: Split wax seal halves apart
          leftHalfMesh.position.set(-0.22, 0.08, 0);
          rightHalfMesh.position.set(0.22, 0.08, 0);
          leftHalfMesh.rotation.z = 0.18;
          rightHalfMesh.rotation.z = -0.18;
          sealGroup.scale.set(1.06, 1.06, 1.06);
        } else {
          leftHalfMesh.position.set(-0.35, -0.1, 0);
          rightHalfMesh.position.set(0.35, -0.1, 0);
          sealGroup.scale.set(0.85, 0.85, 0.85);
        }
        requestRender();
      };

      requestRender();
    } catch {
      // Fallback gracefully on environments without WebGL
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [template.openingSequence.waxSealColorHex]);

  // Execute GSAP scene choreography & synchronized WebAudio SFX whenever activeSceneIndex changes
  const runSceneChoreography = useCallback(
    (sceneIdx: number) => {
      trigger3dSealStateRef.current?.(sceneIdx);
      const sceneDef = CINEMATIC_SCENES_CATALOG[sceneIdx] ?? CINEMATIC_SCENES_CATALOG[0];

      // Trigger synchronized physical sound effects
      if (audioSynced) {
        if (sceneDef.id === 'SCENE_2_WAX_SEAL_BREAKING') {
          inviteAudio.playSfx('WAX_SEAL_CRACK');
        } else if (sceneDef.id === 'SCENE_3_FLAP_OPENING') {
          inviteAudio.playSfx('ENVELOPE_FLAP_RUSTLE');
        } else if (sceneDef.id === 'SCENE_4_CARD_EMERGING') {
          inviteAudio.playSfx('CARD_EMERGE_SLIDE');
        } else if (
          sceneDef.id === 'SCENE_5_CARD_UNFOLDING' ||
          sceneDef.id === 'SCENE_6_PAPER_REVEAL'
        ) {
          inviteAudio.playSfx('PAPER_UNFOLD');
        } else if (sceneDef.id === 'SCENE_7_GIFT_BOX_OPENING') {
          inviteAudio.playSfx('GIFT_BOX_RIBBON');
        } else if (sceneDef.id === 'SCENE_8_BOOKLET_PAGE_TURNING') {
          inviteAudio.playSfx('BOOKLET_PAGE_TURN');
        } else if (sceneDef.id === 'SCENE_9_FINAL_PRESENTATION') {
          inviteAudio.startMusic(template.audioConfig.musicTrackSlug, {
            volume: template.audioConfig.volume,
            fadeInSeconds: template.audioConfig.fadeInSeconds,
          });
        }
      }

      const dur = reducedMotion ? 0.05 : 0.65 * durationMultiplier;

      if (stageCardRef.current) {
        gsap.fromTo(
          stageCardRef.current,
          { opacity: 0.82, y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : 0.985 },
          { opacity: 1, y: 0, scale: 1, duration: dur, ease: easingPreset }
        );
      }

      if (flapRef.current) {
        const targetRotX = sceneIdx >= 2 ? 175 : sceneIdx === 1 ? 25 : 0;
        gsap.to(flapRef.current, {
          rotateX: targetRotX,
          duration: dur,
          ease: easingPreset,
        });
      }

      if (emergingCardRef.current) {
        const targetY = sceneIdx >= 3 ? -36 : 0;
        gsap.to(emergingCardRef.current, {
          y: targetY,
          duration: dur,
          ease: easingPreset,
        });
      }

      if (vellumOverlayRef.current) {
        const vellumOpacity = sceneIdx === 5 ? 0.15 : 0.78;
        gsap.to(vellumOverlayRef.current, {
          opacity: vellumOpacity,
          x: sceneIdx === 5 ? 90 : 0,
          duration: dur,
          ease: easingPreset,
        });
      }

      if (ribbonOverlayRef.current) {
        gsap.to(ribbonOverlayRef.current, {
          scale: sceneIdx === 6 ? 1.12 : 1,
          opacity: sceneIdx === 6 ? 0.25 : 1,
          duration: dur,
          ease: easingPreset,
        });
      }
    },
    [
      audioSynced,
      durationMultiplier,
      easingPreset,
      reducedMotion,
      template.audioConfig.fadeInSeconds,
      template.audioConfig.musicTrackSlug,
      template.audioConfig.volume,
    ]
  );

  useEffect(() => {
    runSceneChoreography(activeSceneIndex);
  }, [activeSceneIndex, runSceneChoreography]);

  // Autoplay sequence timer when isAutoPlayingSequence is active
  useEffect(() => {
    if (!isAutoPlayingSequence) return;
    if (activeSceneIndex >= CINEMATIC_SCENES_CATALOG.length - 1) {
      setIsAutoPlayingSequence(false);
      return;
    }
    const stepMs = reducedMotion ? 350 : Math.round(1350 * durationMultiplier);
    const timer = window.setTimeout(() => {
      setActiveSceneIndex((prev) => Math.min(prev + 1, CINEMATIC_SCENES_CATALOG.length - 1));
    }, stepMs);
    return () => clearTimeout(timer);
  }, [activeSceneIndex, durationMultiplier, isAutoPlayingSequence, reducedMotion]);

  const handlePlayFullSequence = () => {
    if (activeSceneIndex >= CINEMATIC_SCENES_CATALOG.length - 1) {
      setActiveSceneIndex(0);
    }
    setIsAutoPlayingSequence(true);
  };

  const handleReplay = () => {
    setIsAutoPlayingSequence(false);
    inviteAudio.stopMusic(0.3);
    setActiveSceneIndex(0);
  };

  const handleSkipToFinal = () => {
    setIsAutoPlayingSequence(false);
    setActiveSceneIndex(CINEMATIC_SCENES_CATALOG.length - 1);
  };

  const meta = template.localizedMeta[locale];

  return (
    <div className="relative min-h-[760px] rounded-3xl bg-[#181615] text-[#FAF7F2] overflow-hidden border border-[#C5A059]/30 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Minimal Spec & Guest Honorific Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#C5A059] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>موتور سینمایی ۹ صحنه‌ای INVITÉ (GSAP + Three.js PBR)</span>
          </div>
          <p className="text-xs sm:text-sm text-[#EAE3D5]">
            خوش‌آمدگویی اختصاصی مهمان: <strong className="text-white">{guestHonorificName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !audioSynced;
              setAudioSynced(next);
              if (!next) inviteAudio.stopMusic(0.3);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border cursor-pointer ${
              audioSynced
                ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50'
                : 'bg-white/5 text-slate-300 border-white/15'
            }`}
          >
            {audioSynced ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{audioSynced ? 'همگام‌سازی صوتی فعال' : 'صدا غیرفعال'}</span>
          </button>

          <button
            type="button"
            onClick={handleSkipToFinal}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>رد کردن انیمیشن (Skip)</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>پخش مجدد (Replay)</span>
          </button>
        </div>
      </div>

      {/* Central Unobstructed Cinematic Stage */}
      <div className="my-6 flex-1 flex flex-col items-center justify-center">
        <div
          ref={stageCardRef}
          className="w-full max-w-2xl rounded-2xl bg-[#23201E] border border-[#C5A059]/35 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-6"
        >
          {/* Current Scene Header Badge */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-[#C5A059] text-[#1C1B1A] text-xs font-extrabold">
              {currentScene.titleFa}
            </span>
            <span className="text-xs text-[#C5BEB0] font-mono">{currentScene.titleEn}</span>
          </div>

          <p className="text-xs sm:text-sm text-[#EAE3D5] max-w-lg">{currentScene.descriptionFa}</p>

          {/* Interactive Visual Stage for Scenes 1 to 8 vs Scene 9 Final Presentation */}
          {activeSceneIndex < 8 ? (
            <div className="w-full max-w-md relative pt-4 pb-2 flex flex-col items-center">
              {/* Envelope & Emerging Card Architecture */}
              <div className="relative w-full rounded-2xl bg-[#FAF7F2] text-[#1C1B1A] border-2 border-[#C5A059]/60 p-6 pt-14 shadow-xl overflow-hidden min-h-[340px] flex flex-col items-center justify-between">
                {/* Top 3D Perspective Flap */}
                <div
                  ref={flapRef}
                  style={{
                    transformOrigin: 'top center',
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  }}
                  className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#E6D9C3] to-[#D6C3A5] border-b border-[#C5A059] z-20 flex items-start justify-center pt-3"
                >
                  <span className="text-[11px] font-bold text-[#5C4930] px-8 truncate max-w-full">
                    {meta.openingVerse}
                  </span>
                </div>

                {/* Scene 6 Translucent Vellum Overlay */}
                {activeSceneIndex === 5 && (
                  <div
                    ref={vellumOverlayRef}
                    className="absolute inset-4 z-25 rounded-xl bg-white/85 border border-[#C5A059]/40 flex items-center justify-center p-4 text-xs font-semibold text-amber-900 pointer-events-none"
                  >
                    لایه کاغذ کالک نیمه‌شفاف (Vellum Paper Reveal)
                  </div>
                )}

                {/* Scene 7 Silk Ribbon Overlay */}
                {activeSceneIndex === 6 && (
                  <div
                    ref={ribbonOverlayRef}
                    className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-[#8C2D3E] border-y border-[#C5A059] z-25 flex items-center justify-center text-xs font-bold text-amber-100 pointer-events-none"
                  >
                    گره روبان ابریشمی جعبه هدیه (Gift Box Opening)
                  </div>
                )}

                {/* Emerging Invitation Card Preview inside Envelope (spaced cleanly below top flap) */}
                <div
                  ref={emergingCardRef}
                  className="relative z-10 w-full rounded-xl bg-white border border-[#C5A059]/45 p-5 shadow-md space-y-2 mt-16"
                >
                  <span className="block text-[11px] text-[#8C6239] font-semibold">
                    {activeSceneIndex === 7
                      ? 'دفترچه چندصفحه‌ای مراسم (صفحه ۲ از ۳)'
                      : activeSceneIndex < 2
                        ? 'پاکت کتان دست‌ساز موم‌دار — آماده گشودن'
                        : meta.title}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#1C1B1A]">
                    {meta.hostsHeadline}
                  </h2>
                  <p className="text-xs text-[#5C5549] leading-relaxed">{meta.invitationProse}</p>
                  <p className="text-xs font-bold text-[#8C6239] pt-1 tabular-nums">
                    {meta.dateLabel}
                  </p>
                </div>

                {/* Dedicated Three.js 3D Brushed-Gold Wax Seal Canvas Container */}
                <div className="relative z-30 mt-2 flex flex-col items-center">
                  <div
                    ref={sealCanvasMountRef}
                    onClick={() =>
                      setActiveSceneIndex((prev) =>
                        Math.min(prev + 1, CINEMATIC_SCENES_CATALOG.length - 1)
                      )
                    }
                    title="لمس مُهر موم سه‌بعدی برای رفتن به صحنه بعد"
                    className="w-[140px] h-[140px] flex items-center justify-center cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-[#8C6239] -mt-1">
                    مُهر موم سه‌بعدی ({template.openingSequence.waxSealMonogram}) — لمس برای گام بعد
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Scene 9: Final Invitation Presentation using Reusable Schema-Driven Renderer */
            <div className="flex flex-col items-center space-y-4">
              <TemplateSchemaRenderer template={template} locale={locale} scale={0.82} />
              {onCompleteToRsvp && (
                <button
                  type="button"
                  onClick={onCompleteToRsvp}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b58e47] text-[#1C1B1A] text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  مشاهده فرم ثبت حضور مهمان (RSVP) و نقشه مراسم
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="px-3 py-1 rounded-t-lg bg-[#262320] border border-b-0 border-[#C5A059]/30 text-[11px] text-[#EAE3D5] cursor-pointer"
          >
            {dockCollapsed
              ? '▴ نمایش نوار کنترل ۹ صحنه سینمایی'
              : '▾ جمع کردن نوار کنترل (Zen Mode)'}
          </button>
        </div>

        {!dockCollapsed && (
          <div className="rounded-2xl bg-[#262320] border border-[#C5A059]/35 p-4 space-y-3">
            {/* 9-Scene Step Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {CINEMATIC_SCENES_CATALOG.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setIsAutoPlayingSequence(false);
                    setActiveSceneIndex(idx);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeSceneIndex === idx
                      ? 'bg-[#C5A059] text-[#1C1B1A] font-extrabold'
                      : 'bg-white/5 text-[#EAE3D5] hover:bg-white/10'
                  }`}
                >
                  {sc.titleFa}
                </button>
              ))}
            </div>

            {/* Playback, Duration, Easing & Reduced Motion Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSceneIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeSceneIndex === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 text-white flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>صحنه قبل</span>
                </button>

                <button
                  type="button"
                  onClick={handlePlayFullSequence}
                  className="px-4 py-1.5 rounded-lg bg-[#C5A059] hover:bg-[#b38f4a] text-[#1C1B1A] font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {isAutoPlayingSequence ? 'در حال پخش خودکار...' : 'پخش پیوسته هر ۹ صحنه'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSceneIndex((prev) =>
                      Math.min(CINEMATIC_SCENES_CATALOG.length - 1, prev + 1)
                    )
                  }
                  disabled={activeSceneIndex === CINEMATIC_SCENES_CATALOG.length - 1}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>صحنه بعد</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] text-[#EAE3D5]">
                  <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>سرعت:</span>
                  <select
                    value={durationMultiplier}
                    onChange={(e) => setDurationMultiplier(Number(e.target.value))}
                    className="bg-[#181615] border border-white/20 rounded px-2 py-1 text-white"
                  >
                    <option value={0.6}>سریع (0.6x)</option>
                    <option value={1.0}>استاندارد (1.0x)</option>
                    <option value={1.5}>سینمایی آرام (1.5x)</option>
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-[#EAE3D5]">
                  <span>منحنی حرکت (Easing):</span>
                  <select
                    value={easingPreset}
                    onChange={(e) =>
                      setEasingPreset(e.target.value as 'power3.inOut' | 'expo.out' | 'back.out')
                    }
                    className="bg-[#181615] border border-white/20 rounded px-2 py-1 text-white font-mono"
                  >
                    <option value="power3.inOut">power3.inOut</option>
                    <option value="expo.out">expo.out</option>
                    <option value="back.out">back.out</option>
                  </select>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-[#EAE3D5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="rounded"
                  />
                  <span>حالت کم‌حرکت (Reduced Motion)</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
