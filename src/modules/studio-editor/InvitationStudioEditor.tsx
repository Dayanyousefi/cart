import React, { useEffect, useRef, useState, useCallback } from 'react';
import Konva from 'konva';
import {
  Type,
  Image as ImageIcon,
  Square,
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Save,
  Eye,
  History,
  Upload,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Globe,
  Grid,
  FolderKanban,
} from 'lucide-react';
import {
  INITIAL_MASTER_TEMPLATES,
  type CanvasElementSpec,
  type ValidatedTemplateSpec,
  type SupportedLocale,
} from '../template-engine/template-schema';

interface StudioEditorProps {
  initialTemplate?: ValidatedTemplateSpec;
  onOpenCinematicPreview?: (
    template: ValidatedTemplateSpec,
    customElements: CanvasElementSpec[],
    locale: SupportedLocale
  ) => void;
}

interface VersionSnapshot {
  versionId: string;
  label: string;
  savedAt: string;
  elements: CanvasElementSpec[];
}

export const InvitationStudioEditor: React.FC<StudioEditorProps> = ({
  initialTemplate,
  onOpenCinematicPreview,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<ValidatedTemplateSpec>(
    initialTemplate ?? INITIAL_MASTER_TEMPLATES[0]
  );
  const [locale, setLocale] = useState<SupportedLocale>('fa');
  const [elements, setElements] = useState<CanvasElementSpec[]>(
    () => (initialTemplate ?? INITIAL_MASTER_TEMPLATES[0]).elements
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    (initialTemplate ?? INITIAL_MASTER_TEMPLATES[0]).elements[0]?.id ?? null
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // Undo / Redo Stacks
  const [undoStack, setUndoStack] = useState<CanvasElementSpec[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElementSpec[][]>([]);

  // Zoom, Snap Guides, and Active Scene/Page Tab
  const [zoom, setZoom] = useState<number>(0.85);
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [activeBottomSceneTab, setActiveBottomSceneTab] = useState<
    'main_card' | 'envelope_cover' | 'rsvp_card' | 'details_page'
  >('main_card');

  // Inline Text Editing Input
  const [inlineEditingText, setInlineEditingText] = useState<string>('');

  // Autosave & PostgreSQL Save Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('چند لحظه پیش (PostgreSQL)');
  const [versionHistory, setVersionHistory] = useState<VersionSnapshot[]>([
    {
      versionId: 'v_initial',
      label: 'نسخه پایه قالب (بدون تغییر در قالب اصلی)',
      savedAt: new Date().toLocaleTimeString('fa-IR'),
      elements: (initialTemplate ?? INITIAL_MASTER_TEMPLATES[0]).elements,
    },
  ]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Konva Stage & Refs
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const guidesLayerRef = useRef<Konva.Layer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedElement = elements.find((el) => el.id === selectedId) ?? null;

  // Push state to undo stack before mutating elements
  const updateElementsWithHistory = useCallback(
    (updater: CanvasElementSpec[] | ((prev: CanvasElementSpec[]) => CanvasElementSpec[])) => {
      setElements((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        setUndoStack((u) => [...u.slice(-19), prev]);
        setRedoStack([]);
        setSaveStatus('unsaved');
        return next;
      });
    },
    []
  );

  // Switch Master Template without mutating original template definitions
  const handleSelectMasterTemplate = (tpl: ValidatedTemplateSpec) => {
    const clonedElements: CanvasElementSpec[] = JSON.parse(JSON.stringify(tpl.elements));
    setActiveTemplate(tpl);
    setElements(clonedElements);
    setSelectedId(clonedElements[0]?.id ?? null);
    setUndoStack([]);
    setRedoStack([]);
    setSaveStatus('unsaved');
  };

  // Sync inline editor text when selected element changes
  useEffect(() => {
    if (selectedElement) {
      const val =
        locale === 'fa'
          ? selectedElement.textFa
          : locale === 'ar'
            ? selectedElement.textAr || selectedElement.textFa
            : selectedElement.textEn;
      setInlineEditingText(val || '');
    } else {
      setInlineEditingText('');
    }
  }, [selectedElement, locale]);

  // Save Project to PostgreSQL Backend
  const saveProjectToPostgres = useCallback(
    async (label = 'ذخیره دستی پروژه در PostgreSQL') => {
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/v1/invite/studio/save-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `${activeTemplate.localizedMeta.fa.title} — نسخه شخصی‌سازی‌شده`,
            locale,
            envelopeStyle: activeTemplate.openingSequence.envelopeStyle,
            waxSealMonogram: activeTemplate.openingSequence.waxSealMonogram,
            canvasStateJson: {
              templateSlug: activeTemplate.slug,
              canvasWidth: activeTemplate.canvasWidth,
              canvasHeight: activeTemplate.canvasHeight,
              backgroundColor: activeTemplate.palette.backgroundHex,
              elements,
            },
            openingSceneConfigJson: activeTemplate.openingSequence,
            audioConfigJson: activeTemplate.audioConfig,
            versionLabel: label,
          }),
        });
        if (res.ok) {
          const nowStr = new Date().toLocaleTimeString('fa-IR');
          setSaveStatus('saved');
          setLastSavedTime(nowStr);
          setVersionHistory((prev) => [
            {
              versionId: `v_${Date.now()}`,
              label,
              savedAt: nowStr,
              elements: JSON.parse(JSON.stringify(elements)),
            },
            ...prev.slice(0, 11),
          ]);
        } else {
          setSaveStatus('unsaved');
        }
      } catch {
        setSaveStatus('unsaved');
      }
    },
    [activeTemplate, elements, locale]
  );

  // Autosave debounce when unsaved changes occur
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const timer = window.setTimeout(() => {
      void saveProjectToPostgres('ذخیره خودکار (Autosave)');
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [saveStatus, saveProjectToPostgres]);

  // Build & Render Native Konva.Stage inside stageContainerRef
  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return;

    const width = activeTemplate.canvasWidth;
    const height = activeTemplate.canvasHeight;

    if (!stageRef.current) {
      const stage = new Konva.Stage({
        container,
        width: width * zoom,
        height: height * zoom,
        scaleX: zoom,
        scaleY: zoom,
      });
      const mainLayer = new Konva.Layer();
      const guidesLayer = new Konva.Layer();
      stage.add(mainLayer);
      stage.add(guidesLayer);
      stageRef.current = stage;
      layerRef.current = mainLayer;
      guidesLayerRef.current = guidesLayer;
    }

    const stage = stageRef.current;
    const layer = layerRef.current!;
    const guidesLayer = guidesLayerRef.current!;

    stage.width(width * zoom);
    stage.height(height * zoom);
    stage.scale({ x: zoom, y: zoom });

    layer.destroyChildren();
    guidesLayer.destroyChildren();

    // 1. Background Surface
    const bgRect = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: activeTemplate.palette.surfaceHex || activeTemplate.palette.backgroundHex,
      listening: true,
    });
    bgRect.on('click tap', () => {
      setSelectedId(null);
    });
    layer.add(bgRect);

    // 2. Render sorted elements by zIndex
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    let selectedNode: Konva.Node | null = null;

    sorted.forEach((el) => {
      if (el.type === 'ORNAMENT_FRAME' || el.type === 'DIVIDER') {
        const rectNode = new Konva.Rect({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          height: Math.max(el.height, el.type === 'DIVIDER' ? 3 : 20),
          fill: el.type === 'DIVIDER' ? el.fill : undefined,
          stroke: el.fill || activeTemplate.palette.accentGoldHex,
          strokeWidth: el.type === 'DIVIDER' ? 1.5 : 2,
          cornerRadius: el.type === 'ORNAMENT_FRAME' ? 14 : 0,
          opacity: el.opacity,
          rotation: el.rotation,
          draggable: !el.isLocked,
        });

        rectNode.on('click tap', (e) => {
          e.cancelBubble = true;
          setSelectedId(el.id);
        });

        rectNode.on('dragmove', () => {
          guidesLayer.destroyChildren();
          if (snapEnabled) {
            const centerX = width / 2;
            const nodeCenterX = rectNode.x() + rectNode.width() / 2;
            if (Math.abs(nodeCenterX - centerX) < 8) {
              rectNode.x(centerX - rectNode.width() / 2);
              const guideLine = new Konva.Line({
                points: [centerX, 0, centerX, height],
                stroke: '#C5A059',
                strokeWidth: 1.5,
                dash: [6, 4],
              });
              guidesLayer.add(guideLine);
            }
          }
          guidesLayer.batchDraw();
        });

        rectNode.on('dragend transformend', () => {
          guidesLayer.destroyChildren();
          guidesLayer.batchDraw();
          const newX = Math.round(rectNode.x());
          const newY = Math.round(rectNode.y());
          const newW = Math.max(20, Math.round(rectNode.width() * rectNode.scaleX()));
          const newH = Math.max(4, Math.round(rectNode.height() * rectNode.scaleY()));
          const newRot = Math.round(rectNode.rotation());
          rectNode.scaleX(1);
          rectNode.scaleY(1);

          updateElementsWithHistory((prev) =>
            prev.map((item) =>
              item.id === el.id
                ? { ...item, x: newX, y: newY, width: newW, height: newH, rotation: newRot }
                : item
            )
          );
        });

        layer.add(rectNode);
        if (el.id === selectedId) {
          selectedNode = rectNode;
        }
      } else {
        // Text, Badge, or Image Placeholder rendered on Konva Canvas
        const textContent =
          locale === 'fa'
            ? el.textFa
            : locale === 'ar'
              ? el.textAr || el.textFa
              : el.textEn || el.textFa;

        const textNode = new Konva.Text({
          id: el.id,
          x: el.x,
          y: el.y,
          width: el.width,
          text: textContent || el.name,
          fontSize: el.fontSize,
          fontFamily: el.fontFamily || 'Vazirmatn',
          fontStyle: el.fontWeight === 'bold' ? 'bold' : 'normal',
          fill: el.fill,
          align: el.align,
          lineHeight: el.lineHeight || 1.5,
          letterSpacing: el.letterSpacing || 0,
          opacity: el.opacity,
          rotation: el.rotation,
          draggable: !el.isLocked,
          padding: 6,
        });

        textNode.on('click tap', (e) => {
          e.cancelBubble = true;
          setSelectedId(el.id);
        });

        textNode.on('dragmove', () => {
          guidesLayer.destroyChildren();
          if (snapEnabled) {
            const centerX = width / 2;
            const nodeCenterX = textNode.x() + textNode.width() / 2;
            if (Math.abs(nodeCenterX - centerX) < 10) {
              textNode.x(centerX - textNode.width() / 2);
              const vGuide = new Konva.Line({
                points: [centerX, 0, centerX, height],
                stroke: '#C5A059',
                strokeWidth: 1.5,
                dash: [6, 4],
              });
              guidesLayer.add(vGuide);
            }
            const centerY = height / 2;
            const nodeCenterY = textNode.y() + textNode.height() / 2;
            if (Math.abs(nodeCenterY - centerY) < 10) {
              textNode.y(centerY - textNode.height() / 2);
              const hGuide = new Konva.Line({
                points: [0, centerY, width, centerY],
                stroke: '#1E4D3B',
                strokeWidth: 1.5,
                dash: [6, 4],
              });
              guidesLayer.add(hGuide);
            }
          }
          guidesLayer.batchDraw();
        });

        textNode.on('dragend transformend', () => {
          guidesLayer.destroyChildren();
          guidesLayer.batchDraw();
          const newX = Math.round(textNode.x());
          const newY = Math.round(textNode.y());
          const newW = Math.max(60, Math.round(textNode.width() * textNode.scaleX()));
          const newRot = Math.round(textNode.rotation());
          textNode.scaleX(1);
          textNode.scaleY(1);

          updateElementsWithHistory((prev) =>
            prev.map((item) =>
              item.id === el.id
                ? { ...item, x: newX, y: newY, width: newW, rotation: newRot }
                : item
            )
          );
        });

        layer.add(textNode);
        if (el.id === selectedId) {
          selectedNode = textNode;
        }
      }
    });

    // 3. Attach Konva.Transformer to active selection
    if (selectedNode) {
      const tr = new Konva.Transformer({
        nodes: [selectedNode],
        borderStroke: '#C5A059',
        borderStrokeWidth: 1.5,
        anchorStroke: '#1C1B1A',
        anchorFill: '#FAF7F2',
        anchorSize: 9,
        rotateAnchorOffset: 24,
        enabledAnchors: [
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
          'middle-left',
          'middle-right',
        ],
      });
      layer.add(tr);
    }

    layer.batchDraw();
  }, [activeTemplate, elements, selectedId, zoom, locale, snapEnabled, updateElementsWithHistory]);

  // Cleanup Konva Stage on unmount
  useEffect(() => {
    return () => {
      if (stageRef.current) {
        stageRef.current.destroy();
        stageRef.current = null;
      }
    };
  }, []);

  // Studio Tool Actions
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, elements]);
    setUndoStack((u) => u.slice(0, -1));
    setElements(previous);
    setSaveStatus('unsaved');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, elements]);
    setRedoStack((r) => r.slice(0, -1));
    setElements(next);
    setSaveStatus('unsaved');
  };

  const handleAddTextLayer = () => {
    const newId = `el_text_${Date.now()}`;
    const newLayer: CanvasElementSpec = {
      id: newId,
      type: 'TEXT',
      name: 'لایه متن جدید',
      x: 60,
      y: 320,
      width: 400,
      height: 60,
      rotation: 0,
      zIndex: elements.length + 1,
      isLocked: false,
      opacity: 1,
      textFa: 'متن دعوت‌نامه سفارشی خود را اینجا بنویسید',
      textEn: 'Write your custom luxury invitation text here',
      textAr: 'اكتب نص الدعوة المخصص هنا',
      fontFamily: locale === 'en' ? 'Cormorant Garamond' : 'Vazirmatn',
      fontSize: 20,
      fontWeight: 'bold',
      letterSpacing: 0,
      lineHeight: 1.6,
      align: 'center',
      fill: activeTemplate.palette.primaryTextHex,
    };
    updateElementsWithHistory((prev) => [...prev, newLayer]);
    setSelectedId(newId);
  };

  const handleAddOrnamentBorder = () => {
    const newId = `el_ornament_${Date.now()}`;
    const newLayer: CanvasElementSpec = {
      id: newId,
      type: 'ORNAMENT_FRAME',
      name: 'کادر طلاکوب تزئینی',
      x: 36,
      y: 36,
      width: activeTemplate.canvasWidth - 72,
      height: activeTemplate.canvasHeight - 72,
      rotation: 0,
      zIndex: elements.length + 1,
      isLocked: false,
      opacity: 0.85,
      textFa: '',
      textEn: '',
      textAr: '',
      fontFamily: 'Vazirmatn',
      fontSize: 16,
      fontWeight: 'normal',
      letterSpacing: 0,
      lineHeight: 1.4,
      align: 'center',
      fill: '#C5A059',
    };
    updateElementsWithHistory((prev) => [...prev, newLayer]);
    setSelectedId(newId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newId = `el_img_${Date.now()}`;
    const newLayer: CanvasElementSpec = {
      id: newId,
      type: 'TEXT',
      name: `تصویر: ${file.name.slice(0, 18)}`,
      x: 90,
      y: 240,
      width: 340,
      height: 80,
      rotation: 0,
      zIndex: elements.length + 1,
      isLocked: false,
      opacity: 1,
      textFa: `✦ [قاب تصویر اختصاصی: ${file.name}] ✦`,
      textEn: `✦ [Custom Portrait Asset: ${file.name}] ✦`,
      textAr: `✦ [صورة مخصصة: ${file.name}] ✦`,
      fontFamily: 'Vazirmatn',
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0,
      lineHeight: 1.5,
      align: 'center',
      fill: '#C5A059',
    };
    updateElementsWithHistory((prev) => [...prev, newLayer]);
    setSelectedId(newId);
  };

  const handleDuplicateSelected = () => {
    if (!selectedElement) return;
    const copyId = `${selectedElement.id}_copy_${Date.now().toString().slice(-3)}`;
    const copy: CanvasElementSpec = {
      ...selectedElement,
      id: copyId,
      name: `${selectedElement.name} (کپی)`,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      zIndex: elements.length + 1,
      isLocked: false,
    };
    updateElementsWithHistory((prev) => [...prev, copy]);
    setSelectedId(copyId);
  };

  const handleDeleteSelected = () => {
    if (!selectedElement || selectedElement.isLocked) return;
    updateElementsWithHistory((prev) => prev.filter((item) => item.id !== selectedElement.id));
    setSelectedId(null);
  };

  const handlePropertyChange = <K extends keyof CanvasElementSpec>(
    key: K,
    value: CanvasElementSpec[K]
  ) => {
    if (!selectedId) return;
    updateElementsWithHistory((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, [key]: value } : item))
    );
  };

  const handleMoveLayerOrder = (direction: 'up' | 'down') => {
    if (!selectedElement) return;
    updateElementsWithHistory((prev) =>
      prev.map((item) => {
        if (item.id !== selectedElement.id) return item;
        return {
          ...item,
          zIndex: direction === 'up' ? item.zIndex + 1 : Math.max(1, item.zIndex - 1),
        };
      })
    );
  };

  const handleToggleGroupSelection = () => {
    if (selectedGroupIds.length > 0) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(elements.filter((e) => !e.isLocked).map((e) => e.id));
    }
  };

  return (
    <section
      dir="rtl"
      className="flex flex-col rounded-2xl border border-[#C5A059]/30 bg-[#1C1B1A] text-[#FAF7F2] shadow-2xl overflow-hidden"
    >
      {/* 1. TOP STUDIO TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C5A059]/25 bg-[#151413] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C5A059]/40 bg-[#C5A059]/15 text-[#C5A059]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#FAF7F2]">
                استودیوی حرفه‌ای طراحی دعوت‌نامه (INVITÉ Konva Studio)
              </h2>
              <span className="rounded-md border border-[#C5A059]/40 bg-[#C5A059]/10 px-2 py-0.5 text-[11px] font-semibold text-[#C5A059]">
                Konva.js + PostgreSQL
              </span>
            </div>
            <p className="text-xs text-[#EAE3D5]/65">
              قالب فعال:{' '}
              <strong className="text-[#C5A059]">{activeTemplate.localizedMeta.fa.title}</strong> •
              تغییرات شما در پروژه مستقل ذخیره می‌شود و قالب اصلی دست‌نخورده باقی می‌ماند
            </p>
          </div>
        </div>

        {/* Center Undo/Redo, Zoom, Snap & Locale Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title="بازگشت (Undo)"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#FAF7F2] hover:border-[#C5A059]/50 disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo ({undoStack.length})</span>
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            title="انجام مجدد (Redo)"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#FAF7F2] hover:border-[#C5A059]/50 disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[#FAF7F2] hover:border-[#C5A059]/50"
            title="کوچک‌نمایی بوم"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[48px] text-center font-mono text-xs text-[#C5A059]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[#FAF7F2] hover:border-[#C5A059]/50"
            title="بزرگ‌نمایی بوم"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setSnapEnabled((s) => !s)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition ${
              snapEnabled
                ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059]'
                : 'border-white/10 bg-white/5 text-[#EAE3D5]/60'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            <span>خطوط راهنما (Snap)</span>
          </button>

          {/* Language / Script Switcher (Persian RTL, English LTR, Arabic RTL) */}
          <div className="flex items-center rounded-lg border border-white/10 bg-black/30 p-0.5 text-xs">
            {(['fa', 'en', 'ar'] as SupportedLocale[]).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocale(loc)}
                className={`rounded-md px-2.5 py-1 font-semibold transition ${
                  locale === loc
                    ? 'bg-[#C5A059] text-[#1C1B1A]'
                    : 'text-[#EAE3D5]/70 hover:text-white'
                }`}
              >
                {loc === 'fa' ? 'فارسی (RTL)' : loc === 'en' ? 'English (LTR)' : 'العربية (RTL)'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Save, Version History & Cinematic Preview Actions */}
        <div className="flex items-center gap-2">
          <span className="hidden xl:flex items-center gap-1.5 text-xs text-[#EAE3D5]/70">
            <CheckCircle2
              className={`h-3.5 w-3.5 ${
                saveStatus === 'saved' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
              }`}
            />
            {saveStatus === 'saved'
              ? `ذخیره شده: ${lastSavedTime}`
              : saveStatus === 'saving'
                ? 'در حال ذخیره در PostgreSQL...'
                : 'تغییرات ذخیره نشده'}
          </span>

          <button
            type="button"
            onClick={() => setShowHistoryDrawer((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#FAF7F2] hover:border-[#C5A059]"
          >
            <History className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>تاریخچه نسخه ({versionHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => void saveProjectToPostgres('ذخیره نسخه توسط طراح در استودیو')}
            className="flex items-center gap-1.5 rounded-lg border border-[#C5A059]/60 bg-[#1E4D3B] px-3.5 py-1.5 text-xs font-bold text-[#FAF7F2] hover:bg-[#1E4D3B]/80"
          >
            <Save className="h-3.5 w-3.5 text-[#C5A059]" />
            <span>ذخیره پروژه</span>
          </button>

          {onOpenCinematicPreview && (
            <button
              type="button"
              onClick={() => onOpenCinematicPreview(activeTemplate, elements, locale)}
              className="flex items-center gap-1.5 rounded-lg bg-[#C5A059] px-3.5 py-1.5 text-xs font-bold text-[#1C1B1A] shadow-md hover:bg-[#d4b26a]"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>پیش‌نمایش سینمایی ۳بعدی</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Version History Drawer */}
      {showHistoryDrawer && (
        <div className="border-b border-[#C5A059]/30 bg-[#23211F] px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#C5A059]">
              اسنپ‌شات‌های ذخیره شده پروژه کاربر (Project Version History)
            </span>
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(false)}
              className="text-xs text-[#EAE3D5]/70 hover:text-white"
            >
              بستن ×
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {versionHistory.map((ver) => (
              <button
                key={ver.versionId}
                type="button"
                onClick={() => {
                  updateElementsWithHistory(JSON.parse(JSON.stringify(ver.elements)));
                }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs hover:border-[#C5A059]"
              >
                <span className="font-semibold text-[#FAF7F2]">{ver.label}</span>
                <span className="text-[11px] text-[#C5A059]">{ver.savedAt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN 3-COLUMN STUDIO BODY: Left Tools Panel | Central Konva Canvas | Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        {/* 2. LEFT TOOLS & LAYERS PANEL (3 Columns) */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-l border-white/10 bg-[#181716] p-4 flex flex-col gap-5">
          {/* Master Template Selector */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#C5A059]">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>انتخاب قالب پایه (۵ قالب استاندارد):</span>
            </label>
            <div className="space-y-1.5">
              {INITIAL_MASTER_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectMasterTemplate(tpl)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-right text-xs transition ${
                    activeTemplate.id === tpl.id
                      ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#FAF7F2] font-bold'
                      : 'border-white/10 bg-white/5 text-[#EAE3D5]/75 hover:border-white/25'
                  }`}
                >
                  <span>{tpl.localizedMeta.fa.title}</span>
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/30"
                    style={{ backgroundColor: tpl.palette.backgroundHex }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Add Elements Tools */}
          <div>
            <p className="mb-2 text-xs font-bold text-[#C5A059]">افزودن المان به بوم Konva:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAddTextLayer}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[#FAF7F2] hover:border-[#C5A059] hover:bg-[#C5A059]/15"
              >
                <Type className="h-4 w-4 text-[#C5A059]" />
                <span>افزودن متن</span>
              </button>

              <button
                type="button"
                onClick={handleAddOrnamentBorder}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-xs font-semibold text-[#FAF7F2] hover:border-[#C5A059] hover:bg-[#C5A059]/15"
              >
                <Square className="h-4 w-4 text-[#C5A059]" />
                <span>کادر طلاکوب</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#C5A059]/50 bg-[#C5A059]/10 px-3 py-2.5 text-xs font-semibold text-[#C5A059] hover:bg-[#C5A059]/20"
              >
                <Upload className="h-4 w-4" />
                <span>آپلود تصویر یا مونوگرام اختصاصی</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Layer Management & Group/Lock Controls */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#C5A059]">
                <Layers className="h-3.5 w-3.5" />
                <span>مدیریت لایه‌ها ({elements.length})</span>
              </span>
              <button
                type="button"
                onClick={handleToggleGroupSelection}
                className="text-[11px] text-[#EAE3D5]/75 hover:text-[#C5A059]"
              >
                {selectedGroupIds.length > 0 ? 'لغو گروه‌بندی (Ungroup)' : 'گروه‌بندی (Group)'}
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[290px] pr-1">
              {[...elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const isSelected = el.id === selectedId || selectedGroupIds.includes(el.id);
                  return (
                    <div
                      key={el.id}
                      onClick={() => setSelectedId(el.id)}
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-2 cursor-pointer text-xs transition ${
                        isSelected
                          ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#FAF7F2]'
                          : 'border-white/10 bg-black/25 text-[#EAE3D5]/75 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-[#C5A059]">#{el.zIndex}</span>
                        <span className="truncate font-medium">{el.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateElementsWithHistory((prev) =>
                              prev.map((item) =>
                                item.id === el.id ? { ...item, isLocked: !item.isLocked } : item
                              )
                            );
                          }}
                          className="p-1 text-[#EAE3D5]/70 hover:text-[#C5A059]"
                          title={el.isLocked ? 'باز کردن قفل لایه' : 'قفل کردن المان تزئینی'}
                        >
                          {el.isLocked ? (
                            <Lock className="h-3.5 w-3.5 text-amber-400" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 3. CENTRAL INTERACTIVE KONVA CANVAS WORKSPACE (6 Columns) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-between bg-[#121110] p-6 relative overflow-auto">
          <div className="mb-3 flex items-center justify-between w-full max-w-[540px] text-xs text-[#EAE3D5]/70">
            <span>
              ابعاد بوم استاندارد: {activeTemplate.canvasWidth} × {activeTemplate.canvasHeight}{' '}
              پیکسل
            </span>
            <span className="text-[#C5A059]">
              برای جابه‌جایی، تغییر اندازه یا چرخش روی المان‌های بوم کلیک کنید
            </span>
          </div>

          {/* Interactive Konva Stage Mount Point */}
          <div className="relative flex items-center justify-center rounded-2xl border-2 border-[#C5A059]/40 bg-[#1C1B1A] p-3 shadow-[0_25px_70px_rgba(0,0,0,0.75)]">
            <div
              ref={stageContainerRef}
              data-testid="konva-studio-stage"
              className="overflow-hidden rounded-lg shadow-inner"
            />
          </div>

          {/* Inline Quick Text Editor Bar directly beneath Canvas */}
          {selectedElement && (
            <div className="mt-4 w-full max-w-[540px] rounded-xl border border-[#C5A059]/35 bg-[#1C1B1A] p-3">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="font-bold text-[#C5A059]">
                  ویرایش مستقیم متن لایه انتخاب‌شده ({selectedElement.name}):
                </span>
                <span className="text-[11px] text-[#EAE3D5]/60">
                  زبان در حال ویرایش: {locale.toUpperCase()}
                </span>
              </div>
              <textarea
                rows={2}
                dir={locale === 'en' ? 'ltr' : 'rtl'}
                value={inlineEditingText}
                disabled={selectedElement.isLocked}
                onChange={(e) => {
                  const val = e.target.value;
                  setInlineEditingText(val);
                  const key = locale === 'fa' ? 'textFa' : locale === 'ar' ? 'textAr' : 'textEn';
                  handlePropertyChange(key, val);
                }}
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-[#FAF7F2] focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
                placeholder="متن این بخش را وارد کنید..."
              />
            </div>
          )}
        </div>

        {/* 4. RIGHT PROPERTIES INSPECTOR PANEL (3 Columns) */}
        <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-r border-white/10 bg-[#181716] p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="text-xs font-bold text-[#C5A059]">
              بازرس ویژگی‌های المان (Properties Inspector)
            </h3>
            {selectedElement && (
              <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-[#EAE3D5]">
                {selectedElement.type}
              </span>
            )}
          </div>

          {!selectedElement ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-6 text-xs text-[#EAE3D5]/60">
              <ImageIcon className="h-8 w-8 text-[#C5A059]/50 mb-2" />
              <p>یک لایه یا متن را روی بوم انتخاب کنید تا تنظیمات دقیق آن نمایش داده شود.</p>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Quick Actions: Duplicate, Lock, Reorder, Delete */}
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={handleDuplicateSelected}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-2 hover:border-[#C5A059]"
                >
                  <Copy className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span className="text-[10px]">کپی</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveLayerOrder('up')}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-2 hover:border-[#C5A059]"
                >
                  <MoveUp className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span className="text-[10px]">بالاتر</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveLayerOrder('down')}
                  className="flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 py-2 hover:border-[#C5A059]"
                >
                  <MoveDown className="h-3.5 w-3.5 text-[#C5A059]" />
                  <span className="text-[10px]">پایین‌تر</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={selectedElement.isLocked}
                  className="flex flex-col items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2 text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="text-[10px]">حذف</span>
                </button>
              </div>

              {/* Coordinates, Width & Rotation */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">مختصات X</label>
                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(e) => handlePropertyChange('x', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">مختصات Y</label>
                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(e) => handlePropertyChange('y', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">چرخش (°)</label>
                  <input
                    type="number"
                    value={selectedElement.rotation}
                    onChange={(e) => handlePropertyChange('rotation', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
              </div>

              {/* Font Family & Size */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#EAE3D5]">
                  خانواده فونت (Persian / Latin / Arabic):
                </label>
                <select
                  value={selectedElement.fontFamily}
                  onChange={(e) => handlePropertyChange('fontFamily', e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-2.5 py-2 text-xs text-[#FAF7F2]"
                >
                  <option value="Vazirmatn">وزیرمتن (Vazirmatn — فارسی و عربی)</option>
                  <option value="Cormorant Garamond">
                    Cormorant Garamond (Luxury Serif — لاتین)
                  </option>
                  <option value="Playfair Display">Playfair Display (Editorial — لاتین)</option>
                  <option value="Amiri">امیری کلاسیک (Amiri — خوشنویسی)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">
                    اندازه قلم (px)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={96}
                    value={selectedElement.fontSize}
                    onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">رنگ المان</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={
                        selectedElement.fill.startsWith('#') ? selectedElement.fill : '#C5A059'
                      }
                      onChange={(e) => handlePropertyChange('fill', e.target.value)}
                      className="h-7 w-8 cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={selectedElement.fill}
                      onChange={(e) => handlePropertyChange('fill', e.target.value)}
                      className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-[11px] text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Letter Spacing & Line Height */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">
                    فاصله خطوط (Line Height)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.9}
                    max={3}
                    value={selectedElement.lineHeight}
                    onChange={(e) => handlePropertyChange('lineHeight', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">
                    فاصله حروف (Letter Spacing)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={-2}
                    max={20}
                    value={selectedElement.letterSpacing}
                    onChange={(e) => handlePropertyChange('letterSpacing', Number(e.target.value))}
                    className="w-full rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-xs text-white"
                  />
                </div>
              </div>

              {/* Text Alignment Controls */}
              <div>
                <label className="block text-[10px] text-[#EAE3D5]/60 mb-1">
                  تراز متن (Alignment)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { align: 'right', icon: AlignRight, label: 'راست‌چین' },
                      { align: 'center', icon: AlignCenter, label: 'وسط‌چین' },
                      { align: 'left', icon: AlignLeft, label: 'چپ‌چین' },
                    ] as const
                  ).map((btn) => {
                    const IconComp = btn.icon;
                    return (
                      <button
                        key={btn.align}
                        type="button"
                        onClick={() => handlePropertyChange('align', btn.align)}
                        className={`flex items-center justify-center gap-1 rounded border py-1.5 text-[11px] ${
                          selectedElement.align === btn.align
                            ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059]'
                            : 'border-white/10 bg-black/30 text-[#EAE3D5]/70'
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Luxury Brand Color Swatches */}
              <div>
                <label className="block text-[10px] text-[#EAE3D5]/60 mb-1.5">
                  پالت رنگ‌های استاندارد INVITÉ:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { hex: '#FAF7F2', name: 'Warm Ivory' },
                    { hex: '#C5A059', name: 'Champagne Gold' },
                    { hex: '#1C1B1A', name: 'Deep Charcoal' },
                    { hex: '#1E4D3B', name: 'Muted Emerald' },
                    { hex: '#EAE3D5', name: 'Soft Beige' },
                    { hex: '#6B1D2F', name: 'Royal Crimson' },
                  ].map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      title={swatch.name}
                      onClick={() => handlePropertyChange('fill', swatch.hex)}
                      className="h-6 w-6 rounded-full border border-white/30 transition hover:scale-110"
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM SCENE & PAGE TIMELINE */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#C5A059]/25 bg-[#151413] px-5 py-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#C5A059]" />
          <span className="text-xs font-bold text-[#EAE3D5]">
            تایم‌لاین صفحات و صحنه‌های دعوت‌نامه (Scene & Page Timeline):
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'envelope_cover', label: '۱. پاکت و مهر موم ۳بعدی' },
            { id: 'main_card', label: '۲. کارت اصلی دعوت‌نامه (در حال ویرایش)' },
            { id: 'details_page', label: '۳. کارت جزئیات مکان و نقشه' },
            { id: 'rsvp_card', label: '۴. برگ تایید حضور مهمان (RSVP)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveBottomSceneTab(
                  tab.id as 'main_card' | 'envelope_cover' | 'rsvp_card' | 'details_page'
                )
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                activeBottomSceneTab === tab.id
                  ? 'border-[#C5A059] bg-[#C5A059]/20 text-[#C5A059]'
                  : 'border-white/10 bg-white/5 text-[#EAE3D5]/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
